import { describe, expect, it } from "vitest";
import { cleanCompanions, validateCompanions } from "@/lib/booking";
import type { Companion } from "@/lib/types";

const c = (p: Partial<Companion> = {}): Companion => ({ fullName: "Ana Pérez", docType: "TI", docNumber: "1012345678", phone: "", email: "", city: "", ...p });

describe("validateCompanions", () => {
  it("acepta sin lista y una lista vacía", () => {
    expect(validateCompanions(undefined, 2)).toEqual({});
    expect(validateCompanions([], 1)).toEqual({});
  });

  it("exige nombre, tipo y número de documento; lo demás es opcional", () => {
    expect(validateCompanions([c()], 2)).toEqual({});
    expect(validateCompanions([c({ fullName: "A", docNumber: "12" })], 2)).toEqual({
      "companions.0.fullName": "Escribe el nombre completo.",
      "companions.0.docNumber": "Escribe el número de documento (sin puntos).",
    });
    expect(validateCompanions([c({ docType: "SD" as Companion["docType"] })], 2)).toHaveProperty("companions.0.docType");
  });

  it("valida el contacto solo si viene", () => {
    expect(validateCompanions([c({ phone: "300 123 4567", email: "ana@x.co" })], 2)).toEqual({});
    expect(validateCompanions([c({ phone: "12", email: "ana@" })], 2)).toEqual({
      "companions.0.phone": "Escribe un celular válido.",
      "companions.0.email": "Escribe un correo válido.",
    });
  });

  it("caben las personas de la reserva menos el titular", () => {
    expect(validateCompanions([c(), c()], 3)).toEqual({});
    expect(validateCompanions([c(), c()], 2)).toHaveProperty("companions");
    expect(validateCompanions([c()], 1)).toHaveProperty("companions");
  });
});

describe("cleanCompanions", () => {
  it("quita espacios, pone el documento en mayúsculas y normaliza el celular", () => {
    expect(cleanCompanions([c({ fullName: "  Ana  ", docType: "Pasaporte", docNumber: " ab123 ", phone: "3001234567", email: " a@x.co " })])).toEqual([
      { fullName: "Ana", docType: "Pasaporte", docNumber: "AB123", phone: "+573001234567", email: "a@x.co", city: "" },
    ]);
    expect(cleanCompanions(undefined)).toEqual([]);
  });
});
