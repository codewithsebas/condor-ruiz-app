import { serviceIconPath } from "@/lib/service-icons";
import type { SiteService } from "@/lib/site";

// Tarjeta de un servicio (sitio y vista previa del panel). Al pasar el mouse: se eleva, el ícono se rellena y se vuelve
// a dibujar con el trazo, y el ícono grande del fondo gira. Con etiqueta («Valor adicional») se marca como extra.
export function ServiceCard({ s, index }: { s: Pick<SiteService, "title" | "description" | "icon" | "note">; index?: number }) {
  const d = serviceIconPath(s.icon);
  const extra = !!s.note;
  return (
    <div
      className={`group relative isolate flex h-full min-h-[136px] flex-col gap-2.5 overflow-hidden rounded-lg p-4 transition-[transform,background-color,box-shadow,border-color] duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_26px_40px_-26px_rgb(0_0_0/0.75)] sm:min-h-[160px] sm:gap-3 sm:p-5 ${
        extra
          ? "border-2 border-dashed border-highlight/80 bg-surface hover:border-highlight"
          : "bg-surface hover:bg-[color-mix(in_srgb,var(--color-surface)_86%,var(--color-accent))]"
      }`}
    >
      {/* Ícono grande y tenue de fondo */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute -right-6 -bottom-7 -z-10 size-36 -rotate-12 text-on-dark/[.05] transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-0"
      >
        <path d={d} />
      </svg>
      {index != null && (
        <span
          aria-hidden="true"
          className="display absolute top-3 right-4 text-[1.3rem] leading-none text-on-dark/12 tabular-nums transition-colors duration-500 group-hover:text-accent/60 sm:top-4 sm:right-5 sm:text-[1.7rem]"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <span
        aria-hidden="true"
        className={`grid size-11 place-items-center rounded-xl ring-1 transition-[background-color,color,transform] duration-500 group-hover:scale-105 sm:size-14 sm:rounded-2xl ${extra ? "bg-highlight/15 text-highlight ring-highlight/40 group-hover:bg-highlight group-hover:text-on-light" : "bg-accent/15 text-accent ring-accent/30 group-hover:bg-accent group-hover:text-on-light"}`}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={d} pathLength={1} className="[stroke-dasharray:1] motion-safe:group-hover:animate-icon-draw" />
        </svg>
      </span>
      <h3 className="pr-5 text-[.95rem] leading-snug font-bold text-balance sm:pr-8 sm:text-[1.05rem]">{s.title}</h3>
      {s.description && <p className="text-[.9rem] leading-snug text-on-dark-muted">{s.description}</p>}
      {s.note && <span className="mt-auto self-start rounded-full bg-highlight px-3 py-1 text-[.76rem] font-extrabold text-on-light">{s.note}</span>}
    </div>
  );
}
