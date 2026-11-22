import { describe, expect, it } from "vitest";
import { createdFull, createdShort } from "@/components/admin/shared";
import type { Reservation } from "@/lib/types";

// Sábado 21 de noviembre de 2026, 3:45 p. m. en Colombia (UTC−5).
const at = "2026-11-21T20:45:00.000Z";
const now = Date.parse(at) + 2 * 36e5;
const r = (over: Partial<Reservation>) => ({ createdAt: at, source: "web", channel: "", createdByName: null, ...over }) as Reservation;

describe("quién creó la reserva", () => {
  it("con el empleado: completo en la ficha y su primer nombre en lo corto", () => {
    const x = r({ source: "panel", createdByName: "Ana Ruiz" });
    expect(createdFull(x)).toBe("Creada el sáb 21 nov, 3:45 p. m. por Ana Ruiz");
    expect(createdShort(x, now)).toBe("Creada hace 2 h · Ana");
  });
  it("una cuenta sin nombre usa su correo", () => {
    expect(createdShort(r({ source: "panel", createdByName: "ana@condor.test" }), now)).toBe("Creada hace 2 h · ana");
  });
  it("sin empleado, su origen", () => {
    expect(createdFull(r({}))).toBe("Creada el sáb 21 nov, 3:45 p. m. desde el sitio web");
    expect(createdShort(r({}), now)).toBe("Creada hace 2 h · Sitio web");
    expect(createdShort(r({ source: "import", channel: "Booking.com" }), now)).toBe("Creada hace 2 h · Booking");
    expect(createdFull(r({ source: "panel" }))).toContain("por el equipo");
  });
  it("las del archivo de importación dicen «Importada»", () => {
    expect(createdShort(r({ source: "import", channel: "Recepción", createdByName: "Ana Ruiz" }), now)).toBe("Importada hace 2 h · Ana");
  });
});
