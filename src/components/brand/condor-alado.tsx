"use client";

// El cóndor del logo del panel, que aletea dos veces al pasar el mouse por él (o por el enlace que lo contiene).
// En reposo es el mismo <Marca parte="condor" />. Al aletear, se dibuja en un canvas columna por columna: cada columna
// del dibujo sube o baja según lo lejos que esté del hombro (el cuerpo no se dobla, la punta del ala es lo que más
// se mueve) y, en la bajada, las alas se estiran hacia afuera. Así el ala se flexiona entera, como la de un ave, sin
// cortes ni picos. El cuerpo sube un poco con cada golpe de ala.
import { useEffect, useRef } from "react";
import { MARCA, Marca } from "@/components/brand/marca";

// Hombros, en fracción del ancho del dibujo: entre los dos está el cuerpo, que no se dobla.
const SHOULDER_L = 0.46;
const SHOULDER_R = 0.67;
// Fuerza de cada aleteo: el segundo es el golpe fuerte; el tercero, más suave, ya frenando. El cambio de fuerza cae
// justo cuando las alas pasan por su posición de reposo, así que no se nota ningún salto.
const STRENGTH = [1, 1.4, 0.85];
const FLAPS = STRENGTH.length;
const PEAK = Math.max(...STRENGTH);
const FLAP_MS = 800;
const LIFT = 0.11; // cuánto sube la punta del ala, en fracción del ancho del dibujo
const STRETCH = 0.05; // cuánto se estira el ala en la bajada
const BOB = 0.035; // cuánto sube el cuerpo, en fracción del alto

let source: Promise<HTMLImageElement> | null = null;
const loadImage = () =>
  (source ??= new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = MARCA.condor.src;
  }));

export function CondorAlado({ width, className = "bg-current" }: { width: number; className?: string }) {
  const height = Math.round(width * MARCA.condor.ratio);
  const host = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const still = useRef<HTMLSpanElement>(null);
  // Margen del canvas alrededor del logo: lo que suben las puntas y lo que se estiran las alas.
  const padX = Math.ceil(width * STRETCH * PEAK * 0.6) + 2;
  const padY = Math.ceil(width * LIFT * PEAK) + 2;

  useEffect(() => {
    const el = host.current;
    const c = canvas.current;
    const rest = still.current;
    const trigger = el?.closest("a, button") ?? el;
    if (!el || !c || !trigger) return;
    if (!matchMedia("(hover: hover)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let running = false;
    let stopped = false;
    let draw: ((p: number, amp: number) => void) | null = null;
    // El color del logo: el mismo que pinta la máscara (bg-current u otro color de fondo). Se relee al cambiar el tema.
    let color = "";
    const readColor = () => {
      const mask = rest?.firstElementChild ?? rest;
      color = (mask && getComputedStyle(mask).backgroundColor) || getComputedStyle(el).color;
    };

    // Desde que carga la imagen, el logo se dibuja siempre en el canvas (también quieto): la animación empieza y
    // termina en el mismo dibujo, sin cambio de un render a otro.
    loadImage()
      .then((img) => {
        if (stopped) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const cw = width + padX * 2;
        const ch = height + padY * 2;
        c.width = Math.round(cw * dpr);
        c.height = Math.round(ch * dpr);
        const cols = Math.round(width * dpr); // una columna por píxel de pantalla
        const sw = img.naturalWidth / cols;
        draw = (p, amp) => {
          // p: avance del aleteo, 0..FLAPS; amp: cuánto se abre (1 → 0 al frenar). wave > 0: alas arriba; < 0: abajo.
          const wave = Math.sin((p % 1) * Math.PI * 2) * amp;
          const stretch = 1 + STRETCH * Math.max(0, -wave);
          const lift = LIFT * width * wave;
          const bob = BOB * height * Math.max(0, -wave); // el cuerpo sube con el golpe de ala hacia abajo
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, cw, ch);
          ctx.globalCompositeOperation = "source-over";
          for (let k = 0; k < cols; k++) {
            const u = (k + 0.5) / cols; // posición en el dibujo, 0..1
            let bend = 0;
            let x = u;
            if (u < SHOULDER_L) {
              bend = ((SHOULDER_L - u) / SHOULDER_L) ** 1.7;
              x = SHOULDER_L - (SHOULDER_L - u) * stretch;
            } else if (u > SHOULDER_R) {
              bend = ((u - SHOULDER_R) / (1 - SHOULDER_R)) ** 1.7;
              x = SHOULDER_R + (u - SHOULDER_R) * stretch;
            }
            const dx = padX + x * width - (width / cols) * 0.5;
            const dy = padY - lift * bend - bob;
            // Columnas un poco más anchas que su paso: sin rendijas entre ellas cuando el ala se estira.
            ctx.drawImage(img, k * sw, 0, sw, img.naturalHeight, dx, dy, (width / cols) * stretch + 0.6 / dpr, height);
          }
          ctx.globalCompositeOperation = "source-in";
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, cw, ch);
        };
        readColor();
        draw(0, 0);
        c.style.visibility = "visible";
        if (rest) rest.style.visibility = "hidden";
      })
      .catch(() => {});

    // Cambio de tema (claro/oscuro, colores del panel): el logo quieto se vuelve a pintar con el color nuevo.
    const themed = new MutationObserver(() => {
      if (!draw || running) return;
      readColor();
      draw(0, 0);
    });
    themed.observe(document.documentElement, { attributes: true, attributeFilter: ["data-admin-theme", "class", "style"] });

    const play = () => {
      if (running || !draw) return;
      running = true;
      readColor();
      // Frena despacio: el ritmo se va haciendo más lento (el tiempo avanza con una curva que desacelera) y, en el
      // último aleteo, las alas se abren cada vez menos hasta quedar quietas en su lugar.
      const total = FLAPS * FLAP_MS * 1.4;
      const start = performance.now();
      const tick = (now: number) => {
        // El primer cuadro puede traer una marca de tiempo anterior a `start`: nunca negativa.
        const t = Math.min(1, Math.max(0, (now - start) / total));
        const p = FLAPS * Math.sin((t * Math.PI) / 2); // desacelera hacia el final
        const settle = t < 0.6 ? 1 : Math.cos((((t - 0.6) / 0.4) * Math.PI) / 2) ** 1.5;
        const strength = STRENGTH[Math.min(FLAPS - 1, Math.floor(p))];
        draw?.(p, t < 1 ? strength * settle : 0);
        if (t < 1) raf = requestAnimationFrame(tick);
        else running = false;
      };
      raf = requestAnimationFrame(tick);
    };

    trigger.addEventListener("mouseenter", play);
    trigger.addEventListener("focus", play);
    return () => {
      stopped = true;
      themed.disconnect();
      trigger.removeEventListener("mouseenter", play);
      trigger.removeEventListener("focus", play);
      cancelAnimationFrame(raf);
      if (rest) rest.style.visibility = "";
      c.style.visibility = "hidden";
    };
  }, [width, height, padX, padY]);

  return (
    <span ref={host} aria-hidden="true" className="relative block flex-none" style={{ width, height }}>
      <span ref={still} className="block">
        <Marca parte="condor" width={width} className={className} />
      </span>
      <canvas
        ref={canvas}
        className="pointer-events-none absolute"
        style={{ left: -padX, top: -padY, width: width + padX * 2, height: height + padY * 2, visibility: "hidden" }}
      />
    </span>
  );
}
