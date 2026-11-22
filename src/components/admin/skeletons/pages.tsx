"use client";

// Esqueleto de cada página del panel, calcado de su vista: mismas tarjetas, columnas, filtros y listas, con los textos
// fijos escritos y los datos en gris. `ModuleSkeleton` elige el de la ruta abierta (marco del panel, loading.tsx y el
// Suspense del shell). Las demás páginas están en pages-more.tsx.
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  AlertIcon,
  BanIcon,
  BathIcon,
  BookingIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  FileTextIcon,
  HomeIcon,
  ListIcon,
  LoginIcon,
  LogoutIcon,
  MoonIcon,
  PlusIcon,
  RefreshIcon,
  SlidersIcon,
  SpreadsheetIcon,
  TrendIcon,
  UploadIcon,
  UserIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { STATUS, todayISO } from "@/lib/format";
import { NOTIFICATION_GROUPS } from "@/lib/notification-groups";
import { CALENDAR_VIEWS, DayName } from "@/components/admin/calendar/shared";
import { CONTENT_SECTIONS, MODULES, isContentSection, moduleOf } from "@/components/admin/routes";
import {
  ActivitySkeleton,
  BlocksSkeleton,
  CabinEditorSkeleton,
  CabinsSkeleton,
  ClientDetailSkeleton,
  ContentSkeleton,
  DecorationsSkeleton,
  EmployeesSkeleton,
  FinanceSkeleton,
  ProfileSkeleton,
  RatesSkeleton,
  ReservationDetailSkeleton,
  SettingsSkeleton,
  SyncSkeleton,
  TermsSkeleton,
} from "@/components/admin/skeletons/pages-more";
import {
  Block,
  Box,
  Btn,
  CardSk,
  Combo,
  Dark,
  DarkBig,
  DarkSplit,
  Dot,
  Fig,
  IconBtn,
  Line,
  ListRow,
  ModHead,
  More,
  PULSE,
  PageHead,
  Pager,
  Pill,
  Search,
  Seg,
  Tile,
} from "@/components/admin/skeletons/kit";

export function ModuleSkeleton() {
  const pathname = usePathname();
  const mod = moduleOf(pathname);
  const sub = pathname.split("/")[3] ?? "";
  switch (mod) {
    case "dashboard":
      return <DashboardSkeleton />;
    case "calendario":
      return <CalendarSkeleton />;
    case "notificaciones":
      return <NotificationsSkeleton />;
    case "reservas":
      return sub ? <ReservationDetailSkeleton /> : <ReservationsSkeleton />;
    case "booking":
      return <BookingSkeleton />;
    case "pagos":
      return <PaymentsSkeleton />;
    case "clientes":
      return sub ? <ClientDetailSkeleton /> : <ClientsSkeleton />;
    case "importar":
      return <ImportSkeleton />;
    case "cabanas":
      return sub ? <CabinEditorSkeleton /> : <CabinsSkeleton />;
    case "bloqueos":
      return <BlocksSkeleton />;
    case "tarifas":
      return <RatesSkeleton />;
    case "decoraciones":
      return <DecorationsSkeleton />;
    case "finanzas":
      return <FinanceSkeleton />;
    case "condiciones":
      return <TermsSkeleton />;
    case "contenido":
      return <ContentSkeleton section={isContentSection(sub) ? sub : CONTENT_SECTIONS[0].id} />;
    case "empleados":
      return <EmployeesSkeleton />;
    case "actividad":
      return <ActivitySkeleton />;
    case "configuracion":
      return <SettingsSkeleton />;
    case "sincronizacion":
      return <SyncSkeleton />;
    case "perfil":
      return <ProfileSkeleton />;
    default:
      return (
        <div className="flex flex-col gap-2">
          <Line w="16ch" className="text-[25px] leading-[1.12] font-bold" />
          <Line w="40ch" className="text-[14.5px] leading-relaxed" />
        </div>
      );
  }
}

/* ───────────── Piezas comunes de las listas ───────────── */

// Grilla de tarjetas de las listas (una, dos o tres columnas según el ancho).
export const CARD_GRID = "grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3";

// Tarjeta de una lista: cuerpo y franja de acciones abajo.
function ListCard({ children, actions, strip = false, className = "" }: { children: ReactNode; actions: ReactNode; strip?: boolean; className?: string }) {
  return (
    <li className={`relative flex min-w-0 flex-col overflow-hidden rounded-[22px] bg-paper ring-1 ring-line ring-inset ${className}`}>
      {strip && <span className={`absolute inset-y-0 left-0 w-1.5 bg-ink/10 ${PULSE}`} />}
      <div className={`flex min-w-0 flex-col gap-3 p-5 ${strip ? "pl-6" : ""}`}>{children}</div>
      <div className={`mt-auto flex items-center justify-end gap-1 border-t border-line px-3 py-2 ${strip ? "pl-4" : ""}`}>{actions}</div>
    </li>
  );
}

