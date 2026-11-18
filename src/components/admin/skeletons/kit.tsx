// Piezas de los esqueletos de carga: copian las del panel (encabezado de módulo, tarjeta oscura, mosaicos, filtros,
// paginador) con sus mismas clases y medidas. Los textos fijos (títulos, rótulos, encabezados de tabla) se escriben tal
// cual; lo que depende de los datos va en barras grises que ocupan el alto de su línea de texto, así nada salta al cargar.
// El pulso solo se anima si el sistema no pide reducir el movimiento.
import type { CSSProperties, ReactNode } from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "@/components/ui/icons";
import { buttonClass, iconButtonClass } from "@/components/admin/ui";

export const PULSE = "motion-safe:animate-pulse-soft";

// Barra de texto: el contenedor lleva el tamaño de letra y el interlineado del texto real (la línea mide lo mismo) y la
// barra ocupa el alto de las letras. `w` en unidades CSS: «9ch» crece con la letra, «60%» con el contenedor.
export function Line({ w, className = "", tone = "ink", style }: { w: string; className?: string; tone?: "ink" | "dark" | "soft"; style?: CSSProperties }) {
  const bg = tone === "dark" ? "bg-paper/15" : tone === "soft" ? "bg-ink/12" : "bg-ink/7";
  return (
    <span aria-hidden="true" className={`block ${className}`}>
      <span className={`inline-block h-[0.72em] max-w-full rounded-full align-middle ${bg} ${PULSE}`} style={{ width: w, ...style }} />
    </span>
  );
}

// Bloque gris con forma libre (fotos, gráficos, campos).
export function Block({ className = "", dark = false, style }: { className?: string; dark?: boolean; style?: CSSProperties }) {
  return <span aria-hidden="true" className={`block ${dark ? "bg-paper/12" : "bg-ink/7"} ${PULSE} ${className}`} style={style} />;
}

// Encabezado de los módulos: la descripción pequeña arriba y el nombre grande. Con `eyebrow` o `title` en null, barras.
export function ModHead({ eyebrow, title, actions, className = "" }: { eyebrow: string | null; title: string | null; actions?: ReactNode; className?: string }) {
  return (
    <header className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow === null ? <Line w="22ch" className="text-[13px] font-medium" /> : <p className="text-[13px] font-medium text-ink-muted">{eyebrow}</p>}
        {title === null ? (
          <Line w="9ch" className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold" />
        ) : (
          <h1 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-[-0.025em] text-ink">{title}</h1>
        )}
      </div>
      {actions}
    </header>
  );
}

