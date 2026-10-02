import type { CSSProperties } from "react";
import { PawTrail } from "../icons";
import { SoaringCondor } from "./soaring-condor";

// Paso de «Experiencias» al valle de «Así se llega»: el horizonte de la cordillera con el Nevado del Ruiz entre niebla.
// Capas, de lejos a cerca:
//   cordillera y nevado — al hacer scroll se desplazan un poco más lento que la página (profundidad);
//   un cóndor lejano que planea hacia el nevado;
//   dos bancos de niebla que se corren muy despacio, en sentidos opuestos;
//   lomas cercanas del color del valle, que se disuelven hacia abajo;
//   y las huellas que ya cruzaban este espacio, por delante.
// Ocupa en la página el mismo alto que antes ocupaban las huellas: el paisaje se extiende sobre los márgenes vacíos de
// las dos secciones, sin tocar su contenido. Con movimiento reducido queda como una ilustración quieta.

const FAR =
  "M0 320V170l60-18 58 10 72-34 66 22 66-16 76 20 80-32 74 20 78-14 60 14 78-34 74-36q28-22 56-26h60q28 4 56 26l66 38 66 20 64-12 78 24 72-16 80 12v182z";
const SNOW = "M842 72q28-22 56-26h60q28 4 56 26l-14 8-14-7-14 11-14-9-14 11-14-11-14 9-14-10-14 8-14-9-16 7z";
const NEAR = "M0 240v-42c110-16 210 10 330-4s230-24 370-6 230 26 370 4 240-20 370-2v50z";

// Niebla: manchas suaves del crema de la marca, casi transparentes.
const fog = (spots: string[]): CSSProperties => ({
  background: spots.map((s) => `radial-gradient(${s}, rgb(242 235 211 / 0.075), transparent 70%)`).join(", "),
});

export function Horizon() {
  return (
    <div aria-hidden="true" className="relative z-1 h-16">
      <div className="pointer-events-none absolute inset-x-0 -top-[clamp(40px,5vw,80px)] -bottom-[clamp(48px,6vw,96px)] [mask-image:linear-gradient(to_bottom,black_58%,transparent)]">
        <div className="parallax-on-scroll absolute inset-0 [--parallax:22px]">
          <svg viewBox="0 0 1440 240" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <path d={FAR} className="fill-surface" />
            <path d={SNOW} className="fill-card/15" />
          </svg>
        </div>

        <SoaringCondor id="condor-horizonte" className="absolute top-[12%] left-[44%] w-[clamp(38px,4vw,64px)]" opacity={0.3} depth={0} offset={0.6} slow={1.8} />

        <div className="parallax-on-scroll absolute inset-x-0 top-[30%] h-[50%] [--parallax:10px]">
          <div className="absolute -inset-x-[12%] inset-y-0 motion-safe:animate-fog-drift" style={fog(["38% 60% at 24% 55%", "30% 50% at 70% 45%"])} />
        </div>

        <svg viewBox="0 0 1440 240" preserveAspectRatio="none" className="absolute inset-0 size-full fill-[color-mix(in_srgb,var(--color-bg)_55%,var(--color-deep))]">
          <path d={NEAR} />
        </svg>

        <div className="absolute -inset-x-[12%] bottom-[6%] h-[38%] motion-safe:animate-fog-drift-back" style={fog(["34% 70% at 40% 50%", "26% 60% at 86% 60%"])} />
      </div>

      <div className="gutter-1360 relative">
        <PawTrail variant="b" />
      </div>
    </div>
  );
}
