import { describe, expect, it } from "vitest";
import {
  arrivalReminderEmail,
  balancePaidEmail,
  previewEmailTheme,
  reservationEndedEmail,
  reservationReceivedEmail,
  reservationRescheduledEmail,
} from "@/lib/emails";
import { defaultContent, mergeSite } from "@/lib/site";

const c = mergeSite(defaultContent.settings, defaultContent.policies, defaultContent.texts);
const stay = {
  nombre: "Laura <b>Gómez</b>",
  codigo: "ECR-7W9DX",
  cabana: "Cabaña Doble",
  checkIn: "2026-12-10",
  checkOut: "2026-12-12",
  adultos: 2,
  ninos: 1,
  logoUrl: "https://x/logo.png",
};

describe("correos automáticos de la reserva", () => {
  it("reserva recibida: código, abono y plazo", () => {
    const e = reservationReceivedEmail(c, {
      ...stay,
      mascota: false,
      total: 500000,
      abono: 150000,
      plazo: "2026-12-01T20:00:00Z",
      miReservaUrl: "https://x/mi-reserva?code=ECR-7W9DX",
      whatsappUrl: "https://wa.me/573000000000",
    });
    expect(e.subject).toContain("ECR-7W9DX");
    expect(e.html).toContain("$150.000");
    expect(e.html).toContain("Ver mi reserva");
    expect(e.text).toContain("$150.000");
  });

  it("reserva recibida: llave Bre-B y QR para pagar, si están configurados", () => {
    const data = {
      ...stay,
      mascota: false,
      total: 500000,
      abono: 150000,
      plazo: "2026-12-01T20:00:00Z",
      miReservaUrl: "",
      whatsappUrl: "https://wa.me/573000000000",
    };
    const texts = { ...defaultContent.texts, payment: { instructions: "", key: "@condor<x>" } };
    const withPay = mergeSite(defaultContent.settings, defaultContent.policies, texts, { "payment-qr": "https://x/qr.webp" });
    const e = reservationReceivedEmail(withPay, data);
    expect(e.html).toContain("Llave Bre-B");
    expect(e.html).toContain("@condor&lt;x&gt;");
    expect(e.html).toContain('src="https://x/qr.webp"');
    expect(e.text).toContain("Llave Bre-B: @condor<x>");
    // Sin datos: se pide escribir por WhatsApp y no hay QR.
    const none = reservationReceivedEmail(c, data);
    expect(none.html).not.toContain("Llave Bre-B");
    expect(none.html).not.toContain("Código QR");
  });

  it("sin el sitio público (solo panel) no enlaza «Mi reserva» ni «Reservar»", () => {
    const received = reservationReceivedEmail(c, {
      ...stay,
      mascota: false,
      total: 500000,
      abono: 150000,
      plazo: "2026-12-01T20:00:00Z",
      miReservaUrl: "",
      whatsappUrl: "https://wa.me/573000000000",
    });
    expect(received.html).not.toContain("Ver mi reserva");
    expect(received.text).not.toContain("Ver mi reserva");
    const expired = reservationEndedEmail(c, { ...stay, vencida: true, pagado: 0, reservarUrl: "", whatsappUrl: "https://wa.me/573000000000" });
    expect(expired.html).not.toContain("Reservar de nuevo");
    expect(expired.html).toContain("escríbenos por WhatsApp");
  });

  it("cancelada y vencida tienen asunto propio", () => {
    const base = { ...stay, pagado: 0, reservarUrl: "https://x/reservar", whatsappUrl: "https://wa.me/1" };
    expect(reservationEndedEmail(c, { ...base, vencida: false }).subject).toBe("Cancelaste tu reserva ECR-7W9DX en El Cóndor del Ruiz");
    expect(reservationEndedEmail(c, { ...base, vencida: true }).subject).toBe("Tu reserva ECR-7W9DX venció");
  });

  it("cancelada: dice que la canceló el huésped y solo menciona el abono si lo pagó", () => {
    const base = { ...stay, vencida: false, reservarUrl: "", whatsappUrl: "https://wa.me/1" };
    const withDeposit = reservationEndedEmail(c, { ...base, pagado: 150000 });
    expect(withDeposit.html).toContain("has cancelado tu reserva");
    expect(withDeposit.html).toContain("no es reembolsable");
    expect(reservationEndedEmail(c, { ...base, pagado: 0 }).html).not.toContain("no es reembolsable");
  });

  it("pago total: lo dice y omite la llegada si ya está hospedado", () => {
    const base = { ...stay, total: 500000, pagado: 500000, comoLlegarUrl: "https://maps", miReservaUrl: "", whatsappUrl: "https://wa.me/1" };
    const paid = balancePaidEmail(c, { ...base, enEstadia: false });
    expect(paid.subject).toBe("Ya hiciste tu pago total · ECR-7W9DX");
    expect(paid.html).toContain("disfrutar tu estadía en El Cóndor del Ruiz");
    expect(paid.html).toContain("Para tu llegada");
    expect(balancePaidEmail(c, { ...base, enEstadia: true }).html).not.toContain("Para tu llegada");
  });

  it("reprogramada: el mensaje cambia con lo pagado", () => {
    const base = {
      ...stay,
      checkInAnterior: "2026-11-20",
      checkOutAnterior: "2026-11-22",
      mascota: false,
      total: 500000,
      abono: 150000,
      plazo: "2026-12-01T20:00:00Z",
      miReservaUrl: "",
      whatsappUrl: "https://wa.me/1",
    };
    const deposit = reservationRescheduledEmail(c, { ...base, pagado: 150000 });
    expect(deposit.html).toContain("Lo que ya abonaste ($150.000) se mantiene");
    expect(deposit.text).toContain("Saldo pendiente: $350.000");
    const full = reservationRescheduledEmail(c, { ...base, pagado: 500000 });
    expect(full.html).toContain("Ya hiciste tu pago total");
    expect(full.html).not.toContain("Lo que ya abonaste");
    const pending = reservationRescheduledEmail(c, { ...base, pagado: 0 });
    expect(pending.html).toContain("paga el abono de $150.000");
    expect(pending.html).not.toContain("Ya hiciste tu pago total");
  });

  it("la vista previa fija el tema sin depender del dispositivo", () => {
    const { html } = reservationEndedEmail(c, { ...stay, vencida: false, pagado: 0, reservarUrl: "", whatsappUrl: "https://wa.me/1" });
    expect(html).toContain("@media (prefers-color-scheme:dark)");
    expect(previewEmailTheme(html, false)).not.toContain("@media (prefers-color-scheme:dark)");
    expect(previewEmailTheme(html, false)).not.toContain('<html class="dm"');
    expect(previewEmailTheme(html, true)).toContain('<html class="dm"');
  });

  it("recordatorio con su saldo y sin HTML del huésped", () => {
    const reminder = arrivalReminderEmail(c, { ...stay, saldo: 350000, comoLlegarUrl: "https://maps", miReservaUrl: "", whatsappUrl: "https://wa.me/1" });
    expect(reminder.html).toContain("$350.000");
    expect(reminder.html).not.toContain("Ver mi reserva");
    // Lo que escribe el huésped se escapa: nunca entra HTML suyo al correo.
    expect(reminder.html).not.toContain("<b>");
  });
});
