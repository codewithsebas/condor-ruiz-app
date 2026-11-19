// Colores del sitio web (columna site_settings.theme). Lo usan servidor y navegador. Cada clave reemplaza una variable de
// la paleta de app/globals.css. El panel tiene su propio tema fijo (components/admin/panel-theme.ts).

export type ThemeKey = "bg" | "surface" | "deep" | "night" | "card" | "cardMuted" | "onDark" | "onLight" | "accent" | "highlight" | "cta" | "ctaText";
export type SiteTheme = Record<ThemeKey, string>; // "#rrggbb"

const VARS: Record<ThemeKey, string> = {
  bg: "--color-bg",
  surface: "--color-surface",
  deep: "--color-deep",
  night: "--color-night",
  card: "--color-card",
  cardMuted: "--color-card-muted",
  onDark: "--color-on-dark",
  onLight: "--color-on-light",
  accent: "--color-accent",
  highlight: "--color-highlight",
  cta: "--color-cta",
  ctaText: "--color-cta-text",
};

export const THEME_KEYS = Object.keys(VARS) as ThemeKey[];

// Campos del panel, agrupados por el papel que cumple cada color en el sitio.
export const THEME_GROUPS: { label: string; fields: { key: ThemeKey; label: string; hint: string }[] }[] = [
  {
    label: "Fondos",
    fields: [
      { key: "bg", label: "Fondo principal", hint: "Fondo de todo el sitio y del menú." },
      { key: "surface", label: "Bloques", hint: "Portada, tarjetas oscuras y botones secundarios." },
      { key: "deep", label: "Fondo profundo", hint: "Valles entre secciones y montañas del pie de página." },
      { key: "night", label: "Franja final", hint: "Última franja del pie de página." },
    ],
  },
  {
    label: "Tarjetas claras",
    fields: [
      { key: "card", label: "Tarjeta", hint: "Cabañas, formulario de reserva y botones claros." },
      { key: "cardMuted", label: "Tarjeta secundaria", hint: "Etiquetas, bordes de los campos y zonas suaves." },
    ],
  },
  {
    label: "Textos",
    fields: [
      { key: "onDark", label: "Texto sobre fondos oscuros", hint: "Títulos y párrafos sobre los fondos." },
      { key: "onLight", label: "Texto sobre tarjetas", hint: "Títulos y párrafos sobre las tarjetas claras." },
    ],
  },
  {
    label: "Acentos",
    fields: [
      { key: "accent", label: "Acento", hint: "Segunda línea de los títulos, ilustraciones y detalles." },
      { key: "highlight", label: "Resaltado", hint: "Etiquetas destacadas, marcas y contorno del foco." },
    ],
  },
  {
    label: "Botón principal",
    fields: [
      { key: "cta", label: "Botón", hint: "«Reservar», «Consultar» y las demás acciones principales." },
      { key: "ctaText", label: "Texto del botón", hint: "Letra de los botones principales." },
    ],
  },
];

export const themeField = (k: ThemeKey) => THEME_GROUPS.flatMap((g) => g.fields).find((f) => f.key === k)!;