const icons = (n: number) => Array.from({ length: n }, (_, i) => <IconBtn key={i} size="sm" />);

// Selector de fechas (DateRangePicker): texto de ayuda y el calendario a la derecha.
function DateSk({ placeholder, className = "" }: { placeholder: string; className?: string }) {
  return (
    <span className={`field-input field-compact flex items-center justify-between gap-2 ${className}`}>
      <span className="min-w-0 truncate text-ink-subtle">{placeholder}</span>
      <CalendarIcon size={16} className="flex-none text-ink-muted" />
    </span>
  );
}

// Periodo (period.tsx): el desplegable de presets y el rango.
function PeriodSk() {
  return (
    <>
      <div className="w-full sm:w-[200px]">
        <Combo icon={<CalendarIcon size={15} className="text-ink-muted" />} w="10ch" />
      </div>
      <div className="w-full sm:w-[280px]">
        <DateSk placeholder="" />
      </div>
    </>
  );
}

const cabinCombo = <Combo icon={<HomeIcon size={14} className="text-ink-muted" />} w="13ch" />;

/* ───────────── Dashboard ───────────── */

const MONTH_BARS = [22, 30, 18, 26, 34, 28, 40, 36, 48, 62, 74, 52];
const OCC_LINE = [40, 46, 52, 48, 60, 72, 66, 50, 44, 52, 64, 78, 70, 58, 52];

