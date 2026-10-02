"use client";

import { useEffect, useRef, useState } from "react";
import type { Policy } from "@/lib/config";
import { ChevronDownIcon } from "../icons";

// Preguntas de «Reservas y políticas». La abierta se despliega con animación y, cada 7 s (lo que tarda su barra), pasa
// sola a la siguiente. Se pausa con el mouse encima, al navegar con el teclado dentro o fuera de pantalla; si se
// cierran todas, deja de avanzar hasta que se abra otra. Con movimiento reducido no avanza sola.
const STEP_MS = 7000;

export function PoliciesAccordion({ policies }: { policies: Policy[] }) {
  const [openIdx, setOpenIdx] = useState(0);
  const [inView, setInView] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const paused = !inView || focused;

  return (
    <div
      ref={ref}
      // Solo el foco del teclado pausa (con un clic el foco se queda en el botón y la pausa no terminaría nunca).
      onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
      className="group/acc flex min-w-0 flex-[2_1_520px] flex-col gap-2.5"
    >
      {policies.map((f, i) => {
        const open = openIdx === i;
        return (
          <div
            key={i}
            className={`reveal-on-scroll relative overflow-hidden rounded-md transition-[background-color,box-shadow] duration-500 ${open ? "bg-[color-mix(in_srgb,var(--color-surface)_88%,var(--color-accent))] shadow-[0_18px_36px_-24px_rgb(0_0_0/0.7)]" : "bg-surface hover:bg-[color-mix(in_srgb,var(--color-surface)_94%,var(--color-accent))]"}`}
          >
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`pol-${i}`}
                onClick={() => setOpenIdx(open ? -1 : i)}
                className="flex min-h-16 w-full items-center justify-between gap-4 rounded-md py-3 pr-3.5 pl-5 text-left text-[1.02rem] font-bold text-on-dark"
              >
                <span className="flex items-center gap-3.5">
                  <span aria-hidden="true" className={`display w-7 text-[1.35rem] leading-none tabular-nums transition-colors duration-500 ${open ? "text-highlight" : "text-accent/70"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {f.q}
                </span>
                <span aria-hidden="true" className={`grid size-10 flex-none place-items-center rounded-full transition-[transform,background-color,color] duration-500 ${open ? "rotate-180 bg-card text-on-light" : "text-on-dark"}`}>
                  <ChevronDownIcon />
                </span>
              </button>
            </h3>
            {/* Se despliega animando la altura (filas de grid de 0fr a 1fr) y el texto entra deslizándose. */}
            <div id={`pol-${i}`} inert={!open} className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <p className={`max-w-[64ch] pr-6 pb-[22px] pl-[66px] leading-[1.6] text-on-dark-muted transition-[opacity,transform] duration-500 motion-reduce:transition-none ${open ? "translate-y-0 opacity-100 delay-150" : "-translate-y-2 opacity-0"}`}>{f.a}</p>
              </div>
            </div>
            {/* Barra de avance: al terminar abre la siguiente pregunta. */}
            {open && (
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-on-dark/10">
                <span
                  key={`p-${openIdx}`}
                  onAnimationEnd={() => setOpenIdx((x) => (x + 1) % policies.length)}
                  style={{ animationDuration: `${STEP_MS}ms`, animationPlayState: paused ? "paused" : undefined }}
                  className="absolute inset-0 origin-left bg-highlight motion-safe:animate-progress group-hover/acc:[animation-play-state:paused]"
                />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