// Paletas listas para usar (contraste de textos ≥ 4.5:1 y de acentos ≥ 3:1). La primera es la del diseño.
// Madera clara es la única de fondo claro: el dorado no llega a 3:1 sobre el fondo (sí a 4.5:1 con el texto de sus
// etiquetas), porque con fondo claro no se pueden cumplir las dos cosas a la vez.
export const THEME_PRESETS: { id: string; label: string; description: string; theme: SiteTheme }[] = [
  {
    id: "madera",
    label: "Madera clara",
    description: "Roble claro, nogal y ámbar. La paleta del sitio.",
    theme: { bg: "#dcc39c", surface: "#e7d3b2", deep: "#cfb187", night: "#c4a274", card: "#fbf6ec", cardMuted: "#efe2c9", onDark: "#3a2817", onLight: "#3a2817", accent: "#8a5a2b", highlight: "#d4913c", cta: "#5b3a21", ctaText: "#fbf6ec" },
  },
  {
    id: "bosque",
    label: "Bosque",
    description: "Verde de montaña, crema y dorado. La paleta original.",
    theme: { bg: "#163a2a", surface: "#1d4633", deep: "#11301f", night: "#07140d", card: "#f2ebd3", cardMuted: "#e6dcbe", onDark: "#f2ebd3", onLight: "#163a2a", accent: "#7fae84", highlight: "#d9a441", cta: "#163a2a", ctaText: "#f2ebd3" },
  },
  {
    id: "nevado",
    label: "Nevado",
    description: "Azul glaciar con blanco hielo.",
    theme: { bg: "#1b3445", surface: "#24445a", deep: "#152a38", night: "#08121a", card: "#eef2f3", cardMuted: "#dbe4e8", onDark: "#eef2f3", onLight: "#1b3445", accent: "#8fb8cf", highlight: "#e0b04a", cta: "#1b3445", ctaText: "#eef2f3" },
  },
  {
    id: "paramo",
    label: "Páramo",
    description: "Verde oliva de frailejón y amarillo de flor.",
    theme: { bg: "#2f3a2a", surface: "#3a4734", deep: "#262f22", night: "#0f130d", card: "#f1eedf", cardMuted: "#e2dcc6", onDark: "#f1eedf", onLight: "#2f3a2a", accent: "#b5c27a", highlight: "#e3b23c", cta: "#2f3a2a", ctaText: "#f1eedf" },
  },
  {
    id: "cafe",
    label: "Café de montaña",
    description: "Madera, arena y naranja de fogata.",
    theme: { bg: "#3b2a20", surface: "#4a3528", deep: "#2f2119", night: "#140d09", card: "#f4ead8", cardMuted: "#e8d9bf", onDark: "#f4ead8", onLight: "#3b2a20", accent: "#c9a27a", highlight: "#d98c3f", cta: "#3b2a20", ctaText: "#f4ead8" },
  },
  {
    id: "noche",
    label: "Noche estrellada",
    description: "Azul noche con dorado de estrellas.",
    theme: { bg: "#1a1f3a", surface: "#252b4d", deep: "#141830", night: "#080a16", card: "#f3eee2", cardMuted: "#e3dccb", onDark: "#f3eee2", onLight: "#1a1f3a", accent: "#9aa8e0", highlight: "#e6b450", cta: "#1a1f3a", ctaText: "#f3eee2" },
  },
  {
    id: "cascada",
    label: "Cascada",
    description: "Verde azulado de agua de montaña con blanco de espuma.",
    theme: { bg: "#0f3d3e", surface: "#165052", deep: "#0a2f30", night: "#041516", card: "#ecf4f0", cardMuted: "#d6e6df", onDark: "#ecf4f0", onLight: "#0f3d3e", accent: "#7cc4bd", highlight: "#e7b74c", cta: "#0f3d3e", ctaText: "#ecf4f0" },
  },
  {
    id: "niebla",
    label: "Niebla",
    description: "Gris pizarra, sobrio, con blanco de neblina.",
    theme: { bg: "#2c3b40", surface: "#384b51", deep: "#212d31", night: "#0d1214", card: "#f0f3f1", cardMuted: "#dde4e0", onDark: "#f0f3f1", onLight: "#2c3b40", accent: "#a5c4c0", highlight: "#dcb45c", cta: "#2c3b40", ctaText: "#f0f3f1" },
  },
  {
    id: "orquidea",
    label: "Orquídea",
    description: "Morado profundo con lila, como la flor.",
    theme: { bg: "#33204a", surface: "#42295f", deep: "#27173a", night: "#100917", card: "#f4eef6", cardMuted: "#e4d9ea", onDark: "#f4eef6", onLight: "#33204a", accent: "#c6a5e3", highlight: "#e9b85a", cta: "#33204a", ctaText: "#f4eef6" },
  },
  {
    id: "atardecer",
    label: "Atardecer",
    description: "Vino tinto, durazno y dorado del sol que cae.",
    theme: { bg: "#4a1d2b", surface: "#5d2838", deep: "#3a1520", night: "#17080d", card: "#f7eadf", cardMuted: "#ecd8c8", onDark: "#f7eadf", onLight: "#4a1d2b", accent: "#e9a48c", highlight: "#f0b64e", cta: "#4a1d2b", ctaText: "#f7eadf" },
  },
  {
    id: "arcilla",
    label: "Arcilla",
    description: "Terracota, arena y ocre de los caminos.",
    theme: { bg: "#6b2f1d", surface: "#7d3a25", deep: "#552415", night: "#220d07", card: "#f6ebdc", cardMuted: "#ead9c2", onDark: "#f6ebdc", onLight: "#6b2f1d", accent: "#e6b48a", highlight: "#f0bd4f", cta: "#6b2f1d", ctaText: "#f6ebdc" },
  },
  {
    id: "volcan",
    label: "Volcán",
    description: "Roca oscura, ceniza y naranja de lava.",
    theme: { bg: "#2b2a2c", surface: "#39373a", deep: "#201f21", night: "#0c0b0c", card: "#f2ede6", cardMuted: "#e2d9cc", onDark: "#f2ede6", onLight: "#2b2a2c", accent: "#d9a88a", highlight: "#ee7b3c", cta: "#2b2a2c", ctaText: "#f2ede6" },
  },
];