export function DashboardSkeleton() {
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <Line w="24ch" className="text-[13px] font-medium" />
          <Line w="11ch" className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold" />
        </div>
        <div className="flex items-center gap-2">
          <IconBtn>
            <RefreshIcon size={17} />
          </IconBtn>
          <IconBtn>
            <CalendarIcon size={17} />
          </IconBtn>
          <Btn variant="primary" icon={<PlusIcon size={14} />}>
            Nueva reserva
          </Btn>
        </div>
      </header>

      {/* Pulso del día */}
      <section className="grid grid-cols-2 overflow-hidden rounded-[22px] bg-panel ring-1 ring-line ring-inset sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Llegan hoy", icon: <LoginIcon size={16} /> },
          { label: "Salen hoy", icon: <LogoutIcon size={16} /> },
          { label: "En estadía", icon: <HomeIcon size={16} /> },
          { label: "Por cobrar", icon: <WalletIcon size={16} /> },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-3 border-line px-5 py-4 not-last:border-r max-lg:nth-[2n]:border-r-0 max-sm:border-b">
            <span className="grid size-9 flex-none place-items-center rounded-full bg-paper text-ink ring-1 ring-line">{c.icon}</span>
            <Fig label={c.label} hint w={c.label === "Por cobrar" ? "6ch" : "2ch"} />
          </div>
        ))}
        <div className="col-span-2 flex flex-col justify-center gap-2 px-5 py-4 sm:col-span-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[12px] font-medium text-ink-muted">Ocupación hoy</p>
            <Line w="4ch" className="flex-none text-[19px] leading-tight font-semibold" />
          </div>
          <Block className="h-2 rounded-full" />
          <Line w="20ch" className="text-[11.5px]" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Dinero generado */}
        <section className="flex h-full min-w-0 flex-col gap-6 rounded-[22px] bg-ink p-6 text-paper xl:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <Line w="24ch" tone="dark" className="text-[13px] font-medium" />
              <Line w="7ch" tone="dark" className="mt-2 text-[clamp(2.4rem,4.4vw,3.4rem)] leading-none font-semibold" />
              <Line w="32ch" tone="dark" className="mt-3 text-[12px] leading-[22px]" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-paper/10 px-3 py-1.5 text-[12.5px] font-medium text-paper">Finanzas</span>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {[`En ${todayISO().slice(0, 4)}`, "Ticket promedio", "Ingreso por noche", "Noches vendidas"].map((k) => (
              <div key={k} className="min-w-0 border-l border-paper/15 pl-3">
                <dt className="truncate text-[12px] text-paper/60">{k}</dt>
                <dd>
                  <Line w="6ch" tone="dark" className="mt-1 text-[18px] leading-tight font-semibold" />
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-auto">
            <div className="flex h-[132px] items-end gap-1.5 border-b border-paper/15">
              {MONTH_BARS.map((h, i) => (
                <span key={i} className="flex h-full flex-1 items-end justify-center">
                  <span
                    className={`block w-full max-w-[24px] rounded-t-[4px] ${i === 11 ? "bg-paper/35" : "bg-paper/12"} ${PULSE}`}
                    style={{ height: `${h}%` }}
                  />
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-1.5">
              {MONTH_BARS.map((_, i) => (
                <Line key={i} w="3ch" tone="dark" className="flex-1 text-center text-[11px]" />
              ))}
            </div>
          </div>
        </section>

        {/* Por cobrar */}
        <Box title="Por cobrar" action={<More>Pagos</More>} className="xl:col-span-4">
          <Line w="8ch" className="text-[30px] leading-none font-semibold" />
          <div className="flex flex-col gap-2.5">
            <Block className="h-2 rounded-full" />
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {["Abonos", "Saldos"].map((k) => (
                <li key={k} className="flex items-center gap-1.5 text-[12.5px] text-ink-muted">
                  <span className="size-2 rounded-full bg-ink/15" />
                  {k}
                  <Line w="6ch" className="inline-block" />
                </li>
              ))}
            </ul>
          </div>
          <ul className="-mx-2 flex flex-col">
            {[0, 1, 2].map((i) => (
              <ListRow key={i} w={["55%", "45%", "62%"][i]} />
            ))}
          </ul>
        </Box>

        {/* Ocupación: dos semanas atrás y dos adelante */}
        <Box title="Ocupación" subtitle="Dos semanas atrás y dos semanas adelante" action={<More>Calendario</More>} className="xl:col-span-8">
          <div className="grid grid-cols-3 gap-4 sm:max-w-[460px]">
            <Fig label="Esta noche" hint />
            <Fig label="Promedio 7 días" hint />
            <Fig label="Máximo 15 días" hint />
          </div>
          <div className="mt-auto">
            <div className="relative mr-9 h-[150px] border-b border-line-strong">
              <div className="pointer-events-none absolute inset-0">
                {[0, 50].map((t) => (
                  <span key={t} className="absolute inset-x-0 border-t border-line" style={{ top: `${t}%` }}>
                    <span className="absolute -top-2 -right-9 w-8 text-right text-[10.5px] whitespace-nowrap text-ink-subtle tabular-nums">{`${100 - t} %`}</span>
                  </span>
                ))}
              </div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`absolute inset-0 size-full overflow-visible ${PULSE}`}>
                <polyline
                  points={OCC_LINE.map((v, i) => `${(i / (OCC_LINE.length - 1)) * 100},${100 - v}`).join(" ")}
                  fill="none"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  className="stroke-ink/15"
                />
              </svg>
            </div>
            <div className="mt-1.5 mr-9 h-4" />
            <div className="mt-1.5 mr-9 flex justify-between">
              {[0, 1, 2, 3, 4].map((i) => (
                <Line key={i} w="5ch" className={`text-[11px] ${i % 2 ? "hidden sm:block" : ""}`} />
              ))}
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-subtle">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 rounded-full bg-ink/15" />
                Ocupación por noche (lo que viene, punteado)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-ink" />
                Número de llegadas del día
              </span>
            </p>
          </div>
        </Box>

        {/* Canales y cabañas */}
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-4">
          <Box title="Reservas del mes por canal" className="h-auto!">
            <Line w="20ch" className="text-[22px] leading-[1.25]" />
            <div className="flex flex-col gap-2.5">
              <Block className="h-7 rounded-[4px]" />
              <ul className="flex flex-wrap gap-x-5 gap-y-1">
                {["Directas", "Booking"].map((k) => (
                  <li key={k} className="flex items-center gap-1.5 text-[12.5px] text-ink-muted">
                    <span className="size-2 rounded-full bg-ink/15" />
                    {k}
                    <Line w="2ch" className="inline-block" />
                  </li>
                ))}
              </ul>
            </div>
          </Box>
          <Box title="Cobrado por cabaña este mes" className="flex-1">
            <ul className="flex flex-col gap-3">
              {[90, 64, 40].map((w, i) => (
                <li key={i} className="flex flex-col gap-1.5">
                  <span className="flex items-baseline justify-between gap-3 text-[12.5px]">
                    <Line w="14ch" />
                    <Line w="6ch" />
                  </span>
                  <span className="block h-2 rounded-full bg-panel">
                    <span className={`block h-full rounded-full bg-ink/10 ${PULSE}`} style={{ width: `${w}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </Box>
        </div>

        {/* Hoy */}
        <Box title={null} className="xl:col-span-8" action={<Seg size="sm" options={["Todo", "Llegadas", "Salidas", "En estadía"]} />}>
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-y border-line text-[11.5px] font-medium text-ink-muted">
                  <th className="w-[72px] py-2 pl-5 font-medium">Hora</th>
                  <th className="py-2 font-medium">Huésped</th>
                  <th className="py-2 font-medium">Movimiento</th>
                  <th className="py-2 font-medium">Pago</th>
                  <th className="py-2 pr-5" />
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2].map((i) => (
                  <tr key={i} className="border-b border-line last:border-b-0">
                    <td className="py-3 pl-5">
                      <Line w="5ch" className="font-semibold" />
                    </td>
                    <td className="py-3 pr-3">
                      <Line w={["16ch", "12ch", "14ch"][i]} className="font-medium" />
                      <Line w="10ch" className="text-[11.5px]" />
                    </td>
                    <td className="py-3 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Dot size="size-6" />
                        <Line w="8ch" className="inline-block" />
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <Pill w="88px" />
                    </td>
                    <td className="py-3 pr-5">
                      <span className="flex justify-end gap-1">
                        <Dot size="size-8" />
                        <Dot size="size-8" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Box>

        {/* Próximas llegadas y huéspedes */}
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-4">
          <Box title="Próximas llegadas" action={<More>Ver todas</More>} className="h-auto!">
            <ol className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex w-11 flex-none flex-col items-center rounded-[12px] bg-panel py-1.5 ring-1 ring-line">
                    <Line w="3ch" className="text-[10.5px] font-medium" />
                    <Line w="2ch" className="text-[16px] leading-tight font-semibold" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col pt-0.5">
                    <Line w={["58%", "44%", "52%"][i]} className="text-[13px] font-medium" />
                    <Line w="72%" className="text-[11.5px]" />
                  </span>
                </li>
              ))}
            </ol>
          </Box>
          <Box title="Huéspedes y operación">
            <ul className="-mx-2 flex flex-col">
              {[
                { icon: <UserPlusIcon size={15} />, label: "Clientes nuevos (30 días)" },
                { icon: <UsersIcon size={15} />, label: "Clientes que repiten" },
                { icon: <MoonIcon size={15} />, label: "Noches alojadas (30 días)" },
                { icon: <BathIcon size={15} />, label: "Baños con aviso" },
              ].map((x) => (
                <li key={x.label} className="flex items-center gap-3 px-2 py-2">
                  <span className="grid size-8 flex-none place-items-center rounded-full bg-panel text-ink ring-1 ring-line">{x.icon}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{x.label}</span>
                  <Line w="2ch" className="text-[15px] font-semibold" />
                </li>
              ))}
            </ul>
            <Btn className="mt-auto w-full">Ver clientes</Btn>
          </Box>
        </div>
      </div>
    </>
  );
}

/* ───────────── Reservas ───────────── */

// Reserva como boleto (reservations.tsx, Ticket).
function TicketSk({ i }: { i: number }) {
  return (
    <ListCard strip actions={icons(4)}>
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1">
          <Line w="8ch" className="text-[12px] font-semibold" />
          <Line w={["62%", "50%", "70%"][i % 3]} className="mt-0.5 text-[15px] font-semibold" />
          <Line w="40%" className="text-[12px]" />
        </span>
        <Pill w="84px" className="h-[23px]" />
      </span>
      <span className="flex items-center gap-2 rounded-[16px] bg-panel px-3.5 py-2.5 ring-1 ring-line ring-inset">
        <span className="flex min-w-0 flex-1 flex-col">
          <Line w="8ch" className="text-[11px]" />
          <Line w="6ch" className="text-[18px] leading-tight font-semibold" />
        </span>
        <span className="flex flex-none flex-col items-center px-1">
          <span className="block h-px w-10 bg-line-strong" />
          <Line w="7ch" className="mt-1 text-[11px]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-end">
          <Line w="8ch" className="text-right text-[11px]" />
          <Line w="6ch" className="text-right text-[18px] leading-tight font-semibold" />
        </span>
      </span>
      <span className="flex flex-wrap items-center justify-between gap-2">
        <Pill w="96px" />
        <Line w="9ch" className="text-[17px] font-semibold" />
      </span>
    </ListCard>
  );
}

export function ReservationsSkeleton() {
  const live = ["pending_deposit", "confirmed", "rescheduled", "checked_in"] as const;
  return (
    <>
      <ModHead
        eyebrow={MODULES.reservas.description}
        title={MODULES.reservas.label}
        actions={
          <Btn variant="primary" icon={<PlusIcon size={15} />}>
            Nueva reserva
          </Btn>
        }
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Dark label="Reservas vigentes" icon={<CalendarIcon size={16} />} className="xl:col-span-5">
          <p className="flex items-baseline gap-2">
            <DarkBig w="2ch" />
            <Line w="10ch" tone="dark" className="text-[14px]" />
          </p>
          <div className="mt-auto flex flex-col gap-2.5">
            <Block dark className="h-2.5 rounded-full" />
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
              {live.map((s) => (
                <li key={s} className="flex items-center gap-1.5 text-[12px] text-paper/70">
                  <span className="size-2 rounded-full" style={{ background: STATUS[s].bg }} />
                  {STATUS[s].label}
                  <Line w="1.5ch" tone="dark" className="inline-block" />
                </li>
              ))}
            </ul>
          </div>
        </Dark>
        <div className="grid min-w-0 grid-cols-2 gap-4 xl:col-span-7">
          {[
            { icon: <LoginIcon size={15} />, label: "Llegadas hoy" },
            { icon: <HomeIcon size={15} />, label: "En estadía" },
            { icon: <CalendarIcon size={15} />, label: "Por llegar" },
            { icon: <ClockIcon size={15} />, label: "Sin abono" },
          ].map((t) => (
            <Tile key={t.label} icon={t.icon} label={t.label} value="text-[28px] leading-none" w="2ch" className="gap-2!" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Seg
          className="w-full"
          options={[
            "Todas",
            "Próximas llegadas",
            "Comprobantes",
            ...(Object.entries(STATUS) as [string, { label: string; bg: string }][]).map(([k, s]) => ({
              label: s.label,
              icon: <span key={k} className="size-2 rounded-full ring-1 ring-ink/15" style={{ background: s.bg }} />,
            })),
          ]}
        />
        <div className="grid grid-cols-2 items-center gap-2 md:grid-cols-3 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
          <Search placeholder="Nombre, código, correo, celular o documento" round className="col-span-2 md:col-span-3 xl:col-span-1" />
          {cabinCombo}
          <Combo icon={<CalendarIcon size={14} className="text-ink-muted" />} w="11ch" />
          <DateSk placeholder="Llegada: cualquier fecha" />
          <Combo w="15ch" />
        </div>
      </div>
      <Line w="30ch" className="text-[13px]" />
      <ul className={CARD_GRID}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <TicketSk key={i} i={i} />
        ))}
      </ul>
      <Pager />
    </>
  );
}

/* ───────────── Pagos ───────────── */

export function PaymentsSkeleton() {
  return (
    <>
      <ModHead
        eyebrow={MODULES.pagos.description}
        title={MODULES.pagos.label}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Seg
              options={[
                { label: "Recibidos", icon: <TrendIcon size={14} />, count: false },
                { label: "Por cobrar", icon: <ClockIcon size={14} /> },
                { label: "Comprobantes", icon: <FileTextIcon size={14} /> },
              ]}
            />
            <span className="inline-flex items-center gap-1 px-2 text-[12.5px] font-medium text-ink-muted">Análisis en Finanzas</span>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Dark label="Recibido este mes" icon={<WalletIcon size={16} />} className="xl:col-span-5">
          <DarkBig w="7ch" className="text-[clamp(2.2rem,3.6vw,3rem)] leading-none font-semibold" />
          <DarkSplit labels={["Abonos", "Saldos", "Pagos"]} />
        </Dark>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3 xl:col-span-7">
          <Tile icon={<FileTextIcon size={15} />} label="Comprobantes por revisar" w="2ch" />
          <Tile icon={<ClockIcon size={15} />} label="Abonos pendientes" w="6ch" />
          <Tile icon={<WalletIcon size={15} />} label="Saldos por cobrar" w="6ch" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Search placeholder="Nombre, código, celular o documento" className="w-full sm:w-[300px]" />
          <PeriodSk />
          <div className="w-full sm:w-[210px]">{cabinCombo}</div>
        </div>
        <Box title="Pagos recibidos" subtitle={null} action={<Line w="30ch" className="text-[12.5px]" />}>
          <ol className="flex flex-col gap-4">
            {[3, 2].map((n, d) => (
              <li key={d} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 border-b border-line pb-1.5">
                  <Line w="18ch" className="text-[12.5px] font-semibold" />
                  <Line w="8ch" className="text-[12px]" />
                </div>
                <ul className="-mx-2 flex flex-col">
                  {Array.from({ length: n }, (_, i) => (
                    <ListRow key={i} lead={<span className={`h-8 w-1 flex-none rounded-full bg-ink/10 ${PULSE}`} />} w={["50%", "38%", "56%"][i]} />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <Pager className="border-t border-line pt-3" />
        </Box>
      </div>
    </>
  );
}

/* ───────────── Clientes ───────────── */

function ClientCardSk({ i }: { i: number }) {
  return (
    <li className="flex min-w-0 flex-col rounded-[22px] bg-paper ring-1 ring-line ring-inset">
      <div className="flex min-w-0 flex-col gap-3.5 p-5">
        <span className="flex items-start gap-3">
          <Dot size="size-11" />
          <span className="min-w-0 flex-1">
            <Line w={["60%", "48%", "66%"][i % 3]} className="text-[15px] font-semibold" />
            <Line w="70%" className="text-[12px]" />
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              <Pill w="72px" />
            </span>
          </span>
        </span>
        <dl className="grid grid-cols-3 gap-2 rounded-[14px] bg-panel px-3.5 py-2.5 ring-1 ring-line ring-inset">
          {["Estadías", "Noches", "Valor"].map((k) => (
            <div key={k} className="min-w-0">
              <dt className="text-[11px] text-ink-muted">{k}</dt>
              <dd>
                <Line w="3ch" className="text-[15px] font-semibold" />
              </dd>
            </div>
          ))}
        </dl>
        <span className="flex flex-col gap-0.5 text-[12.5px]">
          <Line w="14ch" />
          <Line w="24ch" />
        </span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line px-4 py-2">
        <Line w="72px" className="text-[13px]" />
        <span className="flex gap-1">{icons(3)}</span>
      </div>
    </li>
  );
}

export function ClientsSkeleton() {
  return (
    <>
      <ModHead
        eyebrow="Cada cliente se identifica por su documento; su historial y la valoración del equipo están en su ficha"
        title={MODULES.clientes.label}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Dark label="Clientes" icon={<UsersIcon size={16} />} className="xl:col-span-4">
          <DarkBig w="2.5ch" />
          <div className="flex flex-col gap-2">
            <Block dark className="h-2.5 rounded-full" />
            <Line w="24ch" tone="dark" className="text-[12px]" />
          </div>
          <div className="mt-auto">
            <DarkSplit labels={["Nuevos (30 días)", "Volvieron", "Con alertas"]} bar={false} valueClass="mt-1 text-[18px] font-semibold" />
          </div>
        </Dark>
        <Box title="Los que más han generado" subtitle={null} className="xl:col-span-4">
          <ol className="-mx-2 flex flex-col">
            {[0, 1, 2, 3, 4].map((i) => (
              <ListRow
                key={i}
                lead={
                  <>
                    <span className="w-4 text-center text-[12px] font-semibold text-ink-subtle tabular-nums">{i + 1}</span>
                    <Dot size="size-8" />
                  </>
                }
                w={["58%", "44%", "62%", "50%", "40%"][i]}
              />
            ))}
          </ol>
        </Box>
        <Box title="De dónde vienen" subtitle="Ciudades más frecuentes" className="xl:col-span-4">
          <ul className="flex flex-col gap-3">
            {[100, 72, 54, 40, 28].map((w, i) => (
              <li key={i} className="flex flex-col gap-1.5">
                <span className="flex items-baseline justify-between gap-3 text-[12.5px]">
                  <Line w="12ch" />
                  <Line w="9ch" />
                </span>
                <span className="block h-2 rounded-full bg-panel">
                  <span className={`block h-full rounded-full bg-ink/10 ${PULSE}`} style={{ width: `${w}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </Box>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full 2xl:w-[380px]">
          <Search placeholder="Nombre, correo, celular, documento o ciudad" />
        </div>
        <Seg options={["Todos", "Nuevos", "Recurrentes", "Frecuentes", "Con alertas"]} />
        <div className="w-full sm:ml-auto sm:w-[220px]">
          <Combo w="16ch" />
        </div>
      </div>
      <ul className={CARD_GRID}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ClientCardSk key={i} i={i} />
        ))}
      </ul>
      <Pager />
    </>
  );
}

/* ───────────── Booking ───────────── */

// Una cabaña conectada a Booking (booking-calendars.tsx, CalendarRow).
export function BookingRowSkeleton() {
  return (
    <li aria-hidden="true" className="flex flex-col gap-2.5 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <Line w="10ch" className="text-[14.5px] font-bold" />
          <Line w="16ch" className="text-[12.5px]" />
        </div>
        <div className="flex items-center gap-2">
          <Pill w="80px" />
          <Block className="h-9 w-[124px] rounded-full" />
        </div>
      </div>
      <dl className="grid gap-x-4 gap-y-1 text-[12.5px] sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold text-ink">Booking → panel</dt>
        <dd>
          <Line w="36ch" />
        </dd>
        <dt className="font-semibold text-ink">Panel → Booking</dt>
        <dd className="flex min-w-0 items-center gap-1.5">
          <Line w="26ch" />
          <Dot size="size-7" />
        </dd>
      </dl>
    </li>
  );
}

export function BookingSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <ModHead eyebrow="Conexión con Booking.com por calendario (iCal), una por cabaña y en los dos sentidos" title={MODULES.booking.label} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Dark label="Estadías de Booking por llegar" icon={<BookingIcon size={16} />} className="xl:col-span-5">
          <DarkBig w="2ch" />
          <Line w="26ch" tone="dark" className="text-[12.5px]" />
        </Dark>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3 xl:col-span-7">
          <Tile icon={<CalendarIcon size={15} />} label="Booking este mes" w="6ch" />
          <Tile icon={<UserIcon size={15} />} label="Sin datos del huésped" w="2ch" />
          <Tile icon={<CloseIcon size={15} />} label="Canceladas en Booking" w="2ch" />
        </div>
      </div>
      <CardSk title="Calendarios de Booking.com" subtitle={null} icon={<RefreshIcon size={16} />} accent="bg-blue">
        <ol className="ml-5 list-decimal text-[13px] leading-relaxed text-ink-muted">
          <li>
            <strong className="text-ink">Booking → panel:</strong> en Booking, <em>Sincronizar calendarios → Exportar</em>, copia el enlace de cada cabaña y
            pégalo aquí. Sus noches ocupan esa cabaña en el panel.
          </li>
          <li>
            <strong className="text-ink">Panel → Booking:</strong> copia el enlace del panel de cada cabaña y pégalo en Booking, en <em>Importar calendario</em>
            . Booking cierra las noches ocupadas aquí.
          </li>
        </ol>
        <ul className="divide-y divide-line">
          {[0, 1, 2].map((i) => (
            <BookingRowSkeleton key={i} />
          ))}
        </ul>
      </CardSk>
    </div>
  );
}