// El encabezado de ui.tsx (PageHeader): título de 25 px, descripción y lo que vaya debajo.
export function PageHead({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-[25px] leading-[1.12] font-bold tracking-[-0.03em] text-ink">{title}</h1>
        {description && <p className="mt-1.5 max-w-[72ch] text-[14.5px] leading-relaxed text-ink-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

// Botón de muestra (no se puede pulsar mientras carga).
export function Btn({ children, icon, variant = "secondary", className = "" }: { children?: ReactNode; icon?: ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string }) {
  return (
    <span aria-hidden="true" className={buttonClass(variant, "md", className)}>
      {icon}
      {children}
    </span>
  );
}

export function IconBtn({ children, size = "md", className = "" }: { children?: ReactNode; size?: "sm" | "md"; className?: string }) {
  return (
    <span aria-hidden="true" className={iconButtonClass("secondary", size, className)}>
      {children}
    </span>
  );
}

// Tarjeta oscura de los módulos: rótulo, círculo con su icono y lo de adentro.
export function Dark({ label, icon, sub, className = "", gap = "gap-4", children }: { label: string; icon: ReactNode; sub?: ReactNode; className?: string; gap?: string; children?: ReactNode }) {
  return (
    <section aria-hidden="true" className={`flex min-w-0 flex-col rounded-[22px] bg-ink p-6 text-paper ${gap} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-medium text-paper/70">{label}</h2>
          {sub}
        </div>
        <span className="grid size-9 flex-none place-items-center rounded-full bg-paper/10">{icon}</span>
      </div>
      {children}
    </section>
  );
}

// Cifra grande sobre la tarjeta oscura.
export const DarkBig = ({ w = "3ch", className = "text-[56px] leading-none font-semibold" }: { w?: string; className?: string }) => <Line w={w} tone="dark" className={className} />;

// Barra en partes de la tarjeta oscura y las cifras con su raya a la izquierda.
export function DarkSplit({ labels, bar = true, valueClass = "mt-1 text-[17px] font-semibold", cols = "grid-cols-3", className = "mt-auto" }: { labels: string[]; bar?: boolean; valueClass?: string; cols?: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {bar && <Block dark className="h-2.5 rounded-full" />}
      <DarkFigures labels={labels} valueClass={valueClass} cols={cols} />
    </div>
  );
}

export function DarkFigures({ labels, valueClass = "mt-1 text-[18px] font-semibold", cols = "grid-cols-3", dots = false }: { labels: string[]; valueClass?: string; cols?: string; dots?: boolean }) {
  return (
    <dl className={`grid gap-3 ${cols}`}>
      {labels.map((k, i) => (
        <div key={k} className="min-w-0 border-l border-paper/15 pl-3">
          <dt className="flex items-center gap-1.5 truncate text-[12px] leading-tight text-paper/60">
            {dots && i < labels.length - 1 && <span className="size-2 flex-none rounded-full bg-paper/30" />}
            {k}
          </dt>
          <dd>
            <Line w="5ch" tone="dark" className={valueClass} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

// Mosaico blanco con icono y rótulo (Tile de cada módulo). `value`: clases de la cifra.
export function Tile({ icon, label, value = "text-[26px] leading-none", w = "4ch", className = "" }: { icon: ReactNode; label: string; value?: string; w?: string; className?: string }) {
  return (
    <section aria-hidden="true" className={`flex min-w-0 flex-col gap-3 rounded-[22px] bg-paper p-5 ring-1 ring-line ring-inset ${className}`}>
      <span className="flex items-center gap-2 text-[12.5px] font-medium text-ink-muted">
        <span className="grid size-7 flex-none place-items-center rounded-full bg-panel text-ink ring-1 ring-line">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <Line w={w} className={`font-semibold ${value}`} />
      <Line w="16ch" className="mt-auto text-[12px]" />
    </section>
  );
}

// Opciones de un filtro rápido (Segmented): la elegida (`active`, la primera si no se dice), con la marca; los números, en barras.
export function Seg({ options, size = "md", counts = true, active = 0, className = "" }: { options: (string | { label: string; icon?: ReactNode; count?: boolean })[]; size?: "sm" | "md"; counts?: boolean; active?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`no-scrollbar inline-flex max-w-full items-center gap-1.5 overflow-x-auto p-0.5 ${className}`}>
      {options.map((o, i) => {
        const opt = typeof o === "string" ? { label: o } : o;
        const on = i === active;
        const count = opt.count ?? counts;
        return (
          <span
            key={opt.label}
            className={`inline-flex flex-none items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${
              size === "sm" ? "h-7 px-3 text-[12.5px]" : "h-8 px-3.5 text-[13px] pointer-coarse:h-9"
            } ${on ? "bg-ink text-paper" : "bg-panel text-ink-muted"}`}
          >
            {on && !opt.icon && <span className="-ml-1 size-4 rounded-full bg-paper" />}
            {opt.icon}
            {opt.label}
            {count && <span className={`h-[15px] w-[18px] rounded-full ${on ? "bg-paper/20" : "bg-ink/7"}`} />}
          </span>
        );
      })}
    </div>
  );
}

// Desplegable compacto (Combobox del panel), con su icono opcional y el valor en barra.
export function Combo({ icon, w = "12ch", className = "" }: { icon?: ReactNode; w?: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`field-input field-compact flex items-center justify-between gap-2 rounded-full! ${className}`}>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {icon}
        <Line w={w} className="min-w-0 flex-1" />
      </span>
      <ChevronDownIcon size={16} className="flex-none text-ink opacity-70" />
    </span>
  );
}

// Buscador de las listas (ListSearch): el texto de ayuda es fijo, así que se escribe.
export function Search({ placeholder, className = "", round = false }: { placeholder: string; className?: string; round?: boolean }) {
  return (
    <div aria-hidden="true" className={`relative min-w-0 ${className}`}>
      <SearchIcon size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
      <span className={`field-input field-compact flex items-center pl-8! text-ink-subtle ${round ? "rounded-full!" : ""}`}>
        <span className="truncate">{placeholder}</span>
      </span>
    </div>
  );
}

// Paginador (paginator.tsx): «1–10 de N», filas por página y las páginas.
export function Pager({ className = "rounded-[18px] bg-paper px-4 py-3 ring-1 ring-line" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-3 text-[13px] text-ink-muted ${className}`}>
      <Line w="14ch" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">Filas por página</span>
          <Combo w="2ch" className="w-[92px]" />
        </div>
        <div className="flex items-center gap-0.5">
          <IconBtn size="sm">
            <ChevronLeftIcon size={15} />
          </IconBtn>
          <span className="grid h-8 min-w-8 place-items-center rounded-full bg-ink px-2 text-[13px] font-semibold text-paper pointer-coarse:h-10 pointer-coarse:min-w-10">1</span>
          <span className="grid h-8 min-w-8 place-items-center rounded-full px-2 text-[13px] font-semibold pointer-coarse:h-10 pointer-coarse:min-w-10">2</span>
          <IconBtn size="sm">
            <ChevronRightIcon size={15} />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

// Tarjeta del tablero (board.tsx, Panel) con su título fijo.
export function Box({ title, subtitle, action, className = "", children }: { title: string | null; subtitle?: string | null; action?: ReactNode; className?: string; children?: ReactNode }) {
  return (
    <section aria-hidden="true" className={`flex h-full min-w-0 flex-col gap-4 rounded-[22px] bg-paper p-5 ring-1 ring-line ring-inset ${className}`}>
      <div className="flex min-h-8 items-start justify-between gap-3">
        <div className="min-w-0">
          {title === null ? <Line w="11ch" className="text-[14px] leading-5 font-semibold" /> : <h2 className="text-[14px] font-semibold text-ink">{title}</h2>}
          {subtitle === null ? <Line w="18ch" className="mt-0.5 text-[12px]" /> : subtitle && <p className="mt-0.5 text-[12px] text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// Enlace «ver más» de las tarjetas del tablero.
export function More({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex flex-none items-center gap-1 text-[12.5px] font-medium text-ink-muted">
      {children}
      <ChevronRightIcon size={13} />
    </span>
  );
}

// Fila con dos líneas (nombre y detalle) y una cifra al final, como las listas de los tableros.
export function ListRow({ lead, w = "60%", end = true, className = "py-2" }: { lead?: ReactNode; w?: string; end?: boolean; className?: string }) {
  return (
    <li className={`flex items-center gap-3 px-2 ${className}`}>
      {lead}
      <span className="min-w-0 flex-1">
        <Line w={w} className="text-[13px] font-medium" />
        <Line w="45%" className="text-[11.5px]" />
      </span>
      {end && <Line w="6ch" className="flex-none text-[13px] font-semibold" />}
    </li>
  );
}

// Cifra con su rótulo (board.tsx, Figure).
export function Fig({ label, hint = false, w = "4ch" }: { label: string; hint?: boolean; w?: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[12px] font-medium text-ink-muted">{label}</p>
      <Line w={w} className="mt-1 text-[19px] leading-tight font-semibold" />
      {hint && <Line w="7ch" className="mt-0.5 text-[11.5px]" />}
    </div>
  );
}

// Etiqueta (Badge) en gris.
export const Pill = ({ w = "64px", className = "" }: { w?: string; className?: string }) => (
  <span aria-hidden="true" className={`inline-block h-[22px] flex-none rounded-full bg-ink/7 ${PULSE} ${className}`} style={{ width: w }} />
);

// Círculo de icono o avatar en gris.
export const Dot = ({ size = "size-9", className = "" }: { size?: string; className?: string }) => (
  <span aria-hidden="true" className={`block flex-none rounded-full bg-ink/7 ${PULSE} ${size} ${className}`} />
);

// Tarjeta del panel (ui.tsx, Card) con su cabecera: círculo con icono, título fijo y subtítulo.
export function CardSk({ title, subtitle, icon, accent = "bg-paper", actions, className = "flex flex-col gap-4 p-4 sm:p-5", children }: { title: string; subtitle?: string | null; icon?: ReactNode; accent?: string; actions?: ReactNode; className?: string; children?: ReactNode }) {
  return (
    <section aria-hidden="true" className={`rounded-[20px] bg-panel ring-1 ring-line ring-inset ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className={`flex min-w-0 gap-3 ${subtitle !== undefined ? "items-start" : "items-center"}`}>
          {icon && <span className={`grid size-10 flex-none place-items-center rounded-full text-ink ${accent}`}>{icon}</span>}
          <div className={`min-w-0 ${icon && subtitle !== undefined ? "pt-0.5" : ""}`}>
            <h2 className="text-[15px] leading-tight font-semibold tracking-[-0.01em] text-ink">{title}</h2>
            {subtitle === null ? <Line w="28ch" className="mt-0.5 text-[13px]" /> : subtitle && <p className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

// Campo de formulario (ui.tsx, Field): rótulo fijo y la caja del tamaño real.
export function FieldSk({ label, tall = false, hint = false, className = "" }: { label: string; tall?: boolean; hint?: boolean; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      <span className={`field-input field-compact block ${tall ? "min-h-[96px]!" : ""}`} />
      {hint && <Line w="30ch" className="text-[12.5px] leading-snug" />}
    </div>
  );
}