export const DEFAULT_THEME: SiteTheme = THEME_PRESETS[0].theme;

const HEX = /^#[0-9a-f]{6}$/;

// "#ABC", "abc", "#AABBCC" → "#aabbcc"; cualquier otra cosa → null.
export function normalizeHex(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase().replace(/^#?/, "#");
  if (/^#[0-9a-f]{3}$/.test(s)) return "#" + [...s.slice(1)].map((c) => c + c).join("");
  return HEX.test(s) ? s : null;
}

// Mezcla lo guardado con los colores por defecto; ignora claves desconocidas o valores que no sean colores.
export function mergeTheme(raw: unknown): SiteTheme {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return Object.fromEntries(THEME_KEYS.map((k) => [k, normalizeHex(r[k]) ?? DEFAULT_THEME[k]])) as SiteTheme;
}

export const sameTheme = (a: SiteTheme, b: SiteTheme) => THEME_KEYS.every((k) => a[k] === b[k]);

export const presetOf = (t: SiteTheme) => THEME_PRESETS.find((p) => sameTheme(p.theme, t));

// Variables CSS de la paleta, con las que se derivan de ella (textos atenuados, sombra de las ventanas). Se declaran
// juntas para que funcionen igual en :root (sitio) que en un contenedor (vista previa del panel).
// Pasa por mergeTheme porque un navegador puede traer guardado un sitio sin colores: sin ellos no se debe caer el panel.
export function themeVars(t: SiteTheme): Record<string, string> {
  const colors = mergeTheme(t);
  return {
    ...Object.fromEntries(THEME_KEYS.map((k) => [VARS[k], colors[k]])),
    "--color-on-dark-muted": "color-mix(in srgb, var(--color-on-dark) 85%, var(--color-bg))",
    "--color-on-light-muted": "color-mix(in srgb, var(--color-on-light) 75%, var(--color-card-muted))",
    "--color-footer": "color-mix(in srgb, var(--color-bg) 72%, #000)",
    "--shadow-pop": "0 30px 60px -24px rgb(0 0 0 / 0.6), 0 0 0 1px var(--color-card-muted)",
  };
}

// Hoja de estilos con la paleta para las páginas públicas. Solo lleva valores ya validados (#rrggbb).
export const themeCss = (t: SiteTheme) =>
  `:root{${Object.entries(themeVars(t))
    .map(([k, v]) => `${k}:${v}`)
    .join(";")}}`;

/* ───────────── Contraste (WCAG 2.1) ───────────── */

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Combinaciones que se leen en el sitio. Texto normal: 4.5:1; títulos grandes y detalles: 3:1.
const CHECKS: { fg: ThemeKey; bg: ThemeKey; min: number; label: string }[] = [
  { fg: "onDark", bg: "bg", min: 4.5, label: "Texto sobre el fondo principal" },
  { fg: "onDark", bg: "surface", min: 4.5, label: "Texto sobre los bloques" },
  { fg: "onDark", bg: "deep", min: 4.5, label: "Texto sobre el fondo profundo" },
  { fg: "onDark", bg: "night", min: 4.5, label: "Texto de la franja final" },
  { fg: "onLight", bg: "card", min: 4.5, label: "Texto sobre las tarjetas" },
  { fg: "onLight", bg: "cardMuted", min: 4.5, label: "Texto sobre la tarjeta secundaria" },
  { fg: "onLight", bg: "highlight", min: 4.5, label: "Etiquetas resaltadas" },
  { fg: "ctaText", bg: "cta", min: 4.5, label: "Texto del botón principal" },
  { fg: "accent", bg: "bg", min: 3, label: "Acento sobre el fondo principal" },
  { fg: "accent", bg: "surface", min: 3, label: "Títulos con acento en la portada" },
  { fg: "highlight", bg: "bg", min: 3, label: "Resaltado sobre el fondo principal" },
];

export type ThemeIssue = { fg: ThemeKey; bg: ThemeKey; label: string; ratio: number; min: number };

export const themeIssues = (t: SiteTheme): ThemeIssue[] =>
  CHECKS.map((c) => ({ ...c, ratio: contrast(t[c.fg], t[c.bg]) })).filter((c) => c.ratio < c.min);