/* ───────────── Calendario ───────────── */

// La cuadrícula del mes (calendar/month-grid.tsx), la vista con la que abre en el computador: el día, una franja por
// cabaña y las libres abajo.
export function CalendarGridSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col overflow-hidden rounded-[22px] bg-panel">
      <div className="grid grid-cols-7 border-b border-line bg-canvas/70">
        {[1, 2, 3, 4, 5, 6, 0].map((wd) => (
          <div key={wd} className="@container py-2 text-center">
            <DayName wd={wd} className="text-[11px] font-semibold tracking-[.04em] text-ink-muted uppercase" />
          </div>
        ))}
      </div>
      <div className="grid auto-rows-[minmax(88px,auto)] grid-cols-7">
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} className={`flex min-w-0 flex-col gap-1.5 border-line p-1.5 sm:p-2 ${i % 7 ? "border-l" : ""} ${i >= 7 ? "border-t" : ""}`}>
            <span className="grid h-6 min-w-6 place-items-start">
              <Line w="2ch" className="text-[12.5px] leading-6 font-bold" />
            </span>
            <span className="flex flex-col gap-[3px]">
              {[0, 1, 2].map((k) => (
                <span key={k} className={`h-[5px] w-full rounded-full bg-ink/7 ${PULSE}`} />
              ))}
            </span>
            <Line w="6ch" className="mt-auto text-[11px] font-bold" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[13px] font-medium text-ink-muted">{MODULES.calendario.label}</h1>
          <Line w="12ch" className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold" />
        </div>
        <Btn variant="primary" icon={<PlusIcon size={15} />}>
          Nueva reserva
        </Btn>
      </header>
      <div className="flex flex-wrap items-center gap-2 rounded-[28px] bg-paper p-1.5 ring-1 ring-line ring-inset sm:rounded-full">
        <div className="min-w-0 flex-1 sm:w-[184px] sm:flex-none">
          <Combo icon={<CalendarIcon size={14} className="text-ink-muted" />} w="11ch" />
        </div>
        <Seg options={CALENDAR_VIEWS.map((v) => v.label)} active={CALENDAR_VIEWS.findIndex((v) => v.value === "mes")} counts={false} />
        <div className="min-w-0 flex-1 sm:ml-auto sm:w-[200px] sm:flex-none">{cabinCombo}</div>
      </div>
      <ul className="grid min-w-0 grid-cols-2 overflow-hidden rounded-[22px] bg-panel ring-1 ring-line ring-inset sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Ocupación", icon: null },
          { label: "Llegadas", icon: <LoginIcon size={14} /> },
          { label: "Salidas", icon: <LogoutIcon size={14} /> },
          { label: "Sin abono", icon: <WalletIcon size={14} /> },
          { label: "Noches libres", icon: <MoonIcon size={14} /> },
          { label: "Bloqueadas", icon: <BanIcon size={14} /> },
        ].map((s) => (
          <li key={s.label} className="flex min-w-0 flex-col justify-center gap-1.5 border-line px-4 py-3 not-last:border-r">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink-muted">
              {s.icon}
              {s.label}
            </span>
            <Line w="3ch" className="text-[20px] leading-none font-semibold" />
            {s.icon === null && <Block className="h-1.5 rounded-full" />}
          </li>
        ))}
      </ul>
      <CalendarGridSkeleton />
    </div>
  );
}

