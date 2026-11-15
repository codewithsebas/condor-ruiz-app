import { ImageResponse } from "next/og";
import { CONDOR_HEAD } from "@/components/brand/icons";

// Íconos de la app (pestaña, pantalla de inicio, PWA): el monograma de la marca — montañas nevadas y cóndor.
// "site": crema sobre verde bosque (sitio de reservas). "panel": invertido, para distinguir la app del equipo
// cuando ambas quedan instaladas en el mismo celular. "badge": silueta blanca sobre transparente para la barra de estado
// de Android en las notificaciones push (el sistema solo usa la forma).

export type IconTheme = "site" | "panel" | "badge";
// rounded: esquinas transparentes (pestaña y "any" de la PWA) · square: a sangre, el sistema redondea (iOS)
// maskable: a sangre y con el monograma dentro de la zona segura (círculo del 80 %) que Android recorta.
export type IconShape = "rounded" | "square" | "maskable";

export const ICON_COLORS: Record<IconTheme, { bg: string; fg: string }> = {
  site: { bg: "#163A2A", fg: "#F2EBD3" },
  panel: { bg: "#F2EBD3", fg: "#163A2A" },
  badge: { bg: "transparent", fg: "#FFFFFF" },
};

export const MOUNTAINS = "M8 36 L19 20 L24 26 L29 18 L40 36 Z";
export const SNOW = "M19 20 L22.5 25 L20.5 25 L19 23.5 L17.2 26 Z M29 18 L33.5 24.5 L31 24 L29 22.5 L26.8 25.5 L26 24.5 Z";
// Recorte del lienzo 48×48 del monograma a lo que ocupa el dibujo (34 × 28).
export const MARK_VIEWBOX = "7 9 34 28";
const MARK_RATIO = 28 / 34;

// Fracción del ancho que ocupa el monograma en cada forma.
const FILL: Record<IconShape, number> = { rounded: 0.74, square: 0.64, maskable: 0.54 };

export function appIcon(
  size: number,
  { theme = "site", shape = "rounded", headers }: { theme?: IconTheme; shape?: IconShape; headers?: HeadersInit } = {},
) {
  const { bg, fg } = ICON_COLORS[theme];
  const w = Math.round(size * (theme === "badge" ? 0.94 : FILL[shape]));
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: bg, borderRadius: shape === "rounded" ? size * 0.22 : 0 }}>
        <svg width={w} height={Math.round(w * MARK_RATIO)} viewBox={MARK_VIEWBOX}>
          <path d={MOUNTAINS} fill={fg} />
          <path d={SNOW} fill={bg} />
          <path d={CONDOR_HEAD} fill={fg} />
        </svg>
      </div>
    ),
    { width: size, height: size, headers },
  );
}
