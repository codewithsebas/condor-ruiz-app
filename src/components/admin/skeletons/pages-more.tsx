"use client";

// Esqueletos del resto de páginas del panel (alojamiento, negocio, equipo y fichas de detalle). Mismo criterio que
// pages.tsx: la estructura y los textos fijos de cada vista, con los datos en gris.
import type { ReactNode } from "react";
import {
  ArrowLeftIcon,
  BanIcon,
  BathIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  HomeIcon,
  ListIcon,
  LockIcon,
  LoginIcon,
  MoonIcon,
  PencilIcon,
  PlusIcon,
  ReceiptIcon,
  RefreshIcon,
  ShieldIcon,
  TagIcon,
  TrendIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { CONTENT_GROUPS, CONTENT_SECTIONS, MODULES, type ContentSectionId } from "@/components/admin/routes";
import { ACCENT, Deco, type Accent } from "@/components/admin/ui";
import {
  Block,
  Box,
  Btn,
  CardSk,
  Combo,
  Dark,
  DarkBig,
  DarkFigures,
  DarkSplit,
  Dot,
  FieldSk,
  IconBtn,
  Line,
  ListRow,
  ModHead,
  More,
  PULSE,
  PageHead,
  Pill,
  Search,
  Seg,
  Tile,
} from "@/components/admin/skeletons/kit";

const GRID = "grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3";
const cabinCombo = <Combo icon={<HomeIcon size={14} className="text-ink-muted" />} w="13ch" />;

// Indicador de color (ui.tsx, StatCard con acento) con su figura decorativa y el rótulo fijo.
function AccentStat({ accent, label, icon, w = "5ch" }: { accent: Accent; label: string; icon: ReactNode; w?: string }) {
  return (
    <div className={`relative isolate flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-[22px] p-4 sm:p-5 ${ACCENT[accent].bg}`}>
      <Deco accent={accent} className="-top-5 -right-5 size-[104px] rotate-12" />
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[13.5px] font-semibold text-ink">{label}</p>
        <span className="grid size-8 flex-none place-items-center rounded-full bg-paper/70 text-ink">{icon}</span>
      </div>
      <Line w={w} tone="soft" className="text-[clamp(1.45rem,2.1vw,1.85rem)] leading-tight font-bold" />
      <Line w="12ch" tone="soft" className="text-[12.5px] leading-[22px]" />
    </div>
  );
}

// Fila de datos con rótulo y valor (Facts del detalle).
function Facts({ rows }: { rows: string[] }) {
  return (
    <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-[13.5px]">
      {rows.map((k, i) => (
        <div key={k} className="contents">
          <dt className="text-ink-muted">{k}</dt>
          <dd>
            <Line w={["60%", "45%", "70%", "50%", "38%", "64%"][i % 6]} className="font-medium" />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ───────────── Cabañas ───────────── */

function CabinRowSk({ i }: { i: number }) {
  return (
    <li className="grid min-w-0 grid-cols-1 overflow-hidden rounded-[22px] bg-paper ring-1 ring-line ring-inset md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_260px]">
      <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[220px]">
        <Block className="absolute inset-0" />
        <span className="absolute top-3 left-3 flex gap-1.5">
          <span className="grid size-7 place-items-center rounded-full bg-ink text-[12px] font-semibold text-paper">{i + 1}</span>
          <span className="h-[22px] w-14 rounded-full bg-paper/80" />
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Line w={["42%", "56%", "48%"][i % 3]} className="text-[17px] leading-tight font-semibold" />
            <Line w="92%" className="mt-1 text-[12.5px]" />
            <Line w="70%" className="text-[12.5px]" />
          </div>
          <span className="flex flex-none flex-col items-end">
            <Line w="8ch" className="text-[20px] leading-none font-semibold" />
            <Line w="10ch" className="mt-1 text-[11.5px]" />
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Pill w="120px" className="h-[26px]" />
          <Pill w="180px" className="h-[26px]" />
          <Pill w="150px" className="h-[26px]" />
        </div>
        <Line w="80%" className="text-[12px]" />
        <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
          <Btn variant="primary" icon={<PencilIcon size={13} />}>
            Editar
          </Btn>
          <Btn>Desactivar</Btn>
          <span className="ml-auto flex gap-0.5">
            <IconBtn size="sm" />
            <IconBtn size="sm" />
          </span>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-3 border-t border-line bg-panel/60 p-5 md:col-span-2 xl:col-span-1 xl:grid-cols-1 xl:border-t-0 xl:border-l">
        {["Ocupación 30 días", "Cobrado este mes", "Reservas"].map((k, n) => (
          <div key={k} className="min-w-0">
            <dt className="text-[12px] text-ink-muted">{k}</dt>
            <dd>
              <Line w="5ch" className="mt-1 text-[20px] leading-none font-semibold" />
            </dd>
            {n === 0 && <Block className="mt-2 h-1.5 rounded-full" />}
            {n === 2 && <Line w="8ch" className="mt-0.5 text-[11.5px]" />}
          </div>
        ))}
      </dl>
    </li>
  );
}

export function CabinsSkeleton() {
  return (
    <>
      <ModHead
        eyebrow="Lo que ves aquí es lo que se ofrece en el sitio, en el mismo orden"
        title={MODULES.cabanas.label}
        actions={
          <Btn variant="primary" icon={<PlusIcon size={14} />}>
            Nueva cabaña
          </Btn>
        }
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Dark label="Cabañas para reservar" icon={<HomeIcon size={16} />} className="xl:col-span-5">
          <p className="flex items-baseline gap-2">
            <DarkBig w="1.5ch" />
            <Line w="7ch" tone="dark" className="text-[15px]" />
          </p>
          <div className="mt-auto">
            <DarkFigures labels={["Personas a la vez", "Tipos inactivos", "Fotos"]} />
          </div>
        </Dark>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-7">
          <Tile icon={<TagIcon size={15} />} label="Precio base por noche" value="text-[24px] leading-tight" w="12ch" />
          <Tile icon={<UsersIcon size={15} />} label="Reservas en todas las cabañas" value="text-[24px] leading-tight" w="3ch" />
        </div>
      </div>
      <ol className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <CabinRowSk key={i} i={i} />
        ))}
      </ol>
    </>
  );
}

export function CabinEditorSkeleton() {
  return (
    <>
      <PageHead
        title=""
        actions={
          <Btn variant="ghost" icon={<ArrowLeftIcon size={15} />}>
            Volver a cabañas
          </Btn>
        }
      />
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-4">
          <CardSk title="Información" subtitle="Nombre, etiqueta y descripción que ven los huéspedes." icon={<HomeIcon size={18} />}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
              <FieldSk label="Nombre" />
              <FieldSk label="Etiqueta (opcional)" hint />
            </div>
            <FieldSk label="Descripción" tall hint />
          </CardSk>
          <CardSk title="Capacidad y precio base" subtitle="Las temporadas con precio especial se configuran en Tarifas." icon={<UsersIcon size={18} />}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldSk label="Capacidad máxima" hint />
              <FieldSk label="Cabañas de este tipo" hint />
              <FieldSk label="Noche para 2" />
              <FieldSk label="Persona adicional por noche" hint />
            </div>
          </CardSk>
          <CardSk title="Características" subtitle="Aparecen como etiquetas en la tarjeta de la cabaña." icon={<TagIcon size={18} />}>
            <span className="flex flex-wrap gap-1.5">
              {[90, 120, 80, 110, 96].map((w, i) => (
                <Pill key={i} w={`${w}px`} className="h-[28px]" />
              ))}
            </span>
          </CardSk>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Block className="aspect-[4/3] rounded-[22px]" />
          <Block className="h-[220px] rounded-[20px]" />
        </div>
      </div>
    </>
  );
}

/* ───────────── Decoraciones ───────────── */

export function DecorationsSkeleton() {
  return (
    <>
      <ModHead eyebrow="Extras con costo que se agregan, opcionales, a una reserva" title={MODULES.decoraciones.label} />
      <Block className="h-[64px] rounded-[16px]" />
      <Box title="Decoraciones" subtitle={null}>
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Block key={i} className="h-[60px] rounded-[14px]" />
          ))}
        </div>
      </Box>
    </>
  );
}

