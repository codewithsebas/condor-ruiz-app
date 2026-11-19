import type { CSSProperties } from "react";

// Logo de Cabañas El Cóndor del Ruiz (arte original): el cóndor sobre el Nevado del Ruiz con su fumarola y, entre dos
// líneas, «Cabañas / EL CÓNDOR DEL RUIZ». Los PNG de public/marca son siluetas negras sobre transparente: aquí se usan
// como máscara, así que el logo toma el color de fondo que se le dé (bg-on-dark en el sitio, bg-current para heredar el
// color del texto, un color fijo en el panel). Los íconos de la app y del correo están en public/icons, public/correo y
// app/ (icon.png, apple-icon.png, favicon.ico), generados desde el mismo arte.
export const MARCA = {
  logo: { src: "/marca/logo.png", ratio: 627 / 900 }, // completo, apilado
  simbolo: { src: "/marca/simbolo.png", ratio: 338 / 800 }, // cóndor, nevado y fumarola
  nombre: { src: "/marca/nombre.png", ratio: 233 / 900 }, // las dos líneas con «Cabañas / EL CÓNDOR DEL RUIZ»
  condor: { src: "/marca/condor.png", ratio: 288 / 900 }, // el cóndor solo, en vuelo (logo del panel)
} as const;

export type MarcaParte = keyof typeof MARCA;

// Una parte del logo. Con `width` el alto sale de su proporción; con `height` (número o CSS), el ancho.
export function Marca({
  parte,
  width,
  height,
  className = "bg-current",
  style,
}: {
  parte: MarcaParte;
  width?: number;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}) {
  const { src, ratio } = MARCA[parte];
  const mask = `url(${src}) center / contain no-repeat`;
  const size: CSSProperties = width !== undefined ? { width, height: Math.round(width * ratio) } : { height, aspectRatio: `${1 / ratio}` };
  return <span aria-hidden="true" className={`block flex-none ${className}`} style={{ ...size, mask, WebkitMask: mask, ...style }} />;
}
