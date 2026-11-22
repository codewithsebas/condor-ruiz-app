import "server-only";
import { config } from "@/lib/config";
import { env } from "@/lib/server/env";

// Mapa de la dirección para los correos: imagen de Geoapify (Static Maps API, mapas de OpenStreetMap) con el pin en la
// ubicación del negocio. Va incrustada en el correo como imagen en línea (cid:), como el logo: la clave nunca sale del
// servidor y el correo no depende de que el sitio esté publicado. Sin GEOAPIFY_API_KEY (o si Geoapify falla) el correo
// sale sin mapa. La imagen se pide una vez y se guarda en memoria un día; la vista previa la toma de /correo/mapa.png.

export const EMAIL_MAP_CID = "el-condor-del-ruiz-mapa";

const TTL_MS = 24 * 60 * 60 * 1000;
let cached: { url: string; png: Buffer; at: number } | null = null;

// 536 px es el ancho del contenido del correo; scaleFactor=2 para pantallas de alta densidad. Geoapify usa lon,lat.
export function staticMapUrl(key: string) {
  const at = `lonlat:${config.lng},${config.lat}`;
  const q = new URLSearchParams({
    style: "osm-bright",
    width: "536",
    height: "260",
    scaleFactor: "2",
    format: "png",
    center: at,
    zoom: "15",
    marker: `${at};type:material;color:#5b3a21;size:large`,
    lang: "es",
    apiKey: key,
  });
  return `https://maps.geoapify.com/v1/staticmap?${q.toString()}`;
}

export const emailMapConfigured = () => !!env.geoapifyApiKey;

// La imagen del mapa (PNG) o null si no está configurado o Geoapify no respondió bien.
export async function loadEmailMap(): Promise<Buffer | null> {
  const key = env.geoapifyApiKey;
  if (!key) return null;
  const url = staticMapUrl(key);
  if (cached && cached.url === url && Date.now() - cached.at < TTL_MS) return cached.png;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) {
      console.error(`[mapa] Geoapify respondió ${res.status}: el correo sale sin mapa.`);
      return cached?.png ?? null;
    }
    cached = { url, png: Buffer.from(await res.arrayBuffer()), at: Date.now() };
    return cached.png;
  } catch (e) {
    console.error("[mapa] No se pudo cargar el mapa de Geoapify:", e);
    return cached?.png ?? null;
  }
}