/* ───────────── Tarifas ───────────── */

export function RatesSkeleton() {
  return (
    <>
      <ModHead
        eyebrow="El precio de cada noche; las temporadas lo reemplazan en sus fechas"
        title={MODULES.tarifas.label}
        actions={
          <Seg
            options={[
              { label: "Tarifas", icon: <TagIcon size={14} />, count: false },
              { label: "Temporadas", icon: <CalendarIcon size={14} /> },
              { label: "Simulador", icon: <WalletIcon size={14} />, count: false },
            ]}
          />
        }
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Dark
          label="Precio de esta noche"
          icon={<MoonIcon size={16} />}
          sub={<Line w="18ch" tone="dark" className="mt-0.5 text-[12px]" />}
          className="xl:col-span-5"
        >
          <ul className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-end justify-between gap-3 border-t border-paper/15 pt-3 first:border-t-0 first:pt-0">
                <span className="min-w-0 flex-1">
                  <Line w="14ch" tone="dark" className="text-[13px]" />
                  <Line w="20ch" tone="dark" className="text-[11.5px]" />
                </span>
                <Line w="8ch" tone="dark" className="flex-none text-[26px] leading-none font-semibold" />
              </li>
            ))}
          </ul>
        </Dark>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-7">
          <Tile icon={<CalendarIcon size={15} />} label="Temporadas vigentes" value="text-[28px] leading-tight" w="1.5ch" />
          <Tile icon={<TagIcon size={15} />} label="Próxima temporada" value="text-[20px] leading-tight" w="12ch" />
        </div>
      </div>
      <Box title="Las próximas dos semanas" subtitle="Precio por noche en pareja; más intenso, más alto que la tarifa base">
        <div className="-mx-5 overflow-x-auto px-5">
          <div className="grid min-w-[820px] grid-cols-[150px_repeat(14,minmax(0,1fr))] gap-[3px] text-center">
            <span />
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} className="pb-1">
                <Line w="2ch" className="text-[10.5px]" />
                <Line w="2ch" className="text-[11.5px]" />
              </span>
            ))}
            {[0, 1, 2].map((r) => (
              <div key={r} className="contents">
                <span className="pr-2 text-left">
                  <Line w="12ch" className="text-[12.5px] font-medium" />
                  <Line w="8ch" className="text-[11px]" />
                </span>
                {Array.from({ length: 14 }, (_, i) => (
                  <span key={i} className={`h-11 rounded-[10px] bg-panel ring-1 ring-line ring-inset ${PULSE}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Box>
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-[20px] bg-panel px-3 py-1 max-sm:w-full">
            <p className="text-[13px] font-semibold text-ink">Fin de semana</p>
            <div className="flex flex-wrap gap-1">
              {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d, i) => (
                <span
                  key={d}
                  className={`grid size-8 place-items-center rounded-full text-[12.5px] font-semibold ${i === 4 || i === 5 ? "bg-ink text-paper" : "text-ink-muted"}`}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="hidden overflow-hidden rounded-[20px] bg-paper ring-1 ring-line lg:block">
          <div className="grid grid-cols-[1.4fr_1fr_repeat(4,minmax(0,1fr))_120px] border-b border-line bg-canvas/70 text-[12px] font-semibold text-ink-muted">
            {["Cabaña", "Días", "1 persona", "2 personas", "3 personas", "4 personas", ""].map((h, i) => (
              <span key={i} className={`px-3 py-2.5 first:px-4 ${i > 1 ? "text-right" : ""}`}>
                {h}
              </span>
            ))}
          </div>
          {[0, 1, 2].map((r) => (
            <div key={r} className="grid grid-cols-[1.4fr_1fr_repeat(4,minmax(0,1fr))_120px] items-center border-b border-line py-2 last:border-b-0">
              <span className="px-4">
                <Line w="12ch" className="text-[14px] font-bold" />
                <Line w="9ch" className="text-[12.5px]" />
              </span>
              <span className="flex flex-col gap-2 px-3">
                <Pill w="96px" />
                <Pill w="84px" />
              </span>
              {[0, 1, 2, 3].map((c) => (
                <span key={c} className="flex flex-col items-end gap-2 px-3">
                  <Line w="8ch" className="text-[14px] font-semibold" />
                  <Line w="8ch" className="text-[14px] font-semibold" />
                </span>
              ))}
              <span className="px-4 text-right">
                <Btn icon={<PencilIcon size={13} />}>Editar</Btn>
              </span>
            </div>
          ))}
        </div>
        <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:hidden">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex flex-col gap-3 rounded-[20px] bg-paper p-4 ring-1 ring-line">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Line w="12ch" className="font-bold" />
                  <Line w="9ch" className="text-[12.5px]" />
                </div>
                <Btn icon={<PencilIcon size={13} />}>Editar</Btn>
              </div>
              <Block className="h-[96px] rounded-[12px]" />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/* ───────────── Bloqueos y baños ───────────── */

function BlockCardSk({ i }: { i: number }) {
  return (
    <li className="flex min-w-0 flex-col rounded-[22px] bg-paper ring-1 ring-line ring-inset">
      <div className="flex min-w-0 flex-col gap-3 p-5">
        <span className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <Dot />
            <span className="min-w-0 flex-1">
              <Line w={["50%", "40%", "58%"][i % 3]} className="text-[14.5px] font-semibold" />
              <Line w="36%" className="text-[12px]" />
            </span>
          </span>
          <Pill w="72px" />
        </span>
        <span className="flex items-center gap-3 rounded-[14px] bg-panel px-3.5 py-2.5 text-[13px] ring-1 ring-line ring-inset">
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] text-ink-muted">Desde</span>
            <Line w="7ch" className="font-semibold" />
          </span>
          <span className="text-ink-subtle">→</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] text-ink-muted">Hasta</span>
            <Line w="7ch" className="font-semibold" />
          </span>
          <Pill w="70px" />
        </span>
      </div>
      <div className="mt-auto flex items-center justify-end gap-1 border-t border-line px-3 py-2">
        <Btn variant="ghost" icon={<PencilIcon size={13} />} className="mr-auto">
          Editar
        </Btn>
        <IconBtn size="sm" />
      </div>
    </li>
  );
}

export function BlocksSkeleton() {
  return (
    <>
      <ModHead
        eyebrow={null}
        title={MODULES.bloqueos.label}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Seg
              options={[
                { label: "Cabañas", icon: <HomeIcon size={14} /> },
                { label: "Baños", icon: <BathIcon size={14} /> },
              ]}
            />
            <Btn variant="primary" icon={<PlusIcon size={14} />}>
              Nuevo bloqueo
            </Btn>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Dark label="Cerradas hoy" icon={<BanIcon size={16} />} className="h-full xl:col-span-5">
          <p className="flex items-baseline gap-2">
            <DarkBig w="1.5ch" />
            <Line w="10ch" tone="dark" className="text-[15px]" />
          </p>
          <Line w="26ch" tone="dark" className="text-[12.5px]" />
        </Dark>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3 xl:col-span-7">
          <Tile icon={<CalendarIcon size={15} />} label="Próximos 30 días" value="text-[28px] leading-none" w="2ch" />
          <Tile icon={<MoonIcon size={15} />} label="Noches bloqueadas" value="text-[28px] leading-none" w="2ch" />
          <Tile icon={<HomeIcon size={15} />} label="Capacidad cerrada" value="text-[28px] leading-none" w="4ch" />
        </div>
      </div>
      <Box title="Próximos 30 días" subtitle="Cada barra es un bloqueo; haz clic para editarlo">
        <div className="-mx-5 overflow-x-auto px-5">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[150px_minmax(0,1fr)] items-end gap-3 pb-2">
              <span />
              <div className="flex">
                {Array.from({ length: 30 }, (_, i) => (
                  <Line key={i} w="2ch" className="flex-1 text-center text-[10.5px]" />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {[2, 1, 2].map((n, c) => (
                <div key={c} className="flex flex-col gap-1.5">
                  <Line w="12ch" className="text-[11.5px] font-medium" />
                  <ul className="flex flex-col gap-1.5">
                    {Array.from({ length: n }, (_, u) => (
                      <li key={u} className="grid grid-cols-[150px_minmax(0,1fr)] items-center gap-3">
                        <Line w="10ch" className="text-[12.5px] font-medium" />
                        <div className="h-8 rounded-full bg-panel ring-1 ring-line ring-inset" />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Box>
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:max-w-[320px] sm:flex-1">
          <Search placeholder="Cabaña, motivo o nota" />
        </div>
        <div className="w-full sm:w-[210px]">{cabinCombo}</div>
        <Seg className="sm:ml-auto" options={["Vigentes", "Finalizados", "Todos"]} />
      </div>
      <ul className={GRID}>
        {[0, 1, 2].map((i) => (
          <BlockCardSk key={i} i={i} />
        ))}
      </ul>
    </>
  );
}

/* ───────────── Finanzas ───────────── */

export function FinanceSkeleton() {
  return (
    <>
      <ModHead
        eyebrow={null}
        title={MODULES.finanzas.label}
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="w-full sm:w-[200px]">
              <Combo icon={<CalendarIcon size={15} className="text-ink-muted" />} w="10ch" />
            </div>
            <div className="w-full sm:w-[280px]">
              <span className="field-input field-compact flex items-center justify-between gap-2">
                <Line w="18ch" />
                <CalendarIcon size={16} className="flex-none text-ink-muted" />
              </span>
            </div>
            <div className="w-full sm:w-[210px]">{cabinCombo}</div>
            <Btn variant="primary" icon={<ReceiptIcon size={15} />}>
              Pagos del periodo
            </Btn>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Dark
          label=""
          icon={<WalletIcon size={16} />}
          gap="gap-5"
          className="xl:col-span-5"
          sub={<Line w="18ch" tone="dark" className="-mt-[19.5px] text-[13px]" />}
        >
          <div>
            <DarkBig w="7ch" className="text-[clamp(2.3rem,4vw,3.2rem)] leading-none font-semibold" />
            <Line w="24ch" tone="dark" className="mt-3 text-[12px] leading-[22px]" />
          </div>
          <DarkSplit labels={["Abonos", "Saldos", "Pagos"]} valueClass="mt-1 text-[17px] font-semibold" />
        </Dark>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-7">
          {[
            { icon: <CalendarIcon size={16} />, label: "Reservas confirmadas" },
            { icon: <HomeIcon size={16} />, label: "Ocupación" },
            { icon: <UsersIcon size={16} />, label: "Valor promedio por reserva" },
            { icon: <MoonIcon size={16} />, label: "Ingreso por noche ocupada" },
          ].map((k) => (
            <Tile key={k.label} icon={k.icon} label={k.label} value="text-[24px] leading-none" w="6ch" />
          ))}
        </div>
        <Box title="¿Cuándo entró el dinero?" subtitle={null} className="min-h-[380px] xl:col-span-8" action={<Line w="22ch" className="text-[12.5px]" />}>
          <div className="flex flex-1 flex-col pl-12">
            <div className="relative min-h-[260px] flex-1">
              {[0, 0.5, 1].map((f) => (
                <span
                  key={f}
                  className={`absolute inset-x-0 border-t ${f === 0 ? "border-line-strong" : "border-line"}`}
                  style={{ top: `${(1 - f) * 100}%` }}
                />
              ))}
              <div className="relative flex h-full items-end gap-[2px]">
                {[30, 44, 26, 58, 40, 72, 50, 34, 64, 46, 80, 38].map((h, i) => (
                  <span key={i} className="flex h-full min-w-0 flex-1 items-end justify-center">
                    <span className={`block w-full max-w-[24px] rounded-t-[4px] bg-ink/8 ${PULSE}`} style={{ height: `${h}%` }} />
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-2 h-4" />
          </div>
        </Box>
        <Box title="Por cobrar hoy" subtitle="De todas las reservas activas; no cambia con el periodo" action={<More>Pagos</More>} className="xl:col-span-4">
          <Line w="8ch" className="text-[30px] leading-none font-semibold" />
          <ul className="-mx-2 flex flex-col">
            {[0, 1].map((i) => (
              <ListRow key={i} lead={<Dot />} className="py-2.5" w={["30%", "26%"][i]} />
            ))}
          </ul>
          <Block className="mt-auto h-2 rounded-full" />
        </Box>
        <Box title="¿Ya pagaron quienes llegan?" subtitle={null} className="xl:col-span-4">
          <div className="flex flex-1 items-center gap-5">
            <span className={`size-[112px] flex-none rounded-full border-[12px] border-ink/7 ${PULSE}`} />
            <div className="flex min-w-0 flex-1 flex-col gap-3 text-[12.5px]">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <Line w="14ch" />
                  <Line w="8ch" className="text-[14px] font-semibold" />
                </div>
              ))}
            </div>
          </div>
        </Box>
        {[
          { title: "¿Qué cabaña genera más?", subtitle: "Dinero recibido en el periodo" },
          { title: "¿Quién reserva?", subtitle: "Pareja, familia (con niños), grupo (3 o más adultos) o individual" },
        ].map((r) => (
          <Box key={r.title} title={r.title} subtitle={r.subtitle} className="xl:col-span-4">
            <ol className="flex flex-col gap-3.5">
              {[100, 70, 46].map((w, i) => (
                <li key={i} className="flex flex-col gap-1.5">
                  <span className="flex items-baseline justify-between gap-3 text-[12.5px]">
                    <Line w="12ch" />
                    <Line w="10ch" />
                  </span>
                  <span className="block h-2 rounded-full bg-panel">
                    <span className={`block h-full rounded-full bg-ink/10 ${PULSE}`} style={{ width: `${w}%` }} />
                  </span>
                </li>
              ))}
            </ol>
          </Box>
        ))}
        <Box title="Últimos pagos del periodo" action={<More>Ver todos</More>} className="xl:col-span-7">
          <div className="-mx-5">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 border-y border-line px-5 py-2 text-[11.5px] font-medium text-ink-muted">
              <span>Fecha</span>
              <span>Reserva</span>
              <span>Concepto</span>
              <span className="text-right">Valor</span>
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-3 border-b border-line px-5 py-2.5 last:border-b-0">
                <Line w="6ch" className="text-[13px]" />
                <span>
                  <Line w={["50%", "40%", "56%", "44%", "52%"][i]} className="text-[13px] font-medium" />
                  <Line w="30%" className="text-[11.5px]" />
                </span>
                <Line w="6ch" className="text-[13px]" />
                <Line w="9ch" className="text-right text-[13px] font-semibold" />
              </div>
            ))}
          </div>
        </Box>
        <Box title="Contra el periodo anterior" className="xl:col-span-5">
          <div className="flex flex-col">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
                <Line w="16ch" className="text-[12.5px] font-medium" />
                <span className="flex gap-3">
                  <Line w="7ch" className="text-[12.5px]" />
                  <Line w="7ch" className="text-[12.5px]" />
                </span>
              </div>
            ))}
          </div>
          <Btn className="mt-auto w-full">Ver pagos</Btn>
        </Box>
      </div>
    </>
  );
}

/* ───────────── Condiciones de pago ───────────── */

export function TermsSkeleton() {
  return (
    <>
      <ModHead eyebrow="Cuánto paga el huésped para confirmar su reserva y cómo te paga" title={MODULES.condiciones.label} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-7">
          <Box title="Abono para confirmar" subtitle="Porcentaje del total que el huésped paga para que su reserva quede confirmada. El resto es el saldo.">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
              <Line w="5ch" className="text-[44px] leading-none font-semibold" />
              <Block className="h-9 w-[180px] rounded-full" />
            </div>
            <Block className="h-2 rounded-full" />
            <Block className="h-[64px] rounded-[16px]" />
          </Box>
        </div>
        <Box title="" className="min-h-[260px] xl:col-span-5">
          <Block className="flex-1 rounded-[16px]" />
        </Box>
        <Box title="Datos para pagar" subtitle="Cuenta o llave donde el huésped paga el abono y el saldo. Los ve en «Mi reserva»." className="xl:col-span-7">
          <FieldSk label="Instrucciones de pago" tall hint />
        </Box>
        <Box title="Cómo va el cobro de abonos" subtitle="Reservas propias de los últimos 90 días" className="xl:col-span-5">
          <Line w="6ch" className="text-[30px] leading-none font-semibold" />
          <Block className="h-2 rounded-full" />
          <Line w="70%" className="text-[12.5px]" />
        </Box>
        <Box title="Con este abono, en cada cabaña" subtitle="Precio base en pareja (sin temporadas ni personas adicionales)" className="xl:col-span-12">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Block key={i} className="h-[92px] rounded-[16px]" />
            ))}
          </div>
        </Box>
      </div>
    </>
  );
}

/* ───────────── Contenido del sitio ───────────── */

export function ContentSkeleton({ section }: { section: ContentSectionId }) {
  const meta = CONTENT_SECTIONS.find((s) => s.id === section) ?? CONTENT_SECTIONS[0];
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-muted">Edita y mira al lado cómo va quedando la página antes de publicarla</p>
          <h1 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-[-0.025em] text-ink">{MODULES.contenido.label}</h1>
        </div>
        <Block className="h-[31px] w-[132px] rounded-full" />
      </header>
      <div className="-mx-4 no-scrollbar flex gap-x-4 overflow-x-auto px-4 lg:hidden">
        {CONTENT_GROUPS.map((g) => (
          <div key={g} className="flex flex-none flex-col gap-1.5">
            <p className="px-1 text-[12px] font-semibold text-ink-muted">{g}</p>
            <div className="flex gap-1 rounded-full bg-panel p-1">
              {CONTENT_SECTIONS.filter((x) => x.group === g).map((x) => (
                <span
                  key={x.id}
                  className={`inline-flex h-8 flex-none items-center rounded-full px-3 text-[13px] font-semibold whitespace-nowrap pointer-coarse:h-9 ${x.id === section ? "bg-ink text-paper" : "text-ink-muted"}`}
                >
                  {x.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[208px_minmax(0,1fr)] 2xl:grid-cols-[208px_minmax(400px,1fr)_minmax(0,1.15fr)]">
        <nav className="hidden lg:block">
          <div className="flex flex-col gap-4 rounded-[22px] bg-paper p-2 ring-1 ring-line ring-inset">
            {CONTENT_GROUPS.map((g) => (
              <div key={g} className="flex flex-col gap-0.5">
                <p className="px-3 pt-1.5 pb-1 text-[11.5px] font-medium text-ink-subtle">{g}</p>
                {CONTENT_SECTIONS.filter((x) => x.group === g).map((x) => (
                  <span
                    key={x.id}
                    className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium ${x.id === section ? "bg-ink text-paper" : "text-ink"}`}
                  >
                    <span className={`size-4 flex-none rounded-[5px] ${x.id === section ? "bg-paper/40" : "bg-ink/10"}`} />
                    <span className="min-w-0 flex-1 truncate">{x.label}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </nav>
        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex items-start gap-4 rounded-[22px] bg-ink p-5 text-paper">
            <span className="size-10 flex-none rounded-full bg-paper/10" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-paper/60">{`Editando · ${meta.group}`}</p>
              <h2 className="mt-0.5 text-[20px] leading-tight font-semibold tracking-[-0.02em]">{meta.label}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-paper/70">{meta.where}</p>
            </div>
          </section>
          {[0, 1].map((i) => (
            <CardSk key={i} title="" subtitle={null} icon={<span />}>
              <FieldSk label="" />
              <FieldSk label="" tall />
            </CardSk>
          ))}
        </div>
        <Block className="hidden h-[640px] rounded-[22px] 2xl:block" />
      </div>
    </>
  );
}

/* ───────────── Empleados ───────────── */

// Tarjeta de una persona del equipo (employees.tsx, PersonCard).
export function PersonCardSkeleton() {
  return (
    <li aria-hidden="true" className="flex min-w-0 flex-col rounded-[22px] bg-paper ring-1 ring-line ring-inset">
      <div className="flex min-w-0 flex-col gap-4 p-5">
        <span className="flex items-start gap-3">
          <Dot size="size-12" />
          <span className="min-w-0 flex-1">
            <Line w="55%" className="text-[15px] font-semibold" />
            <Line w="75%" className="text-[12.5px]" />
            <span className="mt-2 flex flex-wrap gap-1.5">
              <Pill w="96px" />
              <Pill w="56px" />
            </span>
          </span>
        </span>
        <dl className="grid grid-cols-2 gap-3 border-t border-line pt-3 text-[12px]">
          <div className="min-w-0">
            <dt className="text-ink-muted">Último ingreso</dt>
            <dd>
              <Line w="10ch" className="font-medium" />
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-ink-muted">Creada</dt>
            <dd>
              <Line w="12ch" className="font-medium" />
            </dd>
          </div>
        </dl>
      </div>
      <div className="flex items-center justify-end gap-1 border-t border-line px-3 py-2">
        <Block className="mr-auto h-9 w-[104px] rounded-full" />
        <IconBtn size="sm" />
        <IconBtn size="sm" />
      </div>
    </li>
  );
}

// Lista de ingresos recientes del equipo (Actividad reciente, en Empleados).
export function RecentSignInsSkeleton() {
  return (
    <ol aria-hidden="true" className="flex flex-col gap-3">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="flex items-center gap-3">
          <Dot size="size-[30px]" />
          <span className="min-w-0 flex-1">
            <Line w={["50%", "40%", "58%", "44%"][i]} className="text-[13px] font-medium" />
            <Line w="34%" className="text-[11.5px]" />
          </span>
          <Line w="7ch" className="flex-none text-[12px]" />
        </li>
      ))}
    </ol>
  );
}

export function EmployeesSkeleton() {
  return (
    <>
      <ModHead
        eyebrow="Cada persona entra con su propio correo; el rol decide qué puede ver y hacer"
        title={MODULES.empleados.label}
        actions={
          <>
            <Btn icon={<ShieldIcon size={15} />}>Roles y permisos</Btn>
            <Btn variant="primary" icon={<UserPlusIcon size={15} />}>
              Nuevo empleado
            </Btn>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Dark label="Cuentas activas" icon={<UsersIcon size={16} />} gap="gap-5" className="xl:col-span-5">
          <DarkBig w="1.5ch" />
          <DarkSplit labels={["Administradores", "Recepción", "Desactivadas"]} valueClass="mt-1 text-[18px] font-semibold" />
        </Dark>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3 xl:col-span-7">
          <Tile icon={<CheckIcon size={15} />} label="Entraron esta semana" value="text-[28px] leading-tight" w="1.5ch" />
          <Tile icon={<ClockIcon size={15} />} label="Nunca han entrado" value="text-[28px] leading-tight" w="1.5ch" />
          <Tile icon={<UsersIcon size={15} />} label="Último ingreso" value="text-[18px] leading-tight" w="10ch" />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:max-w-[360px] sm:flex-1">
          <Search placeholder="Buscar por nombre o correo" />
        </div>
        <Seg options={["Todos", "Administradores", "Recepción", "Desactivados"]} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-3 xl:col-span-8">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <PersonCardSkeleton key={i} />
            ))}
          </ul>
        </div>
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-4">
          <Box title="Actividad reciente" subtitle="Último ingreso de cada cuenta" className="h-auto!">
            <RecentSignInsSkeleton />
          </Box>
        </div>
      </div>
    </>
  );
}

