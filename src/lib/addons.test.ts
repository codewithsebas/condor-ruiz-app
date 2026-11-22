import { describe, expect, it } from "vitest";
import { adjustedQuote, computeQuote, invalidDecoration, pickAddons, withAddons, withTotal } from "@/lib/booking";

const cabin = { id: "doble", precioPareja: 160_000, personaAdicional: 40_000 } as const;
const catalog = [
  { id: "a", name: "Pétalos y velas", price: 80_000, visible: true },
  { id: "b", name: "Globos", price: 50_000, visible: true },
  { id: "c", name: "Torta", price: 60_000, visible: false },
];

describe("decoraciones con costo", () => {
  it("se suman al total y al saldo; el abono no cambia", () => {
    const q = computeQuote(cabin, "2026-11-10", "2026-11-12", 2, [], 30); // 320.000 · abono 96.000
    const d = withAddons(q, [catalog[0], catalog[1]]);
    expect(d).toMatchObject({ total: 450_000, deposit: 96_000, balance: 354_000, addons: 130_000 });
    // Reemplaza las anteriores (no las suma dos veces) y sin ninguna vuelve a la tarifa.
    expect(withAddons(d, [catalog[1]])).toMatchObject({ total: 370_000, addons: 50_000 });
    const none = withAddons(d, []);
    expect(none.total).toBe(320_000);
    expect(none.addons).toBeUndefined();
  });

  it("con precio especial: el especial es del alojamiento", () => {
    const q = withAddons(withTotal(computeQuote(cabin, "2026-11-10", "2026-11-12", 2, [], 30), 300_000, 30), [catalog[0]]);
    expect(q).toMatchObject({ total: 380_000, deposit: 90_000, adjustment: -20_000, addons: 80_000 });
  });

  it("solo ids del catálogo visibles, sin repetir; las que la reserva ya tenía se conservan con su precio", () => {
    expect(pickAddons(["a", "b"], catalog)).toEqual([
      { id: "a", name: "Pétalos y velas", price: 80_000 },
      { id: "b", name: "Globos", price: 50_000 },
    ]);
    expect(pickAddons(undefined, catalog)).toEqual([]);
    expect(pickAddons(["a", "a"], catalog)).toBeNull();
    expect(pickAddons(["c"], catalog)).toBeNull();
    expect(pickAddons(["zz"], catalog)).toBeNull();
    expect(pickAddons("a", catalog)).toBeNull();
    // Escritas por el equipo (solo el panel): texto y precio, con un id propio.
    const custom = pickAddons(["a", { name: " Globos dorados ", price: 45_000 }], catalog, [], true)!;
    expect(custom[1]).toMatchObject({ name: "Globos dorados", price: 45_000 });
    expect(custom[1].id).toMatch(/^otra-/);
    expect(pickAddons([{ name: "Globos", price: 45_000 }], catalog)).toBeNull();
    expect(pickAddons([{ name: "", price: 45_000 }], catalog, [], true)).toBeNull();
    expect(pickAddons([{ name: "Globos", price: -1 }], catalog, [], true)).toBeNull();
    const kept = [{ id: "c", name: "Torta", price: 55_000 }];
    expect(pickAddons(["c", "a"], catalog, kept)).toEqual([kept[0], { id: "a", name: "Pétalos y velas", price: 80_000 }]);
  });

  it("al cambiar personas y valor, las decoraciones se conservan fuera del precio especial", () => {
    const base = computeQuote(cabin, "2026-11-10", "2026-11-12", 2, [], 30);
    const addons = [{ id: "a", name: "Pétalos y velas", price: 80_000 }];
    const r = { quote: withAddons(base, addons), checkIn: "2026-11-10", checkOut: "2026-11-12", adults: 2, children: 0, paid: 0, addons };
    // 3 personas: tarifa 400.000 + 80.000 de decoración.
    expect(adjustedQuote(r, cabin, 3, 480_000, [], 30)).toMatchObject({ total: 480_000, deposit: 120_000, addons: 80_000 });
    expect(adjustedQuote(r, cabin, 3, 480_000, [], 30).adjustment).toBeUndefined();
    // Otro valor: la diferencia es del alojamiento.
    expect(adjustedQuote(r, cabin, 3, 450_000, [], 30)).toMatchObject({ total: 450_000, adjustment: -30_000, addons: 80_000 });
  });

  it("valida nombre, descripción y precio", () => {
    expect(invalidDecoration({ name: "Globos", description: "", price: 50_000 })).toEqual({});
    expect(Object.keys(invalidDecoration({ name: "", description: "x".repeat(201), price: -1 }))).toEqual(["name", "description", "price"]);
    expect(invalidDecoration({ name: "Globos", description: "", price: 1.5 }).price).toBeTruthy();
  });
});