/* ───────────── Notificaciones ───────────── */

export function NotificationDaysSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      {[3, 2].map((n, d) => (
        <section key={d} className="overflow-hidden rounded-[20px] bg-panel ring-1 ring-line ring-inset">
          <div className="border-b border-line bg-canvas/70 px-4 py-2">
            <Line w="16ch" className="text-[12.5px] font-bold" />
          </div>
          <ul className="divide-y divide-line">
            {Array.from({ length: n }, (_, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                <Dot className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <Line w={["48%", "36%", "54%"][i]} className="text-[14px] font-bold" />
                  <Line w="70%" className="text-[13px]" />
                  <Line w="12ch" className="mt-0.5 text-[12px]" />
                </div>
                <span className="flex flex-none gap-1">
                  <Block className="h-9 w-[92px] rounded-full" />
                  <IconBtn size="sm" />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <>
      <PageHead
        title="Notificaciones"
        description="Historial de avisos del panel: reservas nuevas, comprobantes de pago, cancelaciones y vencimientos."
        actions={
          <>
            <Btn icon={<CheckIcon size={14} />}>Marcar todas como leídas</Btn>
            <Btn variant="ghost" icon={<SlidersIcon size={15} />}>
              Sonido y avisos
            </Btn>
          </>
        }
      />
      <CardSk
        title="Requiere atención"
        subtitle="Calculado con los datos actuales; desaparece cuando se resuelve."
        icon={<AlertIcon size={18} />}
        className="flex flex-col gap-2 p-4 sm:p-5"
      >
        <ul className="-mx-2 flex flex-col">
          {[0, 1].map((i) => (
            <ListRow key={i} lead={<Dot size="size-8" />} w={["40%", "52%"][i]} end={false} />
          ))}
        </ul>
      </CardSk>
      <div className="flex flex-wrap items-center gap-2">
        <Seg options={[{ label: "Todas", count: false }, "Sin leer"]} />
        <Seg options={[{ label: "Todos los tipos", count: false }, ...NOTIFICATION_GROUPS.map((g) => g.label)]} />
      </div>
      <NotificationDaysSkeleton />
    </>
  );
}

/* ───────────── Importar ───────────── */

export function ImportSkeleton() {
  return (
    <>
      <PageHead title={MODULES.importar.label} description={MODULES.importar.description} />
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section className="rounded-[20px] bg-panel p-4 ring-1 ring-line ring-inset sm:p-5">
          <div className="flex flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-line-strong px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-green text-ink">
              <SpreadsheetIcon size={24} />
            </span>
            <p className="text-[16px] font-bold text-ink">Arrastra el archivo aquí</p>
            <p className="max-w-[46ch] text-[13.5px] text-ink-muted">Excel (.xls o .xlsx) o CSV, hasta 10 MB. El archivo se lee en este navegador.</p>
            <Btn variant="primary" icon={<UploadIcon size={15} />}>
              Elegir archivo
            </Btn>
          </div>
        </section>
        <CardSk
          title="Formato del archivo"
          subtitle="El reporte «Reservas» con estas columnas:"
          icon={<ListIcon size={18} />}
          className="flex flex-col gap-3 p-4 sm:p-5"
        >
          <span className="flex flex-wrap gap-1.5">
            {[64, 80, 72, 96, 60, 88, 70, 76].map((w, i) => (
              <Pill key={i} w={`${w}px`} />
            ))}
          </span>
          <span className="flex flex-col gap-1.5">
            {["92%", "80%", "86%"].map((w, i) => (
              <Line key={i} w={w} className="text-[13px]" />
            ))}
          </span>
        </CardSk>
      </div>
    </>
  );
}
