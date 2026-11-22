import { describe, expect, it } from "vitest";
import { parseExpiry, validCardNumber } from "@/lib/card";

describe("tarjeta", () => {
  it("número con Luhn", () => {
    expect(validCardNumber("4242 4242 4242 4242")).toBe(true);
    expect(validCardNumber("4242 4242 4242 4241")).toBe(false);
    expect(validCardNumber("4242")).toBe(false);
  });
  it("vencimiento MM/AA vigente", () => {
    const now = new Date(2026, 10, 21);
    expect(parseExpiry("11/26", now)).toEqual({ month: "11", year: "26" });
    expect(parseExpiry("10/26", now)).toBeNull();
    expect(parseExpiry("13/30", now)).toBeNull();
    expect(parseExpiry("0530", now)).toEqual({ month: "05", year: "30" });
  });
});
