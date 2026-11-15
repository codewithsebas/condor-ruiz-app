import type { CSSProperties } from "react";
import { CONDOR_SILHOUETTE } from "@/components/brand/icons";

// Cóndor en vuelo para la portada: la misma silueta del sitio, con las alas articuladas en el hombro.
// Capas (cada una anima una sola cosa para que no se pisen):
//   parallax (sigue al mouse, --hx/--hy de HeroParallax) › llegada › órbita horizontal › órbita vertical e inclinación › alas.
// Todo con motion-safe: con movimiento reducido queda la silueta quieta, como antes.

// Torso: cabeza, lomo, vientre y cola, quieto entre las alas. Entre x 95 y 105 (donde se ve solo) sigue la silueta; a
// los lados baja un poco por dentro de las alas, así tapa el corte del ala en todo el aleteo sin asomar como hombros.
const TORSO =
  "M92.4 18.2 L93.74 18.03 L95 17.35 L96.27 17.93 C97.5 13.69 102.5 13.69 103.73 17.93 L105 17.35 L106.26 18.03 L107.6 18.2 V31.1 C105.72 32.12 104.2 33.4 103 35 L100 43 L97 35 C95.8 33.4 94.28 32.12 92.4 31.1 Z";
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
              {/* Cada ala es la silueta recortada hasta el hombro (sin cabeza ni cola, que al girar se desprenderían);
                  el recorte va dentro del grupo que gira, así el corte acompaña al ala y queda siempre bajo el torso. */}
              <defs>
                <clipPath id={`${id}-l`}>
                  <rect x="-20" y="-60" width="115" height="170" />
                </clipPath>
                <clipPath id={`${id}-r`}>
                  <rect x="105" y="-60" width="115" height="170" />
                </clipPath>
              </defs>
              <g className="motion-safe:animate-wing-left" style={wing(`${-offset * 7}s`)}>
                <path d={CONDOR_SILHOUETTE} clipPath={`url(#${id}-l)`} />
              </g>
              <g className="motion-safe:animate-wing-right" style={wing(`${-offset * 7}s`)}>
                <path d={CONDOR_SILHOUETTE} clipPath={`url(#${id}-r)`} />
              </g>
              <path d={TORSO} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
