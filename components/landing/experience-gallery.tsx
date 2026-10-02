"use client";

import { useEffect, useRef, useState } from "react";
import { PhotoSlot } from "../photo-slot";

// Galería de experiencias. En pantallas anchas la experiencia activa se abre a lo ancho (a color, con su número,
// título y una barra de avance) y las demás se pliegan en columnas angostas con el título vertical. Avanza sola al
// terminar la barra; el mouse encima la pausa y pasar sobre una foto la abre. En el celular: carrusel deslizable.
// Sin animaciones (movimiento reducido) no avanza sola: se abre la que se toque o enfoque.

type Item = { id: string; label: string; src?: string };
const STEP_MS = 5000;

export function ExperienceGallery({ items }: { items: Item[] }) {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fuera de pantalla la barra se detiene (y con ella el avance).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const next = () => setActive((i) => (i + 1) % items.length);

  return (
    <div
      ref={ref}
      role="list"
      className="group/gal no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 min-[900px]:h-[clamp(400px,40vw,580px)] min-[900px]:gap-3 min-[900px]:overflow-visible"
    >
      {items.map((e, i) => {
        const on = i === active;
        return (
          <article
            key={e.id}
            role="listitem"
            tabIndex={0}
            aria-label={e.label}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            className={`reveal-on-scroll group relative aspect-[3/4.1] flex-[0_0_max(230px,calc((100%_-_64px)/5))] cursor-pointer snap-start overflow-hidden rounded-lg bg-surface outline-offset-4 min-[900px]:aspect-auto min-[900px]:min-w-0 min-[900px]:[transition:flex-grow_.8s_cubic-bezier(.2,.8,.2,1)] ${
              on ? "min-[900px]:flex-[4.2_1_0%]" : "min-[900px]:flex-[1_1_0%]"
            }`}
          >
            {/* Foto: la activa a todo color y asentada; las plegadas, más oscuras y un poco ampliadas. */}
            <div className={`absolute inset-0 transition-[transform,filter] duration-[1.4s] ease-out ${on ? "scale-100" : "min-[900px]:scale-110 min-[900px]:brightness-[.62] min-[900px]:saturate-[.7]"}`}>
              <PhotoSlot id={`exp-${e.id}`} src={e.src} sizes="(min-width: 900px) 60vw, 240px" />
            </div>
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/75 via-black/25 to-transparent" />

            {/* Celular: título abajo, siempre visible. */}
            <h3 className="absolute inset-x-4 bottom-4 text-[1.05rem] leading-tight font-bold text-card min-[900px]:hidden">{e.label}</h3>

            {/* Pantalla ancha, plegada: número y título en vertical. */}
            <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 bottom-5 hidden flex-col items-center gap-3 transition-opacity duration-500 min-[900px]:flex ${on ? "opacity-0" : "opacity-100 delay-300"}`}>
              <span className="[writing-mode:vertical-rl] rotate-180 text-[.95rem] font-bold whitespace-nowrap text-card">{e.label}</span>
              <span className="display text-[1.3rem] leading-none text-accent">{String(i + 1).padStart(2, "0")}</span>
            </div>

            {/* Pantalla ancha, abierta: número grande, título y barra de avance. */}
            <div className={`pointer-events-none absolute inset-x-0 bottom-0 hidden flex-col gap-3 p-[clamp(20px,2.4vw,34px)] min-[900px]:flex ${on ? "" : "invisible"}`}>
              <span className={`display text-[clamp(2.4rem,4vw,3.6rem)] leading-none text-accent transition-[opacity,transform] duration-700 ${on ? "translate-y-0 opacity-100 delay-200" : "translate-y-4 opacity-0"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className={`display max-w-[18ch] text-[clamp(2rem,3.4vw,3.2rem)] leading-[.92] text-card transition-[opacity,transform] duration-700 ${on ? "translate-y-0 opacity-100 delay-300" : "translate-y-6 opacity-0"}`}>{e.label}</h3>
              <span className="relative mt-1 h-[3px] w-full max-w-[260px] overflow-hidden rounded-full bg-card/25">
                {on && (
                  <span
                    key={`p-${active}`}
                    onAnimationEnd={next}
                    style={{ animationDuration: `${STEP_MS}ms`, animationPlayState: inView ? undefined : "paused" }}
                    className="absolute inset-0 origin-left rounded-full bg-highlight motion-safe:animate-progress group-hover/gal:[animation-play-state:paused]"
                  />
                )}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
