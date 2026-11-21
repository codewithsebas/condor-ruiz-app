import { describe, expect, it } from "vitest";
import { cabinName, cleanUnitNames, invalidUnitNames, unitName } from "@/lib/booking";

describe("nombres de cabaña", () => {
  const c = { unitLabels: ["9", ""], unitNames: ["El Mirador", " "] };

  it("con nombre se muestra el nombre; sin nombre, «Cabaña N» con su número o su posición", () => {
    expect(cabinName(c, 1)).toBe("El Mirador");
    expect(cabinName(c, 2)).toBe("Cabaña 2");
    expect(cabinName({ unitLabels: ["9"] }, 1)).toBe("Cabaña 9");
    expect(unitName(c, 2)).toBe("");
  });

  it("limpia espacios y ajusta la lista a las unidades", () => {
    expect(cleanUnitNames(["  El   Mirador ", "Nevado", "Sobra"], 2)).toEqual(["El Mirador", "Nevado"]);
    expect(cleanUnitNames(undefined, 2)).toEqual(["", ""]);
  });

  it("valida largo, caracteres y repetidos (sin distinguir mayúsculas)", () => {
    expect(invalidUnitNames(["El Mirador", "", "Café & Té"], 3)).toBeNull();
    expect(invalidUnitNames(["x".repeat(41)], 1)).toMatch(/40 caracteres/);
    expect(invalidUnitNames(["<script>"], 1)).toMatch(/letras/);
    expect(invalidUnitNames(["Nevado", "nevado"], 2)).toMatch(/repetido/);
  });
});
