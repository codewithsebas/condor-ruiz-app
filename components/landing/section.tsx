import type { ReactNode } from "react";
import { SparkleIcon } from "../icons";

// Sistema de secciones de la página de inicio: mismo espaciado, ancho, encabezado y tres tonos del verde de la marca.
//   base  — el verde general, para composiciones abiertas.
//   deep  — un «valle» más oscuro: el tono baja y vuelve a subir con degradados largos, sin bordes duros.
//   light — crema, con bordes de cordillera arriba y abajo (como la nieve del nevado). Se usa con moderación.
// Así cada sección se reconoce como una parte propia, pero el recorrido se siente continuo.

export type SectionTone = "base" | "deep" | "light";

// Espaciado vertical común: generoso en escritorio, contenido en el celular.
const SPACE = "py-[clamp(56px,7vw,112px)]";

const TONE: Record<SectionTone, string> = {
  base: "text-on-dark",
  deep: "text-on-dark bg-[linear-gradient(to_bottom,var(--color-bg),var(--color-deep)_clamp(90px,12vw,200px),var(--color-deep)_calc(100%-clamp(90px,12vw,200px)),var(--color-bg))]",
  light: "bg-card text-on-light",
};

// Borde de cordillera de las secciones claras: el verde de la página «cae» en picos sobre el crema (arriba) y
// sube en lomas (abajo). Tenue y bajo, para marcar el cambio sin ser un adorno.
function Ridge({ at }: { at: "top" | "bottom" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1440 60" preserveAspectRatio="none" className={`pointer-events-none absolute inset-x-0 block h-[clamp(22px,3.4vw,48px)] w-full fill-bg ${at === "top" ? "-top-px" : "-bottom-px rotate-180"}`}>
      <path d="M0 0h1440v18l-90 22-110-30-120 34-100-20-130 28-110-26-120 30-110-22-120 26-110-30-120 28-100-18L0 34z" />
    </svg>
  );
}

type SectionProps = {
  id?: string;
  tone?: SectionTone;
  labelledBy?: string;
  className?: string; // composición propia del contenido (flex, grid…)
  children: ReactNode;
};

export function Section({ id, tone = "base", labelledBy, className = "", children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`relative scroll-mt-4 ${SPACE} ${TONE[tone]} ${tone === "light" ? "my-[clamp(16px,3vw,40px)]" : ""}`}>
      {tone === "light" && (
        <>
          <Ridge at="top" />
          <Ridge at="bottom" />
        </>
      )}
      <div className={`gutter-1360 relative ${className}`}>{children}</div>
    </section>
  );
}

type HeaderProps = {
  id: string; // id del título (aria-labelledby de la sección)
  kicker: string;
  title: ReactNode;
  accent?: ReactNode; // segunda parte del título, en verde
  subtitle?: ReactNode;
  // split: título a la izquierda y subtítulo a la derecha (escritorio); stack: todo en columna.
  layout?: "split" | "stack";
  tone?: SectionTone;
  breakTitle?: boolean; // la parte en verde en su propia línea
  children?: ReactNode; // acciones junto al subtítulo
};

// Encabezado común: frase manuscrita, título grande con su parte en verde y un subtítulo que da contexto.
export function SectionHeader({ id, kicker, title, accent, subtitle, layout = "split", tone = "base", breakTitle = false, children }: HeaderProps) {
  const light = tone === "light";
  return (
    <header
      className={`reveal-on-scroll mb-[clamp(28px,4vw,52px)] grid gap-x-12 gap-y-4 ${layout === "split" ? "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end" : ""}`}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <p className={`kicker pb-1 ${light ? "text-on-light" : ""}`}>
          <SparkleIcon className="motion-safe:animate-twinkle" />
          {kicker}
        </p>
        <h2 id={id} className="display-xl text-balance">
          <span className={breakTitle ? "block" : ""}>{title}</span>
          {accent && (
            <>
              {breakTitle ? null : " "}
              <span className={`${breakTitle ? "block" : ""} ${light ? "text-[color-mix(in_srgb,var(--color-accent)_70%,var(--color-on-light))]" : "text-accent"}`}>{accent}</span>
            </>
          )}
        </h2>
      </div>
      {(subtitle || children) && (
        <div className="flex max-w-[52ch] flex-col items-start gap-4 lg:pb-2">
          {subtitle && <p className={`text-[1.02rem] leading-relaxed text-pretty ${light ? "text-on-light-muted" : "text-on-dark-muted"}`}>{subtitle}</p>}
          {children}
        </div>
      )}
    </header>
  );
}
