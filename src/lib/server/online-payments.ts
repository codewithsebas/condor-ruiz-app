import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Tables } from "@/lib/supabase/database.types";
import type { Db } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import type { OnlinePayOption, PaymentKind } from "@/lib/types";

// Pagos en línea, solo con tarjeta. Con las llaves de Wompi: formulario propio (la tarjeta se tokeniza directo en Wompi),
// transacción firmada creada por el servidor y su resultado por dos caminos, la consulta desde la página de resultado y
// el evento (webhook) firmado; los dos pasan por settle_online_payment, que es idempotente.
// Sin llaves, en desarrollo: un checkout simulado que pasa por las mismas funciones de la base de datos.

type Row = Tables<"reservations">;
export type GatewayStatus = "pending" | "approved" | "declined" | "error";
export type Provider = "wompi" | "simulado";

const wompi = () => {
  const publicKey = env.wompiPublicKey;
  const integrity = env.wompiIntegritySecret;
  if (!publicKey || !integrity) return null;
  return {
    publicKey,
    integrity,
    events: env.wompiEventsSecret ?? "",
    // Solo servidor: Wompi exige la llave privada para consultar una transacción.
    privateKey: env.wompiPrivateKey ?? "",
    api: publicKey.startsWith("pub_prod_") ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1",
  };
};

// Proveedor activo: Wompi con llaves; si no, el simulador donde esté permitido; si tampoco, no hay pagos en línea.
export function activeProvider(): Provider | null {
  if (wompi()) return "wompi";
  return env.paymentSimulator ? "simulado" : null;
}

export const isSandbox = () => !!wompi() && !wompi()!.publicKey.startsWith("pub_prod_");

/* ───────────── Enlace de pago ───────────── */

// Firma del enlace que comparte el equipo (/pagar?code=…&k=…): solo quien la tiene ve los valores y paga, sin el correo.
export function payLinkKey(code: string) {
  const secret = env.payLinkSecret;
  if (!secret) return "";
  return createHmac("sha256", secret).update(`pagar:${code}`).digest("base64url").slice(0, 22);
}

export function validPayLinkKey(code: string, key: string) {
  const expected = payLinkKey(code);
  return !!expected && key.length === expected.length && timingSafeEqual(Buffer.from(key), Buffer.from(expected));
}

export const payLinkUrl = (base: string, code: string) => `${base}/pagar?code=${encodeURIComponent(code)}&k=${payLinkKey(code)}`;

/* ───────────── Qué se puede pagar ───────────── */

// Lo que el huésped puede pagar en línea ahora, con los valores del grupo (una reserva con varias cabañas se paga junta):
// sin abono, el abono o el total; confirmada o en estadía, el saldo. Lo mismo que acepta apply_payment.
export function payOptions(group: Row[]): OnlinePayOption[] {
  const live = group.filter((r) => r.status !== "cancelled");
  if (!live.length) return [];
  const status = live[0].status;
  const owed = (r: Row) => Math.max(0, (r.quote as { total: number }).total - r.paid_amount);
  const due = live.reduce((s, r) => s + owed(r), 0);
  if (due <= 0) return [];
  if (status === "pending_deposit" || status === "expired") {
    const deposit = live.reduce((s, r) => s + Math.min((r.quote as { deposit: number }).deposit, owed(r)), 0);
    return [...(deposit > 0 && deposit < due ? [{ kind: "deposit" as const, amount: deposit }] : []), { kind: "full" as const, amount: due }];
  }
  if (status === "confirmed" || status === "rescheduled" || status === "checked_in") return [{ kind: "balance", amount: due }];
  return [];
}

// Referencia única por intento: ECR-7W9DX-A-K3M9QZ (A = abono, T = pago total, S = saldo). Sin caracteres ambiguos.
export function newReference(code: string, kind: PaymentKind) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const tail = Array.from(randomBytes(6), (b) => alphabet[b % alphabet.length]).join("");
  return `${code}-${kind === "deposit" ? "A" : kind === "full" ? "T" : "S"}-${tail}`;
}

/* ───────────── Pago con tarjeta ───────────── */

// Solo tarjeta: el formulario es propio (el Web Checkout de Wompi siempre ofrece también PSE, Nequi y Bancolombia). Los
// datos de la tarjeta van del navegador directo a Wompi (tokenización con la llave pública); este servidor solo recibe el
// token y crea la transacción con la llave privada.

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// Para el 3D Secure, Wompi rechaza retornos a localhost o 127.0.0.1. En desarrollo se vuelve por un subdominio de
// localhost, que el navegador también resuelve a este equipo.
const returnBase = (base: string) => base.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1|\[::1\])(?=[:/]|$)/, "$1condor.localhost");

