import { loadEmailMap } from "@/lib/server/email-map";

// GET /correo/mapa.png → el mapa que llevan los correos, para sus vistas previas (los correos lo llevan incrustado).
// Pasa por el servidor para no exponer la clave de Geoapify. Sin clave configurada (o si Geoapify falla), un aviso en
// su lugar: los correos de verdad salen sin mapa.
const PLACEHOLDER = `<svg xmlns="http://www.w3.org/2000/svg" width="1072" height="520" viewBox="0 0 1072 520"><rect width="1072" height="520" fill="#EFE9DD"/><text x="536" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#3A2817">Mapa de la dirección</text><text x="536" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#66615A">Sin GEOAPIFY_API_KEY los correos salen sin mapa</text></svg>`;

export async function GET() {
  const png = await loadEmailMap();
  if (!png) return new Response(PLACEHOLDER, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
  });
}
