// Contenido editable del sitio (horarios, contacto, políticas, imágenes). Lo usan servidor y navegador.
import { config, type Policy } from "./config";
import { DEFAULT_SERVICES } from "./content";

export type SiteSettings = {
  checkInStart: string; // "HH:MM"
  checkInEnd: string;
  checkOutTime: string;
  phones: string[];
  whatsapp: string; // con indicativo, solo dígitos: 573144001279
  rnt: string;
};

export type SitePolicy = Policy & { id: string };

// Textos editables desde el panel (columna site_settings.content). Vacío = se usa el valor por defecto.
export type SiteTexts = {
  // rotating: otras frases que se alternan con el título resaltado en la portada (una por línea).
  hero: { title: string; highlight: string; rotating: string; badge: string; description: string };
  location: { note: string };
  payment: { instructions: string };
  social: { instagram: string; facebook: string; tiktok: string };
};

// Servicio de la sección «Servicios incluidos» (tabla site_services). icon: clave de lib/service-icons.ts;
// note: etiqueta opcional («Valor adicional») que lo destaca como extra. Ocultos: solo se ven en el panel.
export type SiteService = { id: string; title: string; description: string; icon: string; note: string; visible: boolean };
export const SERVICE_LIMITS = { title: 60, description: 160, note: 30, max: 40 };

export type SiteContent = {
  settings: SiteSettings;
  policies: SitePolicy[];
  photos: Record<string, string>; // slot → URL pública
  texts: SiteTexts;
  services: SiteService[]; // en el orden en que se muestran
};

// Configuración del negocio con los campos editables ya aplicados (misma forma que `config`).
export type SiteConfig = Omit<typeof config, "policies"> & { policies: SitePolicy[] };

export const defaultTexts: SiteTexts = {
  hero: {
    title: "Despierta frente",
    highlight: "al nevado",
    rotating: "a la cascada\na las montañas",
    badge: "Murillo, Tolima · Desayuno incluido",
    description: "Cabañas tipo chalet con vista al Nevado del Ruiz y a una hermosa cascada, sendero ecológico, avistamiento de aves y zona de fogata.",
  },
  location: { note: "Nevado del Ruiz a aproximadamente 1 hora en carro." },
  payment: { instructions: "" },
  social: { instagram: "", facebook: "", tiktok: "" },
};

// Límites de cada texto (los aplica la API al guardar).
export const TEXT_LIMITS = { title: 40, highlight: 40, rotating: 200, rotatingLines: 5, badge: 60, description: 320, note: 160, instructions: 600, url: 200 };

// Frases que se alternan con el título resaltado: líneas no vacías del campo «rotating», con el mismo límite por línea.
export const rotatingPhrases = (hero: { highlight: string; rotating: string }) =>
  [hero.highlight, ...hero.rotating.split("\n")].map((x) => x.trim()).filter(Boolean).slice(0, TEXT_LIMITS.rotatingLines + 1);

// Mezcla lo guardado con los valores por defecto; ignora claves desconocidas o que no sean texto.
export function mergeTexts(raw: unknown): SiteTexts {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, Record<string, unknown> | undefined>;
  const pick = <T extends Record<string, string>>(group: keyof SiteTexts, defs: T): T =>
    Object.fromEntries(Object.entries(defs).map(([k, v]) => [k, typeof r[group]?.[k] === "string" ? (r[group]![k] as string) : v])) as T;
  return {
    hero: pick("hero", defaultTexts.hero),
    location: pick("location", defaultTexts.location),
    payment: pick("payment", defaultTexts.payment),
    social: pick("social", defaultTexts.social),
  };
}

// `hint`: orientación sugerida; `min`: resolución mínima (px) para que la foto se vea nítida en pantallas de alta densidad.
export type PhotoSlotDef = { id: string; group: string; label: string; alt: string; placeholder: string; aspect: string; hint: string; min: readonly [width: number, height: number] };

