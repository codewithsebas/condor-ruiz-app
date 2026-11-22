// Piezas de los tableros del panel (Inicio y Finanzas): tarjeta blanca con borde fino, enlace «ver más», cifra con su
// rótulo, variación contra el periodo anterior y dinero en corto para ejes y etiquetas.
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from "@/components/ui/icons";

// Dinero en corto: $850 mil, $1,2 M, $12 M.
export const money = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(".", ",")} M` : n >= 1e3 ? `$${Math.round(n / 1e3)} mil` : `$${n}`;

// Tarjeta del tablero: blanca con borde fino, título pequeño y una acción a la derecha.
export function Panel({
  id,
  title,
  subtitle,
  action,
  className = "",
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`flex h-full min-w-0 flex-col gap-4 rounded-[22px] bg-paper p-5 ring-1 ring-line ring-inset ${className}`}>
      <div className="flex min-h-8 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="text-[14px] font-semibold text-ink">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-[12px] text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex flex-none items-center gap-1 text-[12.5px] font-medium text-ink-muted transition-colors hover:text-ink">
      {children}
      <ArrowRightIcon size={13} />
    </Link>
  );
}

// Franja de cifras separadas por divisores, como la de «Hoy» del Dashboard (fichas de la reserva y del cliente): icono,
// cifra, detalle, una barra opcional y, si se puede, el enlace para cambiar el dato. Las columnas dependen del ancho del
// contenedor (@container): dos en angosto y todas en una fila en ancho. `wideFirst`: con cinco, la primera va a lo ancho
// en angosto (así no queda una sola abajo).
export type SummaryCell = { label: string; value: ReactNode; hint: string; icon: ReactNode; action?: ReactNode; meter?: number };
export function SummaryStrip({ cells, label, wideFirst = false }: { cells: SummaryCell[]; label: string; wideFirst?: boolean }) {
  return (
    <section aria-label={label} className="overflow-hidden rounded-[22px] bg-panel ring-1 ring-line ring-inset">
      {/* Cada cifra lleva su divisor a la derecha y abajo; los del borde quedan fuera (margen negativo y overflow). */}
      <div className={`-mr-px -mb-px grid grid-cols-2 ${cells.length === 5 ? "@3xl:grid-cols-3 @5xl:grid-cols-5" : "@3xl:grid-cols-4"}`}>
        {cells.map((c) => (
          <div
            key={c.label}
            className={`flex min-w-0 items-start gap-3 border-r border-b border-line px-4 py-4 @md:px-5 ${wideFirst ? "first:col-span-2 @3xl:first:col-span-1" : ""}`}
          >
            <span aria-hidden="true" className="hidden size-9 flex-none place-items-center rounded-full bg-paper text-ink ring-1 ring-line @md:grid">
              {c.icon}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-[12px] font-medium text-ink-muted">{c.label}</p>
              <p className="mt-1 text-[17px] leading-tight font-semibold tracking-[-0.02em] break-words text-ink tabular-nums">{c.value}</p>
              {c.meter !== undefined && (
                <span
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={c.meter}
                  aria-label={`${c.label}: ${c.meter} % del total`}
                  className="mt-2 block h-1.5 overflow-hidden rounded-full"
                  style={{ background: "color-mix(in srgb, var(--color-chart-a) 18%, transparent)" }}
                >
                  <span
                    className="block h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${c.meter}%`, background: "var(--color-chart-a)" }}
                  />
                </span>
              )}
              {c.hint && <p className="mt-1 text-[11.5px] text-ink-subtle">{c.hint}</p>}
              {c.action}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Cifra con su rótulo, para las filas de indicadores.
export function Figure({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[12px] font-medium text-ink-muted">{label}</p>
      <p className="mt-1 text-[19px] leading-tight font-semibold tracking-[-0.02em] text-ink">{value}</p>
      {hint && <p className="mt-0.5 truncate text-[11.5px] text-ink-subtle">{hint}</p>}
    </div>
  );
}

// Variación contra el periodo anterior: flecha y cifra, verde si sube y rojo si baja. `unit`: «%» (variación) o «pp»
// (puntos porcentuales, para lo que ya es un porcentaje). `onDark`: sobre la tarjeta oscura.
export function Delta({
  value,
  unit = "%",
  against = "el periodo anterior",
  onDark = false,
}: {
  value: number | null;
  unit?: "%" | "pp";
  against?: string;
  onDark?: boolean;
}) {
  if (value === null) return <span className={`text-[12px] font-medium ${onDark ? "text-paper/70" : "text-ink-muted"}`}>{`Sin datos de ${against}`}</span>;
  const up = value >= 0;
  const tone = onDark ? (up ? "bg-[#d3f3e0] text-[#14532d]" : "bg-[#fde8e5] text-[#9a2a20]") : up ? "bg-success-soft text-success" : "bg-error-soft text-error";
  return (
    <span className={`inline-flex flex-none items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap ${tone}`}>
      {up ? <ArrowUpIcon size={12} /> : <ArrowDownIcon size={12} />}
      {unit === "pp" ? `${Math.abs(Math.round(value))} pp` : `${Math.abs(Math.round(value))} %`}
      <span className="sr-only">{`${up ? "más" : "menos"} que ${against}`}</span>
    </span>
  );
}
