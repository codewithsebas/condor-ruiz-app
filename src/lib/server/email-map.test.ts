import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { staticMapUrl } = await import("@/lib/server/email-map");

describe("mapa de los correos (Geoapify Static Maps)", () => {
  it("centra el mapa y pone el pin en la ubicación del negocio (lon,lat), en PNG", () => {
    const url = new URL(staticMapUrl("CLAVE"));
    expect(url.origin + url.pathname).toBe("https://maps.geoapify.com/v1/staticmap");
    expect(url.searchParams.get("center")).toBe("lonlat:-75.1683813,4.8778484");
    expect(url.searchParams.get("marker")).toMatch(/^lonlat:-75\.1683813,4\.8778484;/);
    expect(url.searchParams.get("format")).toBe("png");
    expect(url.searchParams.get("apiKey")).toBe("CLAVE");
  });
});
