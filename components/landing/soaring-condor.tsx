import type { CSSProperties } from "react";

// Cóndor en vuelo para la portada: la misma silueta del sitio, con las alas articuladas en el hombro.
// Capas (cada una anima una sola cosa para que no se pisen):
//   parallax (sigue al mouse, --hx/--hy de HeroParallax) › llegada › órbita horizontal › órbita vertical e inclinación › alas.
// Todo con motion-safe: con movimiento reducido queda la silueta quieta, como antes.

const BODY =
  "M100 20 C92 15 80 11 62 11 C44 11 26 15 4 27 L11 28 L4 32 L13 32 L7 37 L17 35 L13 40 L25 35 C41 29 61 27 81 28 C89 29 94 31 97 35 L100 43 L103 35 C106 31 111 29 119 28 C139 27 159 29 175 35 L187 40 L183 35 L193 37 L187 32 L196 32 L189 28 L196 27 C174 15 156 11 138 11 C120 11 108 15 100 20 Z M96 20 C96 13 104 13 104 20 Z";
// Punto del hombro (en unidades del viewBox 200×50) sobre el que giran las alas.
const SHOULDER = "100px 24px";
const wing = (delay: string): CSSProperties => ({ transformBox: "view-box", transformOrigin: SHOULDER, animationDelay: delay });

type Props = {
  className?: string; // tamaño y posición (absolute…)
  fill?: string; // clase de relleno sólido ("fill-on-dark")
  opacity?: number; // transparencia del cóndor completo: así alas y cuerpo no se suman donde se superponen
  arrive?: boolean; // entra planeando al cargar
  depth?: number; // cuánto sigue al mouse (0 = nada)
  // Desfase para que dos cóndores no vuelen sincronizados.
  offset?: number;
  slow?: number; // multiplica la duración de la órbita (más lejos = más lento)
  id: string; // único por cóndor en la página (ids de los recortes del SVG)
};

export function SoaringCondor({ id, className = "", fill = "fill-on-dark", opacity = 0.25, arrive = false, depth = 1, offset = 0, slow = 1 }: Props) {
  const orbit = (base: number): CSSProperties => ({ animationDuration: `${base * slow}s`, animationDelay: `${-offset * base}s` });
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none transition-[translate] duration-700 ease-out ${className}`}
      style={{ translate: `calc(var(--hx, 0) * ${-26 * depth}px) calc(var(--hy, 0) * ${-14 * depth}px)` }}
    >
      <div className={arrive ? "motion-safe:animate-condor-arrive" : ""}>
        <div className="motion-safe:animate-soar-x" style={orbit(13)}>
          <div className="motion-safe:animate-soar-y" style={orbit(6.5)}>
            <svg viewBox="0 0 200 50" className={`block h-auto w-full overflow-visible ${fill}`} style={{ opacity }}>
              <defs>
                <clipPath id={`${id}-l`}>
                  <rect x="-20" y="-60" width="120" height="170" />
                </clipPath>
                <clipPath id={`${id}-r`}>
                  <rect x="100" y="-60" width="120" height="170" />
                </clipPath>
                <clipPath id={`${id}-b`}>
                  <rect x="91" y="0" width="18" height="50" />
                </clipPath>
              </defs>
              <g clipPath={`url(#${id}-l)`}>
                <path d={BODY} className="motion-safe:animate-wing-left" style={wing(`${-offset * 7}s`)} />
              </g>
              <g clipPath={`url(#${id}-r)`}>
                <path d={BODY} className="motion-safe:animate-wing-right" style={wing(`${-offset * 7}s`)} />
              </g>
              {/* Cuerpo y cabeza: quietos sobre la unión de las alas. */}
              <path d={BODY} clipPath={`url(#${id}-b)`} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
