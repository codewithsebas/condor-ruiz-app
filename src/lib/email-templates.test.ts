import { describe, expect, it } from "vitest";
import { fillVariables, invalidTemplate, overridesOf, stateEmailKind, unknownVariables, EMPTY_TEXTS } from "@/lib/email-templates";
import { arrivalReminderEmail, reservationEndedEmail, sampleEmail } from "@/lib/emails";
import { defaultContent, mergeSite } from "@/lib/site";

const site = mergeSite(defaultContent.settings, defaultContent.policies, defaultContent.texts);
const stay = {
  nombre: "Laura Gómez",
  codigo: "ECR-7W9DX",
  cabana: "Cabaña Doble",
  checkIn: "2026-12-10",
  checkOut: "2026-12-12",
  adultos: 2,
  ninos: 0,
  logoUrl: "x",
};

describe("plantillas de correo", () => {
  it("variables: reemplaza las conocidas y avisa las desconocidas", () => {
    expect(fillVariables("Hola {nombre}, tu {CODIGO}", { nombre: "Laura", codigo: "ECR-1" })).toBe("Hola Laura, tu ECR-1");
    expect(unknownVariables("{nombre} {precio}", ["nombre"])).toEqual(["precio"]);
    expect(invalidTemplate("arrival_reminder", { ...EMPTY_TEXTS, subject: "Hola {precio}" }).subject).toMatch(/precio/);
    expect(invalidTemplate("arrival_reminder", { ...EMPTY_TEXTS, subject: "x".repeat(151) }).subject).toMatch(/150/);
  });

  it("los textos cambiados reemplazan los originales (escapados) y los vacíos dejan el original", () => {
    const c = {
      ...site,
      emailTexts: overridesOf([{ kind: "arrival_reminder", ...EMPTY_TEXTS, subject: "¡{nombre}, ya casi! {codigo}", intro: "Línea <b>uno</b>\n\nDos" }]),
    };
    const e = arrivalReminderEmail(c, { ...stay, saldo: 0, comoLlegarUrl: "#", miReservaUrl: "", whatsappUrl: "#" });
    expect(e.subject).toBe("¡Laura, ya casi! ECR-7W9DX");
    expect(e.html).toContain("Línea &lt;b&gt;uno&lt;/b&gt;");
    expect(e.html).toContain("¡Ya casi, Laura!"); // título original
    expect(e.text).toContain("Dos");
    expect(arrivalReminderEmail(site, { ...stay, saldo: 0, comoLlegarUrl: "#", miReservaUrl: "", whatsappUrl: "#" }).subject).toContain("Faltan 2 días");
  });

  it("cancelada y vencida usan cada una su plantilla", () => {
    const c = { ...site, emailTexts: overridesOf([{ kind: "reservation_expired", ...EMPTY_TEXTS, title: "Se venció" }]) };
    expect(reservationEndedEmail(c, { ...stay, vencida: true, pagado: 0, reservarUrl: "", whatsappUrl: "#" }).html).toContain("Se venció");
    expect(reservationEndedEmail(c, { ...stay, vencida: false, pagado: 0, reservarUrl: "", whatsappUrl: "#" }).html).not.toContain("Se venció");
    expect(sampleEmail(c, "reservation_moved").subject).toContain("cambió de fecha");
  });
});

describe("stateEmailKind", () => {
  const at = (status: string, depositPaidAt: string | null = null, balancePaidAt: string | null = null) => ({ status, depositPaidAt, balancePaidAt });
  it("elige el correo del estado de la reserva", () => {
    expect(stateEmailKind(at("pending_deposit"))).toBe("reservation_received");
    expect(stateEmailKind(at("confirmed", "2026-11-01T10:00:00Z"))).toBe("reservation_confirmed");
    expect(stateEmailKind(at("rescheduled", "2026-11-01T10:00:00Z"))).toBe("reservation_confirmed");
    expect(stateEmailKind(at("cancelled"))).toBe("reservation_cancelled");
    expect(stateEmailKind(at("expired"))).toBe("reservation_expired");
    expect(stateEmailKind(at("checked_in"))).toBeNull();
    expect(stateEmailKind(at("completed"))).toBeNull();
  });
  it("pago total: solo si el saldo se pagó después del abono", () => {
    expect(stateEmailKind(at("confirmed", "2026-11-01T10:00:00Z", "2026-11-05T10:00:00Z"))).toBe("balance_paid");
    expect(stateEmailKind(at("confirmed", "2026-11-01T10:00:00Z", "2026-11-01T10:00:00Z"))).toBe("reservation_confirmed");
  });
});
