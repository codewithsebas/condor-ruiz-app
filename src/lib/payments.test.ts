import { describe, expect, it } from "vitest";
import { manualPaymentNote, paymentParts, splitByMethod } from "@/lib/payments";

describe("pago dividido entre efectivo y transferencia", () => {
  it("partes: primero el efectivo y el resto por transferencia; con un medio, una sola", () => {
    expect(paymentParts("both", 70_000, 200_000)).toEqual([
      { method: "cash", amount: 70_000 },
      { method: "transfer", amount: 130_000 },
    ]);
    expect(paymentParts("transfer", undefined, 200_000)).toEqual([{ method: "transfer", amount: 200_000 }]);
    expect(paymentParts(undefined, undefined, 50)).toEqual([{ method: "", amount: 50 }]);
  });

  it("reparte las partes entre las cabañas en orden, como apply_payment", () => {
    const parts = paymentParts("both", 150, 400);
    expect(splitByMethod([100, 300], parts)).toEqual([
      [{ method: "cash", amount: 100 }],
      [
        { method: "cash", amount: 50 },
        { method: "transfer", amount: 250 },
      ],
    ]);
    // Una cabaña sin parte del pago no lleva filas.
    expect(splitByMethod([0, 400], parts)).toEqual([
      [],
      [
        { method: "cash", amount: 150 },
        { method: "transfer", amount: 250 },
      ],
    ]);
  });

  it("detalle de cada fila: el medio y la nota", () => {
    expect(manualPaymentNote("cash", " Recibió Luis ")).toBe("Efectivo · Recibió Luis");
    expect(manualPaymentNote("", "")).toBe("Registrado por el equipo");
  });
});