/* ───────────── Actividad ───────────── */

// Días del registro con sus movimientos (activity.tsx).
export function ActivityDaysSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      {[3, 2].map((n, d) => (
        <section key={d} className="overflow-hidden rounded-[20px] bg-panel ring-1 ring-line ring-inset">
          <div className="border-b border-line bg-canvas/70 px-4 py-2">
            <Line w="20ch" className="text-[12.5px] font-bold" />
          </div>
          <ul className="divide-y divide-line">
            {Array.from({ length: n }, (_, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                <Dot className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <Line w={["30%", "24%", "36%"][i]} className="text-[14px] font-semibold" />
                  <span className="mt-0.5 flex items-center gap-1.5">
                    <Pill w="70px" />
                    <Line w="40%" className="flex-1 text-[13.5px]" />
                  </span>
                  <Line w="18ch" className="mt-1 text-[12px]" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <>
      <PageHead
        title={MODULES.actividad.label}
        description="Cada movimiento del equipo en el panel, con quién lo hizo, cuándo y qué cambió, y los inicios de sesión."
      >
        <div className="mt-3">
          <Seg
            counts={false}
            options={[
              { label: "Movimientos", icon: <PencilIcon size={13} /> },
              { label: "Inicios de sesión", icon: <LoginIcon size={13} /> },
            ]}
          />
        </div>
      </PageHead>
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-[230px]">
          <Combo icon={<UserIcon size={15} className="text-ink-muted" />} w="13ch" />
        </div>
        <div className="w-full sm:w-[200px]">
          <Combo w="14ch" />
        </div>
        <div className="w-full sm:w-[240px]">
          <Combo w="14ch" />
        </div>
        <div className="w-full sm:w-[280px]">
          <span className="field-input field-compact flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-ink-subtle">Cualquier fecha</span>
            <CalendarIcon size={16} className="flex-none text-ink-muted" />
          </span>
        </div>
      </div>
      <ActivityDaysSkeleton />
    </>
  );
}

/* ───────────── Configuración ───────────── */

export function SettingsSkeleton() {
  const sections = ["Apariencia", "Sonido de notificaciones", "Avisos en este dispositivo", "Tiempo real", "Calendario", "Sesión"];
  return (
    <>
      <ModHead eyebrow="Preferencias de este navegador: no cambian lo que ve el resto del equipo" title="Configuración" />
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-[color-mix(in_srgb,var(--color-ink)_82%,var(--color-paper))] lg:grid-cols-4">
        {["Apariencia", "Sonido", "Tiempo real", "Calendario"].map((k) => (
          <div key={k} className="flex min-w-0 flex-col gap-1.5 bg-ink p-5 text-paper">
            <span className="text-[12px] text-paper/60">{k}</span>
            <Line w="9ch" tone="dark" className="text-[20px] leading-tight font-semibold" />
            <Line w="16ch" tone="dark" className="text-[12px]" />
          </div>
        ))}
      </section>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="hidden lg:block">
          <ul className="flex flex-col gap-1 rounded-[22px] bg-paper p-2 ring-1 ring-line ring-inset">
            {sections.map((s) => (
              <li key={s} className="flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium text-ink">
                <span className="size-4 flex-none rounded-[5px] bg-ink/10" />
                {s}
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex min-w-0 flex-col gap-4">
          <Box
            title="Apariencia"
            subtitle="Claro, oscuro o el mismo modo del sistema de este dispositivo. También se cambia desde el encabezado."
            className="h-auto!"
          >
            <Block className="h-[88px] max-w-[420px] rounded-[16px]" />
          </Box>
          <Box title="Sonido de notificaciones" subtitle="Suena cuando llega un aviso nuevo con el panel abierto." className="h-auto!">
            <Block className="h-[72px] rounded-[16px]" />
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {[0, 1, 2].map((i) => (
                <Block key={i} className="h-[86px] rounded-[16px]" />
              ))}
            </div>
          </Box>
        </div>
      </div>
    </>
  );
}

/* ───────────── Sincronización ───────────── */

export function SyncSkeleton() {
  return (
    <>
      <PageHead title="Sincronización" actions={<Btn icon={<RefreshIcon size={14} />}>Revisar ahora</Btn>}>
        <Line w="44ch" className="mt-1.5 text-[14.5px] leading-relaxed" />
      </PageHead>
      <Block className="h-[64px] rounded-[16px]" />
      <CardSk
        title="Pendientes"
        subtitle="Se envían solos, en este orden, cuando hay conexión. Puedes seguir trabajando."
        icon={<ClockIcon size={18} />}
        className="flex flex-col gap-3 p-4 sm:p-5"
      >
        <ul className="flex flex-col divide-y divide-line">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center justify-between gap-2 py-2.5">
              <Line w={["40%", "30%", "46%"][i]} className="text-[13.5px]" />
              <Line w="12ch" className="text-[12.5px]" />
            </li>
          ))}
        </ul>
      </CardSk>
    </>
  );
}

/* ───────────── Mi perfil ───────────── */

export function ProfileSkeleton() {
  return (
    <>
      <PageHead title={MODULES.perfil.label} description="Tu cuenta del panel: cómo te ve el equipo, tu contraseña y lo que incluye tu rol." />
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-4">
          <section className="relative isolate flex flex-col items-start gap-4 overflow-hidden rounded-[22px] bg-blue p-5 sm:p-6">
            <Deco accent="blue" className="-top-8 -right-6 size-[150px] rotate-12" />
            <span className={`size-24 rounded-full bg-paper/60 ${PULSE}`} />
            <div className="w-full min-w-0">
              <Line w="12ch" tone="soft" className="text-[22px] leading-tight font-bold" />
              <Line w="22ch" tone="soft" className="text-[14px]" />
            </div>
            <span className="h-[27px] w-[124px] rounded-full bg-paper/75" />
          </section>
          <CardSk title="Lo que incluye tu rol" subtitle={null} icon={<ShieldIcon size={18} />}>
            <Block className="h-[160px] rounded-[16px]" />
          </CardSk>
        </div>
        <div className="flex flex-col gap-4">
          <CardSk title="Datos personales" subtitle="Tu nombre aparece en el menú de la cuenta." icon={<UserIcon size={18} />}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldSk label="Nombre" />
              <FieldSk label="Correo" hint />
              <div className="flex justify-end sm:col-span-2">
                <Btn variant="primary" icon={<CheckIcon size={14} />}>
                  Guardar nombre
                </Btn>
              </div>
            </div>
          </CardSk>
          <CardSk title="Contraseña" subtitle="Al cambiarla, tu sesión en este navegador sigue abierta." icon={<LockIcon size={18} />}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldSk label="Contraseña nueva" hint />
              <FieldSk label="Repite la contraseña" />
              <div className="flex justify-end sm:col-span-2">
                <Btn variant="primary" icon={<LockIcon size={14} />}>
                  Cambiar contraseña
                </Btn>
              </div>
            </div>
          </CardSk>
        </div>
      </div>
    </>
  );
}

/* ───────────── Ficha de una reserva ───────────── */

export function ReservationDetailSkeleton() {
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <Line w="9ch" className="text-[25px] leading-[1.12] font-bold" />
          <Line w="34ch" className="mt-1.5 text-[14.5px] leading-relaxed" />
          <div className="mt-2 flex gap-1.5">
            <Pill w="96px" className="h-[23px]" />
            <Pill w="80px" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Block className="h-9 w-[118px] rounded-full" />
          <Block className="h-9 w-[104px] rounded-full" />
          <IconBtn />
        </div>
      </header>
      <div className="@container flex flex-col gap-4">
        {/* Franja de resumen con divisores (como «Hoy» en el Dashboard). */}
        <div className="overflow-hidden rounded-[22px] bg-panel ring-1 ring-line ring-inset">
          <div className="-mr-px -mb-px grid grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-5">
            {(
              [
                ["Estadía", <CalendarIcon key="i" size={16} />, "11ch"],
                ["Cabaña", <HomeIcon key="i" size={16} />, "8ch"],
                ["Pagado", <WalletIcon key="i" size={16} />, "8ch"],
                ["Huéspedes", <UsersIcon key="i" size={16} />, "2ch"],
                ["Siguiente paso", <ClockIcon key="i" size={16} />, "10ch"],
              ] as const
            ).map(([label, icon, w]) => (
              <div
                key={label}
                className="flex min-w-0 items-start gap-3 border-r border-b border-line px-4 py-4 first:col-span-2 @md:px-5 @3xl:first:col-span-1"
              >
                <span className="hidden size-9 flex-none place-items-center rounded-full bg-paper text-ink ring-1 ring-line @md:grid">{icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-ink-muted">{label}</p>
                  <Line w={w} className="mt-1 text-[17px] leading-tight font-semibold" />
                  <Line w="9ch" className="mt-1 text-[11.5px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 items-start gap-4 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <Box title="Estadía" subtitle={null}>
              <Block className="h-[64px] rounded-[16px]" />
              <Block className="h-[64px] rounded-[16px]" />
              <Facts rows={["Huéspedes", "Mascota", "Canal", "Creada"]} />
            </Box>
            <Box title="Pago" subtitle={null} action={<Line w="8ch" className="text-[22px] font-semibold" />}>
              <Block className="h-2.5 rounded-full" />
              <Block className="h-[60px] rounded-[16px]" />
              <Block className="h-[60px] rounded-[16px]" />
            </Box>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <Box title="Huésped" action={<Pill w="72px" className="h-8" />}>
              <div className="flex items-center gap-3">
                <Dot size="size-11" />
                <Line w="16ch" className="text-[18px] font-semibold" />
              </div>
              <Facts rows={["Celular", "Correo", "Documento", "Ciudad"]} />
            </Box>
            <Box title="Notas internas" subtitle={null}>
              <Block className="h-[120px] rounded-[16px]" />
            </Box>
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────── Ficha de un cliente ───────────── */

export function ClientDetailSkeleton() {
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <Line w="14ch" className="text-[25px] leading-[1.12] font-bold" />
          <Line w="30ch" className="mt-1.5 text-[14.5px] leading-relaxed" />
          <div className="mt-2 flex gap-1.5">
            <Pill w="120px" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Block className="h-9 w-[112px] rounded-full" />
          <Block className="h-9 w-[96px] rounded-full" />
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AccentStat accent="pink" label="Reservas" icon={<ListIcon size={15} />} w="2ch" />
        <AccentStat accent="green" label="Noches" icon={<MoonIcon size={15} />} w="2ch" />
        <AccentStat accent="yellow" label="Valor generado" icon={<TrendIcon size={15} />} w="6ch" />
        <AccentStat accent="blue" label="Próxima llegada" icon={<CalendarIcon size={15} />} w="7ch" />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-4">
          <CardSk title="Datos del cliente" subtitle={null} icon={<UserIcon size={17} />}>
            <Facts rows={["Documento", "Celular", "Correo", "Ciudad", "Cliente desde"]} />
          </CardSk>
          <CardSk title="Historial de reservas" subtitle={null} icon={<ListIcon size={17} />} className="flex flex-col gap-3 p-4 sm:p-5">
            <ul className="-mx-2 flex flex-col">
              {[0, 1, 2].map((i) => (
                <ListRow key={i} lead={<Dot size="size-8" />} w={["40%", "34%", "46%"][i]} className="py-2.5" />
              ))}
            </ul>
          </CardSk>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <CardSk title="Valoración interna" subtitle={null} icon={<ShieldIcon size={17} />} actions={<Pill w="72px" />}>
            <Block className="h-[48px] rounded-[16px]" />
            <Block className="h-[120px] rounded-[16px]" />
          </CardSk>
          <CardSk title="Etiquetas" subtitle="Para reconocer al cliente de un vistazo." icon={<TagIcon size={17} />} accent="bg-yellow">
            <span className="flex flex-wrap gap-1.5">
              {[80, 64, 96].map((w, i) => (
                <Pill key={i} w={`${w}px`} />
              ))}
            </span>
          </CardSk>
        </div>
      </div>
    </>
  );
}