const resultPath = (reference: string, id?: string) => `/pagar/resultado?ref=${encodeURIComponent(reference)}${id ? `&id=${encodeURIComponent(id)}` : ""}`;
export const simulatorUrl = (base: string, reference: string) => `${base}/pagar/simulado?ref=${encodeURIComponent(reference)}`;

// Términos que el huésped debe aceptar antes de pagar (Wompi los exige en cada transacción). Se guardan unos minutos.
type Acceptance = { acceptanceToken: string; personalToken: string; termsUrl: string; privacyUrl: string };
let acceptanceCache: { at: number; key: string; value: Acceptance } | null = null;

export async function wompiAcceptance(): Promise<Acceptance | null> {
  const k = wompi();
  if (!k) return null;
  if (acceptanceCache && acceptanceCache.key === k.publicKey && Date.now() - acceptanceCache.at < 10 * 60_000) return acceptanceCache.value;
  try {
    const res = await fetch(`${k.api}/merchants/${encodeURIComponent(k.publicKey)}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const d = ((await res.json()) as { data?: Record<string, { acceptance_token?: string; permalink?: string } | undefined> }).data;
    const a = d?.presigned_acceptance;
    const p = d?.presigned_personal_data_auth;
    if (!a?.acceptance_token || !a.permalink || !p?.acceptance_token || !p.permalink) return null;
    const value = { acceptanceToken: a.acceptance_token, personalToken: p.acceptance_token, termsUrl: a.permalink, privacyUrl: p.permalink };
    acceptanceCache = { at: Date.now(), key: k.publicKey, value };
    return value;
  } catch {
    return null;
  }
}

// Lo que necesita el formulario del navegador: la llave pública (para tokenizar) y los enlaces de los términos.
export async function cardSetup() {
  const k = wompi();
  const acc = k && (await wompiAcceptance());
  if (!k || !acc) return null;
  return { publicKey: k.publicKey, tokensUrl: `${k.api}/tokens/cards`, termsUrl: acc.termsUrl, privacyUrl: acc.privacyUrl };
}

type Payer = { email: string; fullName: string; phone: string; docType: string; docNumber: string };
type Attempt = { reference: string; amount: number };
export type CardInput = { token: string; installments: number };

// Token de tarjeta de Wompi (tok_test_… / tok_prod_…) y de 1 a 36 cuotas; si no, null.
export function parseCardInput(raw: unknown): CardInput | null {
  const c = raw as { token?: unknown; installments?: unknown } | null | undefined;
  const token = typeof c?.token === "string" ? c.token : "";
  const installments = Number(c?.installments);
  if (!/^tok_[\w-]{3,80}$/.test(token) || !Number.isInteger(installments) || installments < 1 || installments > 36) return null;
  return { token, installments };
}

// Firma de integridad de la transacción: referencia + centavos + moneda + secreto de integridad.
export const integritySignature = (reference: string, cents: number, secret: string) => sha256(`${reference}${cents}COP${secret}`);

// Cuerpo de la transacción con tarjeta (solo CARD: Wompi no acepta otro medio con un token de tarjeta).
export function cardTransactionBody(a: Attempt, payer: Payer, card: CardInput, acc: Acceptance, base: string) {
  const k = wompi()!;
  const cents = a.amount * 100;
  const phone = payer.phone.replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, "");
  const legalType = ({ CC: "CC", CE: "CE", Pasaporte: "PP" } as Record<string, string>)[payer.docType];
  return {
    acceptance_token: acc.acceptanceToken,
    accept_personal_auth: acc.personalToken,
    amount_in_cents: cents,
    currency: "COP",
    signature: integritySignature(a.reference, cents, k.integrity),
    customer_email: payer.email,
    reference: a.reference,
    payment_method: { type: "CARD", token: card.token, installments: card.installments },
    redirect_url: returnBase(base) + resultPath(a.reference),
    customer_data: {
      full_name: payer.fullName,
      ...(/^3\d{9}$/.test(phone) && { phone_number: `57${phone}` }),
      ...(legalType && payer.docNumber && { legal_id: payer.docNumber, legal_id_type: legalType }),
    },
  };
}

export class CardError extends Error {}

// Crea la transacción en Wompi y devuelve su id. El resultado (aprobada, rechazada) se consulta después.
export async function createCardTransaction(a: Attempt, payer: Payer, card: CardInput, base: string) {
  const k = wompi();
  const acc = await wompiAcceptance();
  if (!k?.privateKey || !acc) throw new CardError("WOMPI_UNAVAILABLE");
  const res = await fetch(`${k.api}/transactions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${k.privateKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(cardTransactionBody(a, payer, card, acc, base)),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const body = (await res.json().catch(() => null)) as { data?: { id?: string }; error?: unknown } | null;
  if (!res.ok || typeof body?.data?.id !== "string") {
    console.error("[wompi] transacción rechazada al crearla", res.status, JSON.stringify(body?.error ?? body).slice(0, 500));
    throw new CardError("CARD_REJECTED");
  }
  return { id: body.data.id, resultUrl: `${base}${resultPath(a.reference, body.data.id)}` };
}

/* ───────────── Resultado ───────────── */

const WOMPI_STATUS: Record<string, GatewayStatus> = { PENDING: "pending", APPROVED: "approved", DECLINED: "declined", VOIDED: "declined", ERROR: "error" };

export type GatewayTx = { id: string; reference: string; status: GatewayStatus; amountInCents: number; currency: string; method: string; detail: string };

function toTx(t: Record<string, unknown> | undefined): GatewayTx | null {
  if (!t || typeof t.id !== "string" || typeof t.reference !== "string") return null;
  const status = WOMPI_STATUS[String(t.status)];
  if (!status) return null;
  return {
    id: t.id,
    reference: t.reference,
    status,
    amountInCents: Number(t.amount_in_cents),
    currency: String(t.currency ?? ""),
    method: String(t.payment_method_type ?? ""),
    detail: typeof t.status_message === "string" ? t.status_message : status === "declined" ? "Transacción rechazada por la entidad financiera" : "",
  };
}

// Consulta una transacción en Wompi (con la llave privada). Se usa al volver de la pasarela: el resultado llega aunque el
// evento se demore o no alcance el servidor (p. ej. en desarrollo local).
export async function fetchWompiTransaction(id: string): Promise<GatewayTx | null> {
  const k = wompi();
  if (!k?.privateKey || !/^[\w-]{3,80}$/.test(id)) return null;
  try {
    const res = await fetch(`${k.api}/transactions/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${k.privateKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: Record<string, unknown> };
    return toTx(body.data);
  } catch {
    return null;
  }
}

// Evento de Wompi: la firma es SHA-256 de los valores de signature.properties + timestamp + secreto de eventos.
export function parseWompiEvent(body: unknown, headerChecksum: string | null): GatewayTx | null {
  const k = wompi();
  const e = body as { event?: string; data?: Record<string, unknown>; signature?: { properties?: string[]; checksum?: string }; timestamp?: number } | null;
  if (!k?.events || !e || e.event !== "transaction.updated" || !e.data || !Array.isArray(e.signature?.properties) || typeof e.timestamp !== "number")
    return null;
  const value = (path: string) =>
    path.split(".").reduce<unknown>((o, key) => (o && typeof o === "object" ? (o as Record<string, unknown>)[key] : undefined), e.data);
  const expected = sha256(e.signature.properties.map((p) => String(value(p) ?? "")).join("") + e.timestamp + k.events).toUpperCase();
  const given = String(headerChecksum || e.signature.checksum || "").toUpperCase();
  if (given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) return null;
  return toTx(e.data.transaction as Record<string, unknown> | undefined);
}

export type SettleResult = { found: boolean; code?: string; status?: string; changed?: boolean; outcome?: string | null; error?: string };

// Registra el resultado de una transacción. Antes valida que el monto y la moneda sean los del intento: si no coinciden,
// se marca con error (nunca confirma una reserva por un valor distinto).
export async function settle(sb: Db, a: { reference: string; amount: number }, tx: GatewayTx) {
  const mismatch = tx.reference !== a.reference || tx.currency !== "COP" || tx.amountInCents !== a.amount * 100;
  const { data, error } = await sb.rpc("settle_online_payment", {
    p_reference: a.reference,
    p_tx_id: tx.id,
    p_status: mismatch ? "error" : tx.status,
    p_method: tx.method,
    p_detail: mismatch ? "El monto o la referencia de la transacción no coinciden con el pago" : tx.detail,
  });
  if (error) throw error;
  return data as SettleResult;
}

/* ───────────── Acceso del huésped ───────────── */

// La reserva (y su grupo) si quien pide pagar demuestra que es suya: con el correo de la reserva o con la firma del enlace
// de pago. Mismo null si el código no existe o no coincide: no revela qué códigos existen.
export async function payerReservation(sb: Db, rawCode: string, email: string, key: string) {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{2,5}-[A-Z0-9]{3,8}$/.test(code)) return null;
  const { data: row } = await sb.from("reservations").select("*").eq("code", code).maybeSingle().throwOnError();
  if (!row) return null;
  const ok = key ? validPayLinkKey(code, key) : !!email && row.guest_email.toLowerCase() === email.trim().toLowerCase();
  if (!ok) return null;
  const group = row.group_code ? (await sb.from("reservations").select("*").eq("group_code", row.group_code).order("code").throwOnError()).data : [row];
  const lead = group.find((r) => r.code === (row.group_code ?? row.code)) ?? row;
  return { lead, group };
}
