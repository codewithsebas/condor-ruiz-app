import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PaymentStage } from "@/components/booking/reservation-payments";
import { SiteProvider } from "@/components/site/site-provider";
import { defaultContent, type SiteContent } from "@/lib/site";
import type { PublicReservation, Quote } from "@/lib/types";

// Reserva esperando el abono, con plazo en el futuro.
const r = {
  code: "ECR-AAAAA",
  status: "pending_deposit",
  checkIn: "2099-12-10",
  checkOut: "2099-12-12",
  cabinTypeId: "estandar",
  quote: { total: 500000, deposit: 150000, balance: 350000, depositPct: 30 } as unknown as Quote,
  depositDueAt: "2099-12-10T23:59:00Z",
  depositPaidAt: null,
  balancePaidAt: null,
  paid: 0,
  checkedInAt: null,
} as PublicReservation;

const render = (payment: { instructions: string; key: string }, photos: Record<string, string> = {}) => {
  const content: SiteContent = { ...defaultContent, texts: { ...defaultContent.texts, payment }, photos };
  return renderToStaticMarkup(createElement(SiteProvider, { content, cabins: [] }, createElement(PaymentStage, { r, onRefresh: () => {} })));
};

describe("Mi reserva · cómo pagar", () => {
  it("muestra la cuenta, la llave Bre-B con su botón y el QR", () => {
    const html = render({ instructions: "Bancolombia · Ahorros 123", key: "@condordelruiz" }, { "payment-qr": "https://x/qr.webp" });
    expect(html).toContain("Cómo pagar");
    expect(html).toContain("Bancolombia · Ahorros 123");
    expect(html).toContain("@condordelruiz");
    expect(html).toContain("Copiar llave");
    expect(html).toContain('src="https://x/qr.webp"');
  });

  it("sin datos para pagar no muestra el bloque y pide escribir por WhatsApp", () => {
    const html = render({ instructions: "", key: "" });
    expect(html).not.toContain("Cómo pagar");
    expect(html).toContain("Escríbenos y te enviamos los datos para pagar");
  });
});