// Huecos de imagen del sitio, en el orden en que aparecen en el panel. Las fotos de cada cabaña se administran en su ficha.
export const PHOTO_SLOTS: PhotoSlotDef[] = [
  { id: "hero-main", group: "Portada · banner grande", label: "Banner grande", alt: "Cabaña con el Nevado del Ruiz al fondo", placeholder: "Foto real (4:5): cabaña con el Nevado del Ruiz al fondo", aspect: "4/5", hint: "Vertical 4:5", min: [1200, 1500] },
  { id: "hero-thumb-1", group: "Portada · banners pequeños", label: "Banner pequeño 1", alt: "Exterior del chalet", placeholder: "Foto real: exterior del chalet", aspect: "1/1.1", hint: "Casi cuadrada", min: [600, 660] },
  { id: "hero-thumb-2", group: "Portada · banners pequeños", label: "Banner pequeño 2", alt: "Malla catamarán del altillo", placeholder: "Foto real: malla catamarán", aspect: "1/1.1", hint: "Casi cuadrada", min: [600, 660] },
  { id: "hero-thumb-3", group: "Portada · banners pequeños", label: "Banner pequeño 3", alt: "Zona de fogata", placeholder: "Foto real: fogata", aspect: "1/1.1", hint: "Casi cuadrada", min: [600, 660] },
  { id: "hero-thumb-4", group: "Portada · banners pequeños", label: "Banner pequeño 4", alt: "Jacuzzi de la cabaña Premium", placeholder: "Foto real: jacuzzi", aspect: "1/1.1", hint: "Casi cuadrada", min: [600, 660] },
  { id: "exp-vista", group: "Alta montaña frente al nevado", label: "Vista al Nevado y a la cascada", alt: "Vista al Nevado y a la cascada", placeholder: "Foto real: vista al nevado desde la terraza", aspect: "3/4.1", hint: "Vertical 3:4", min: [900, 1230] },
  { id: "exp-aves", group: "Alta montaña frente al nevado", label: "Avistamiento de aves", alt: "Avistamiento de aves", placeholder: "Foto real: aves en los alrededores", aspect: "3/4.1", hint: "Vertical 3:4", min: [900, 1230] },
  { id: "exp-sendero", group: "Alta montaña frente al nevado", label: "Sendero ecológico", alt: "Sendero ecológico", placeholder: "Foto real: sendero ecológico", aspect: "3/4.1", hint: "Vertical 3:4", min: [900, 1230] },
  { id: "exp-malla", group: "Alta montaña frente al nevado", label: "Malla catamarán", alt: "Malla catamarán", placeholder: "Foto real: malla catamarán del altillo", aspect: "3/4.1", hint: "Vertical 3:4", min: [900, 1230] },
  { id: "exp-fogata", group: "Alta montaña frente al nevado", label: "Zona de fogata", alt: "Zona de fogata", placeholder: "Foto real: zona de fogata de noche", aspect: "3/4.1", hint: "Vertical 3:4", min: [900, 1230] },
  { id: "contact", group: "Contacto", label: "Imagen de contacto", alt: "Cabañas El Cóndor del Ruiz", placeholder: "Foto real: anfitriones o recepción", aspect: "4/3", hint: "Horizontal 4:3", min: [1200, 900] },
];

export const photoSlot = (id: string) => PHOTO_SLOTS.find((s) => s.id === id);

// "15:00" → "3:00 p. m."; "12:00" → "12:00 am.".
export function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (h === 12 && m === 0) return "12:00 am.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
}

// Horas de llegada cada 30 minutos dentro de la ventana de check-in.
export function arrivalOptions(start: string, end: string): [value: string, label: string][] {
  const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const out: [string, string][] = [];
  for (let t = toMin(start); t <= toMin(end); t += 30) {
    const v = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    out.push([v, fmtTime(v)]);
  }
  return out;
}

// Foto de cabaña: lado mayor y mínimo (horizontal 4:3), igual que los huecos del sitio.
export const CABIN_PHOTO = { aspect: "4/3", hint: "Horizontal 4:3", min: [1600, 1200] as const };

export function mergeSite(s: SiteSettings, policies: SitePolicy[], texts: SiteTexts = defaultTexts): SiteConfig {
  return {
    ...config,
    datosPagoAbono: texts.payment.instructions.trim() || config.datosPagoAbono,
    phones: s.phones,
    whatsapp: s.whatsapp,
    rnt: s.rnt,
    checkIn: `${fmtTime(s.checkInStart)} a ${fmtTime(s.checkInEnd)}`,
    checkOut: fmtTime(s.checkOutTime),
    checkInStart: s.checkInStart,
    checkInEnd: s.checkInEnd,
    checkOutTime: s.checkOutTime,
    policies,
  };
}

// Valores del diseño, para el modo simulado o si Supabase no responde.
export const defaultContent: SiteContent = {
  settings: { checkInStart: "15:00", checkInEnd: "19:00", checkOutTime: "12:00", phones: [...config.phones], whatsapp: config.whatsapp, rnt: "" },
  policies: config.policies.map((p, i) => ({ ...p, id: `default-${i}` })),
  photos: {},
  texts: defaultTexts,
  services: DEFAULT_SERVICES.map((x, i) => ({ id: `default-${i}`, title: x.title, description: "", icon: x.icon, note: x.note ?? "", visible: true })),
};
