import { LogoMark } from "@/components/brand/icons";

// Marca de Cabañas El Cóndor del Ruiz: el monograma (montañas nevadas y cóndor) y el nombre.
//
// Brand: la versión del sitio, con los colores de la paleta (borde y monograma en el texto sobre fondo oscuro).
// Logo / BrandName / PanelBrand: la versión del panel, con colores propios (sello verde bosque y crema), porque el panel
// tiene su propio tema y no usa la paleta del sitio.

// Monograma + "Cabañas / El Cóndor del Ruiz" (sitio público).
export function Brand({ circle = 46, mark = 34, snow = false, wordSize = "1.4rem", eyebrowSize = ".64rem" }) {
  return (
    <>
      <span className="grid flex-none place-items-center rounded-full border-2 border-on-dark" style={{ width: circle, height: circle }}>
        <LogoMark size={mark} snow={snow} />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="font-extrabold tracking-[.16em] uppercase" style={{ fontSize: eyebrowSize }}>
          Cabañas
        </span>
        <span className="display tracking-[.03em] whitespace-nowrap" style={{ fontSize: wordSize }}>
          El Cóndor del Ruiz
        </span>
      </span>
    </>
  );
}

// Sello del panel: el monograma crema sobre verde bosque, en un círculo. Decorativo: junto a él siempre va el nombre, o
// el enlace que lo envuelve lo nombra. `eager` se acepta por compatibilidad (es un SVG en línea: no hay nada que cargar).
export function Logo({ size, className = "" }: { size: number; eager?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={`grid flex-none place-items-center rounded-full bg-[#163a2a] ${className}`} style={{ width: size, height: size }}>
      <svg width={Math.round(size * 0.74)} height={Math.round(size * 0.74)} viewBox="0 0 48 48">
        <path d="M8 36 L19 20 L24 26 L29 18 L40 36 Z" fill="#f2ebd3" />
        <path d="M19 20 L22.5 25 L20.5 25 L19 23.5 L17.2 26 Z M29 18 L33.5 24.5 L31 24 L29 22.5 L26.8 25.5 L26 24.5 Z" fill="#163a2a" />
        <path
          d="M24 12.5 C21.5 11 18 10.2 13 11.2 L15 12 L13 13 L16 13 L15 14.4 C18 13.4 21 13.4 23 14.4 L24 16.2 L25 14.4 C27 13.4 30 13.4 33 14.4 L32 13 L35 13 L33 12 L35 11.2 C30 10.2 26.5 11 24 12.5 Z"
          fill="#f2ebd3"
        />
      </svg>
    </span>
  );
}

// «El Cóndor del Ruiz» con la línea «Cabañas» encima (panel). El panel puede cambiar esa línea (eyebrow).
const EYEBROW = "Cabañas";
export function BrandName({
  wordSize,
  eyebrowSize = ".5em",
  eyebrow = EYEBROW,
  className = "",
}: {
  wordSize: string;
  eyebrowSize?: string;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <span className={`flex min-w-0 flex-col gap-[.14em] leading-none ${className}`} style={{ fontSize: wordSize }}>
      <span className="brand-eyebrow font-body font-extrabold tracking-[.16em] whitespace-nowrap uppercase opacity-80" style={{ fontSize: eyebrowSize }}>
        {eyebrow}
      </span>
      <span className="font-display tracking-[.03em] whitespace-nowrap">El Cóndor del Ruiz</span>
    </span>
  );
}

// Sello + nombre (panel).
export function PanelBrand({
  size = 46,
  wordSize = "1.4rem",
  eyebrowSize = ".5em",
  eyebrow = EYEBROW,
}: {
  size?: number;
  wordSize?: string;
  eyebrowSize?: string;
  eyebrow?: string;
  eager?: boolean;
}) {
  return (
    <>
      <Logo size={size} />
      <BrandName wordSize={wordSize} eyebrowSize={eyebrowSize} eyebrow={eyebrow} />
    </>
  );
}
