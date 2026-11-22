import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const op = await import("@/lib/server/online-payments");

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

// Fila mínima de una reserva para las opciones de pago.
const row = (p: { status: string; total: number; deposit: number; paid?: number; code?: string }) =>
  ({ code: p.code ?? "ECR-AAAAA", status: p.status, quote: { total: p.total, deposit: p.deposit }, paid_amount: p.paid ?? 0 }) as never;

beforeEach(() => {
  vi.stubEnv("WOMPI_PUBLIC_KEY", "pub_test_abc");
  vi.stubEnv("WOMPI_PRIVATE_KEY", "prv_test_abc");
  vi.stubEnv("WOMPI_INTEGRITY_SECRET", "test_integrity_x");
  vi.stubEnv("WOMPI_EVENTS_SECRET", "test_events_y");
  vi.stubEnv("PAY_LINK_SECRET", "secreto-de-enlaces");
});
afterEach(() => vi.unstubAllEnvs());

describe("opciones de pago en línea", () => {
  it("sin abono: el abono o el total; confirmada: el saldo; pagada o cancelada: nada", () => {
    expect(op.payOptions([row({ status: "pending_deposit", total: 400000, deposit: 120000 })])).toEqual([
      { kind: "deposit", amount: 120000 },
      { kind: "full", amount: 400000 },
    ]);
    expect(op.payOptions([row({ status: "confirmed", total: 400000, deposit: 120000, paid: 120000 })])).toEqual([{ kind: "balance", amount: 280000 }]);
    expect(op.payOptions([row({ status: "confirmed", total: 400000, deposit: 120000, paid: 400000 })])).toEqual([]);
    expect(op.payOptions([row({ status: "cancelled", total: 400000, deposit: 120000 })])).toEqual([]);
  });

  it("abono del 100 %: solo el total; un grupo suma sus cabañas (sin las canceladas)", () => {
    expect(op.payOptions([row({ status: "pending_deposit", total: 300000, deposit: 300000 })])).toEqual([{ kind: "full", amount: 300000 }]);
    expect(
      op.payOptions([
        row({ status: "pending_deposit", total: 400000, deposit: 120000 }),
        row({ status: "pending_deposit", total: 200000, deposit: 60000, code: "ECR-BBBBB" }),
        row({ status: "cancelled", total: 900000, deposit: 270000, code: "ECR-CCCCC" }),
      ]),
    ).toEqual([
      { kind: "deposit", amount: 180000 },
      { kind: "full", amount: 600000 },
    ]);
  });
});

describe("enlace de pago", () => {
  it("la firma depende del código y del secreto, y se valida sin revelar nada", () => {
    const k = op.payLinkKey("ECR-AAAAA");
    expect(k).toMatch(/^[\w-]{22}$/);
    expect(op.validPayLinkKey("ECR-AAAAA", k)).toBe(true);
    expect(op.validPayLinkKey("ECR-BBBBB", k)).toBe(false);
    expect(op.validPayLinkKey("ECR-AAAAA", "x")).toBe(false);
    vi.stubEnv("PAY_LINK_SECRET", "otro");
    expect(op.validPayLinkKey("ECR-AAAAA", k)).toBe(false);
    expect(op.payLinkUrl("https://x.co", "ECR-AAAAA")).toBe(`https://x.co/pagar?code=ECR-AAAAA&k=${op.payLinkKey("ECR-AAAAA")}`);
  });
});

describe("Wompi", () => {
  it("activo con llaves; de pruebas con pub_test_", () => {
    expect(op.activeProvider()).toBe("wompi");
    expect(op.isSandbox()).toBe(true);
  });

  it("transacción solo con tarjeta, firmada: referencia + centavos + moneda + secreto de integridad", () => {
    const acc = { acceptanceToken: "acc", personalToken: "per", termsUrl: "https://t", privacyUrl: "https://p" };
    const body = op.cardTransactionBody(
      { reference: "ECR-AAAAA-A-K3M9QZ", amount: 120000 },
      { email: "a@x.co", fullName: "Ana Ruiz", phone: "+573001234567", docType: "CC", docNumber: "123" },
      { token: "tok_test_1", installments: 3 },
      acc,
      "http://localhost:3000",
    );
    expect(body.amount_in_cents).toBe(12000000);
    expect(body.signature).toBe(sha("ECR-AAAAA-A-K3M9QZ12000000COPtest_integrity_x"));
    expect(body.payment_method).toEqual({ type: "CARD", token: "tok_test_1", installments: 3 });
    expect(body.acceptance_token).toBe("acc");
    expect(body.accept_personal_auth).toBe("per");
    // Wompi no acepta localhost como retorno (3D Secure): se usa un subdominio de localhost.
    expect(body.redirect_url).toBe("http://condor.localhost:3000/pagar/resultado?ref=ECR-AAAAA-A-K3M9QZ");
    expect(body.customer_data).toEqual({ full_name: "Ana Ruiz", phone_number: "573001234567", legal_id: "123", legal_id_type: "CC" });
  });

  it("token de tarjeta y cuotas", () => {
    expect(op.parseCardInput({ token: "tok_test_5113_9bA3f7Ec4e4d2E9c19B1e1D5ff1b9Cc3", installments: 1 })).toEqual({
      token: "tok_test_5113_9bA3f7Ec4e4d2E9c19B1e1D5ff1b9Cc3",
      installments: 1,
    });
    expect(op.parseCardInput({ token: "tok_prod_1-a", installments: 36 })).not.toBeNull();
    expect(op.parseCardInput({ token: "tok_test_1", installments: 0 })).toBeNull();
    expect(op.parseCardInput({ token: "tok_test_1", installments: 37 })).toBeNull();
    expect(op.parseCardInput({ token: "4242424242424242", installments: 1 })).toBeNull();
    expect(op.parseCardInput(null)).toBeNull();
  });

  it("solo acepta eventos con la firma del secreto de eventos", () => {
    const tx = { id: "123-1", reference: "ECR-AAAAA-A-K3M9QZ", status: "APPROVED", amount_in_cents: 12000000, currency: "COP", payment_method_type: "CARD" };
    const properties = ["transaction.id", "transaction.status", "transaction.amount_in_cents"];
    const timestamp = 1764000000;
    const checksum = sha(`123-1APPROVED12000000${timestamp}test_events_y`);
    const event = { event: "transaction.updated", data: { transaction: tx }, signature: { properties, checksum }, timestamp };
    expect(op.parseWompiEvent(event, null)).toMatchObject({ id: "123-1", status: "approved", amountInCents: 12000000, method: "CARD" });
    expect(op.parseWompiEvent({ ...event, signature: { properties, checksum: sha("otra cosa") } }, null)).toBeNull();
    expect(op.parseWompiEvent({ ...event, data: { transaction: { ...tx, amount_in_cents: 1 } } }, null)).toBeNull();
  });

  it("sin llaves: el simulador en desarrollo; en un servidor, solo si se permite", () => {
    vi.stubEnv("WOMPI_PUBLIC_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(op.activeProvider()).toBe("simulado");
    vi.stubEnv("NODE_ENV", "production");
    expect(op.activeProvider()).toBeNull();
    vi.stubEnv("ALLOW_PAYMENT_SIMULATOR", "1");
    expect(op.activeProvider()).toBe("simulado");
  });
});
