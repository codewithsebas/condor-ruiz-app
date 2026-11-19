"use client";

// Inicio del panel, como un tablero de control: el pulso del día en una franja; el dinero generado (mes, año, ticket,
// ingreso por noche y los últimos 12 meses); lo que falta por cobrar; la ocupación de las próximas dos semanas; de dónde
// llegan las reservas y qué cabaña genera más; el movimiento de hoy en una tabla; las próximas llegadas y los huéspedes.
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRightIcon,
  BathIcon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  HomeIcon,
  LoginIcon,
  LogoutIcon,
  MoonIcon,
  PlusIcon,
  RefreshIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { balanceDue, buildClients, delta, paymentState, paymentsOf, pendingOf, recordsByCode, valueOf } from "@/lib/admin-metrics";
import { BLOCKING_STATUSES, busyBlocks, isFromBooking } from "@/lib/booking";
import { MONTHS, MS, addDays, cop, countdown, fmtDate, fmtFullDate, nightsBetween, parseISO, plural, waTo } from "@/lib/format";
import type { Reservation } from "@/lib/types";
import { useAdmin } from "@/components/admin/context";
import { Delta, Figure, MoreLink, Panel, money } from "@/components/admin/board";
import { displayName } from "@/components/admin/account";
import { Count, useTweened } from "@/components/admin/motion";
import { useLabelTip, useTip } from "@/components/ui/floating";
import { NewReservationDialog } from "@/components/admin/new-reservation";
import { paths } from "@/components/admin/routes";
import { ARRIVING, DEPARTING } from "@/components/admin/shared";
import { Badge, Button, EmptyState, IconButton, ModalPresence, Segmented, buttonClass, enter, iconButtonClass } from "@/components/admin/ui";

type Data = ReturnType<typeof useAdmin>["data"];

/* ───────────── Cálculos ───────────── */

function occupancy(d: Data, date: string) {
  let busy = 0;
  let total = 0;
  for (const c of d.cabinTypes) {
    if (!c.activa && !d.reservations.some((r) => r.cabinTypeId === c.id)) continue;
    total += c.units;
    const set = new Set<number>();
    d.reservations.forEach((r) => r.cabinTypeId === c.id && BLOCKING_STATUSES.includes(r.status) && r.checkIn <= date && date < r.checkOut && set.add(r.unit));
    busyBlocks(d).forEach((b) => b.cabinTypeId === c.id && b.from <= date && date <= b.to && set.add(b.unit));
    busy += set.size;
  }
  return { busy, total, pc: total ? Math.round((busy / total) * 100) : 0 };
}

// Reservas concretadas (el abono se pagó).
const SECURED = ["confirmed", "rescheduled", "checked_in", "completed"];

// Primer día del mes `n` meses antes o después del de `day` ("2026-11-18", -1 → "2026-10-01").
const monthStart = (day: string, n = 0) => {
  const d = parseISO(day);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1)).toISOString().slice(0, 10);
};
const monthEnd = (first: string) => addDays(monthStart(first, 1), -1);

const greeting = (now: number) => {
  const h = Number(new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", hour: "numeric", hourCycle: "h23" }).format(now));
  return h >= 5 && h < 12 ? "Buenos días" : h >= 12 && h < 19 ? "Buenas tardes" : "Buenas noches";
};

// Cómo saludar a quien entra: su primer nombre; si la cuenta lleva el nombre de un negocio («El Cóndor…»), completo.
const ARTICLES = new Set(["el", "la", "los", "las", "un", "una"]);
const callName = (name: string) => {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return ARTICLES.has(first.toLowerCase()) ? name.trim() : first;
};

// "16:05" en la hora de Colombia.
const hhmm = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));

// Cuándo empiezan a moverse las cifras: cuando cada tarjeta ya entró (globals.css, «Entrada del panel»).
const DELAY = 420;

/* ───────────── Página ───────────── */

export function Dashboard() {
  const { data, today, now, reload } = useAdmin();
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const calTip = useLabelTip("Abrir el calendario");
  const R = data.reservations;
  const arr = R.filter((r) => r.checkIn === today && ARRIVING.includes(r.status));
  const dep = R.filter((r) => r.checkOut === today && DEPARTING.includes(r.status));

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <>
      <header {...enter(0)} className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-muted first-letter:uppercase">{fmtFullDate(today)}</p>
          <h1 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-[-0.025em] text-ink">
            {`${greeting(now)}, ${callName(displayName(data.me))}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <IconButton label="Actualizar los datos" variant="secondary" data-gesture="refresh" onClick={refresh} disabled={refreshing}>
            <RefreshIcon size={17} className={refreshing ? "animate-spin-fast" : ""} />
          </IconButton>
          <Link href={paths.calendario()} aria-label="Abrir el calendario" data-gesture="calendar" {...calTip} className={iconButtonClass("secondary")}>
            <CalendarIcon size={17} />
          </Link>
          <Button variant="primary" data-tour="new-reservation" icon={<PlusIcon size={14} />} onClick={() => setCreating(true)}>
            Nueva reserva
          </Button>
        </div>
      </header>

      <Pulse arr={arr} dep={dep} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div {...enter(2)} className="min-w-0 xl:col-span-8">
          <Revenue />
        </div>
        <div {...enter(2.6)} className="min-w-0 xl:col-span-4">
          <ToCollect />
        </div>
        <div {...enter(3.2)} className="min-w-0 xl:col-span-8">
          <Occupancy />
        </div>
        <div {...enter(3.8)} className="flex min-w-0 flex-col gap-4 xl:col-span-4">
          <Sources />
        </div>
        <div {...enter(4.4)} className="min-w-0 xl:col-span-8">
          <TodayTable arr={arr} dep={dep} />
        </div>
        <div {...enter(5)} className="flex min-w-0 flex-col gap-4 xl:col-span-4">
          <Upcoming />
          <Guests />
        </div>
      </div>

      <ModalPresence>{creating && <NewReservationDialog draft={{}} onClose={() => setCreating(false)} />}</ModalPresence>
    </>
  );
}

/* ───────────── Pulso del día ───────────── */

// Una franja con lo esencial de hoy, separada por divisores: quién llega, quién sale, quién está, la ocupación de esta
// noche y lo que falta por cobrar.
function Pulse({ arr, dep }: { arr: Reservation[]; dep: Reservation[] }) {
  const { data, today } = useAdmin();
  const tonight = occupancy(data, today);
  const inHouse = data.reservations.filter((r) => r.status === "checked_in");
  const guests = inHouse.reduce((n, r) => n + r.adults + r.children, 0);
  const toCollect = data.reservations.reduce((s, r) => s + pendingOf(r).total, 0);
  const [fill] = useTweened([tonight.pc], { delay: DELAY, duration: 900 });
  const cells: { label: string; value: ReactNode; hint: string; icon: ReactNode }[] = [
    {
      label: "Llegan hoy",
      value: <Count value={arr.length} delay={DELAY} />,
      hint: arr.length ? "por recibir" : "sin llegadas",
      icon: <LoginIcon size={16} />,
    },
    {
      label: "Salen hoy",
      value: <Count value={dep.length} delay={DELAY} />,
      hint: dep.length ? "por entregar" : "sin salidas",
      icon: <LogoutIcon size={16} />,
    },
    { label: "En estadía", value: <Count value={inHouse.length} delay={DELAY} />, hint: plural(guests, "huésped", "huéspedes"), icon: <HomeIcon size={16} /> },
    { label: "Por cobrar", value: <Count value={toCollect} format={money} delay={DELAY} />, hint: "abonos y saldos", icon: <WalletIcon size={16} /> },
  ];
  return (
    <section
      {...enter(1)}
      data-tour="pulse"
      aria-label="Resumen de hoy"
      className="grid grid-cols-2 overflow-hidden rounded-[22px] bg-panel ring-1 ring-line ring-inset sm:grid-cols-3 lg:grid-cols-5"
    >
      {cells.map((c) => (
        <div key={c.label} className="flex items-center gap-3 border-line px-5 py-4 not-last:border-r max-lg:nth-[2n]:border-r-0 max-sm:border-b">
          <span aria-hidden="true" className="grid size-9 flex-none place-items-center rounded-full bg-paper text-ink ring-1 ring-line">
            {c.icon}
          </span>
          <Figure label={c.label} value={c.value} hint={c.hint} />
        </div>
      ))}
      <div className="col-span-2 flex flex-col justify-center gap-2 px-5 py-4 sm:col-span-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[12px] font-medium text-ink-muted">Ocupación hoy</p>
          <p className="flex-none text-[19px] leading-tight font-semibold tracking-[-0.02em] whitespace-nowrap text-ink">
            <Count value={tonight.pc} format={(n) => `${n} %`} delay={DELAY} />
          </p>
        </div>
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={tonight.pc}
          aria-label="Ocupación esta noche"
          className="h-2 overflow-hidden rounded-full"
          style={{ background: "color-mix(in srgb, var(--color-chart-a) 18%, transparent)" }}
        >
          <span className="block h-full rounded-full" style={{ width: `${fill}%`, background: "var(--color-chart-a)" }} />
        </div>
        <p className="text-[11.5px] text-ink-subtle">{`${tonight.busy} de ${plural(tonight.total, "cabaña ocupada", "cabañas ocupadas")}`}</p>
      </div>
    </section>
  );
}

/* ───────────── Dinero generado ───────────── */

// Tarjeta oscura con la cifra principal del tablero: lo cobrado este mes, su variación contra el mismo tramo del mes
// anterior, el año, el ticket, el ingreso por noche, las noches vendidas y los últimos 12 meses en columnas.
function Revenue() {
  const { data, today } = useAdmin();
  const tip = useTip();
  const m = useMemo(() => {
    const records = recordsByCode(data.payments);
    const pays = data.reservations.flatMap((r) => paymentsOf(r, records.get(r.code)));
    const sum = (from: string, to: string) => pays.reduce((s, p) => (p.date >= from && p.date <= to ? s + p.amount : s), 0);
    const first = monthStart(today);
    const prevFirst = monthStart(today, -1);
    const day = parseISO(today).getUTCDate();
    const prevTo = addDays(prevFirst, day - 1) > monthEnd(prevFirst) ? monthEnd(prevFirst) : addDays(prevFirst, day - 1);
    const mtd = sum(first, today);
    const prevMtd = sum(prevFirst, prevTo);
    const ytd = sum(`${today.slice(0, 4)}-01-01`, today);
    const months = Array.from({ length: 12 }, (_, i) => {
      const f = monthStart(today, i - 11);
      const d = parseISO(f);
      return { key: f, label: MS[d.getUTCMonth()], full: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`, value: sum(f, monthEnd(f)) };
    });
    // Estadías que llegan este mes ya concretadas: valor, noches y reservas.
    const stays = data.reservations.filter((r) => SECURED.includes(r.status) && r.checkIn >= first && r.checkIn <= monthEnd(first));
    const nights = stays.reduce((n, r) => n + nightsBetween(r.checkIn, r.checkOut), 0);
    const value = stays.reduce((s, r) => s + valueOf(r), 0);
    return {
      mtd,
      change: delta(mtd, prevMtd),
      ytd,
      months,
      nights,
      ticket: stays.length ? Math.round(value / stays.length) : 0,
      adr: nights ? Math.round(value / nights) : 0,
      monthLabel: MONTHS[parseISO(first).getUTCMonth()],
    };
  }, [data, today]);
  const max = Math.max(1, ...m.months.map((x) => x.value));
  const heights = useTweened(
    m.months.map((x) => (x.value / max) * 100),
    { delay: DELAY + 120, duration: 900, stagger: 35 },
  );

  return (
    <section aria-labelledby="d-rev" className="flex h-full min-w-0 flex-col gap-6 rounded-[22px] bg-ink p-6 text-paper">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="d-rev" className="text-[13px] font-medium text-paper/70 first-letter:uppercase">
            {`Dinero generado en ${m.monthLabel}`}
          </h2>
          <p className="mt-2 text-[clamp(2.4rem,4.4vw,3.4rem)] leading-none font-semibold tracking-[-0.04em]">
            <Count value={m.mtd} format={cop} delay={DELAY} />
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Delta value={m.change} against="el mismo tramo del mes anterior" onDark />
            {m.change !== null && <span className="text-[12px] text-paper/60">vs. el mismo tramo del mes anterior</span>}
          </div>
        </div>
        <Link
          href={paths.finanzas()}
          className="inline-flex items-center gap-1 rounded-full bg-paper/10 px-3 py-1.5 text-[12.5px] font-medium text-paper transition-colors hover:bg-paper/20"
        >
          Finanzas
          <ArrowRightIcon size={13} />
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {[
          { k: `En ${today.slice(0, 4)}`, v: <Count value={m.ytd} format={money} delay={DELAY} /> },
          { k: "Ticket promedio", v: <Count value={m.ticket} format={money} delay={DELAY} /> },
          { k: "Ingreso por noche", v: <Count value={m.adr} format={money} delay={DELAY} /> },
          { k: "Noches vendidas", v: <Count value={m.nights} delay={DELAY} /> },
        ].map((x) => (
          <div key={x.k} className="min-w-0 border-l border-paper/15 pl-3">
            <dt className="truncate text-[12px] text-paper/60">{x.k}</dt>
            <dd className="mt-1 text-[18px] leading-tight font-semibold tracking-[-0.02em]">{x.v}</dd>
          </div>
        ))}
      </dl>

      {/* Últimos 12 meses: una sola serie; el mes en curso resaltado y los anteriores atenuados. */}
      <figure className="mt-auto" aria-label="Dinero cobrado en los últimos 12 meses">
        <ol className="flex h-[132px] items-end gap-1.5 border-b border-paper/15">
          {m.months.map((x, i) => {
            const current = i === m.months.length - 1;
            return (
              <li
                key={x.key}
                aria-label={`${x.full}: ${cop(x.value)}`}
                {...tip(
                  () => (
                    <span>
                      <strong className="first-letter:uppercase">{x.full}</strong> · {cop(x.value)}
                    </span>
                  ),
                  { anchor: (el) => el.firstElementChild as HTMLElement | null },
                )}
                className="flex h-full flex-1 items-end justify-center"
              >
                <span
                  aria-hidden="true"
                  className={`block w-full max-w-[24px] rounded-t-[4px] transition-colors ${current ? "bg-paper" : "bg-paper/25 hover:bg-paper/45"}`}
                  style={{ height: `${Math.max(x.value ? 3 : 1, heights[i])}%` }}
                />
              </li>
            );
          })}
        </ol>
        <div aria-hidden="true" className="mt-2 flex gap-1.5">
          {m.months.map((x, i) => (
            <span key={x.key} className={`flex-1 text-center text-[11px] ${i === m.months.length - 1 ? "font-semibold text-paper" : "text-paper/50"}`}>
              {x.label}
            </span>
          ))}
        </div>
      </figure>
    </section>
  );
}

/* ───────────── Por cobrar ───────────── */

function ToCollect() {
  const { data, now } = useAdmin();
  const tip = useTip();
  const R = data.reservations;
  const deadlineOf = (r: Reservation) => (r.status === "pending_deposit" ? r.depositDueAt : "");
  const pend = R.filter((r) => r.status === "pending_deposit" || balanceDue(r)).sort((a, b) => (deadlineOf(a) < deadlineOf(b) ? -1 : 1));
  const deposits = R.reduce((s, r) => s + pendingOf(r).deposit, 0);
  const balances = R.reduce((s, r) => s + pendingOf(r).balance, 0);
  const total = deposits + balances;
  const proofs = data.proofs.filter((p) => p.status === "pending");
  const parts = [
    { key: "deposit", label: "Abonos", value: deposits, color: "var(--color-chart-a)" },
    { key: "balance", label: "Saldos", value: balances, color: "var(--color-chart-b)" },
  ];

  return (
    <Panel id="d-collect" title="Por cobrar" action={<MoreLink href={paths.pagos({ vista: "por-cobrar" })}>Pagos</MoreLink>}>
      <p className="text-[30px] leading-none font-semibold tracking-[-0.03em] text-ink">
        <Count value={total} format={cop} delay={DELAY} />
      </p>
      {/* Barra dividida en abonos y saldos (2 px de aire entre partes), con su leyenda y los valores. */}
      {total > 0 && (
        <div className="flex flex-col gap-2.5">
          <div role="img" aria-label={parts.map((p) => `${p.label}: ${cop(p.value)}`).join(", ")} className="flex h-2 gap-[2px]">
            {parts
              .filter((p) => p.value > 0)
              .map((p) => (
                <span
                  key={p.key}
                  {...tip(() => (
                    <span>
                      <strong>{p.label}</strong> · {cop(p.value)} · {Math.round((p.value / total) * 100)} %
                    </span>
                  ))}
                  className="h-full rounded-full"
                  style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
                />
              ))}
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {parts.map((p) => (
              <li key={p.key} className="flex items-center gap-1.5 text-[12.5px] text-ink-muted">
                <span aria-hidden="true" className="size-2 rounded-full" style={{ background: p.color }} />
                {p.label}
                <span className="font-semibold text-ink">{money(p.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {proofs.length > 0 && (
        <Link
          href={paths.pagos()}
          className="flex items-center gap-2 rounded-[14px] bg-info-soft px-3 py-2 text-[12.5px] font-medium text-info transition-opacity hover:opacity-85"
        >
          <FileTextIcon size={15} />
          {plural(proofs.length, "comprobante por revisar", "comprobantes por revisar")}
          <ArrowRightIcon size={13} className="ml-auto" />
        </Link>
      )}
      {pend.length ? (
        <ul className="-mx-2 flex flex-col">
          {pend.slice(0, 4).map((r) => {
            const bd = balanceDue(r);
            const deadline = deadlineOf(r);
            const urgent = deadline && (Date.parse(deadline) - now) / 6e4 < 60;
            return (
              <li key={r.code}>
                <Link href={paths.reserva(r.code)} className="flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors hover:bg-panel">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{r.guest.fullName}</span>
                    <span className="block truncate text-[11.5px] text-ink-muted">{bd ? `Saldo · en estadía` : `Abono · llega ${fmtDate(r.checkIn)}`}</span>
                  </span>
                  <span className="flex flex-none flex-col items-end gap-0.5">
                    <span className="text-[13px] font-semibold text-ink tabular-nums">{money(bd ? bd.amount : r.quote.deposit)}</span>
                    {deadline && (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium tabular-nums ${urgent ? "text-error" : "text-ink-subtle"}`}>
                        <ClockIcon size={11} />
                        <span className="sr-only">La retención vence en </span>
                        {countdown(deadline)}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-auto text-[13px] text-ink-muted">No hay abonos ni saldos pendientes.</p>
      )}
    </Panel>
  );
}

/* ───────────── Ocupación ───────────── */

// Las próximas dos semanas en columnas: el alto es la ocupación de cada noche y debajo, las llegadas del día.
function Occupancy() {
  const { data, today } = useAdmin();
  const tip = useTip();
  const days = Array.from({ length: 14 }, (_, i) => {
    const day = addDays(today, i);
    return {
      day,
      ...occupancy(data, day),
      arrivals: data.reservations.filter((r) => r.checkIn === day && ARRIVING.concat(["checked_in"]).includes(r.status)).length,
    };
  });
  const week = days.slice(0, 7);
  const avg7 = Math.round(week.reduce((s, d) => s + d.pc, 0) / week.length);
  const free7 = week.reduce((n, d) => n + Math.max(0, d.total - d.busy), 0);
  const peak = days.reduce((a, b) => (b.pc > a.pc ? b : a), days[0]);
  const heights = useTweened(
    days.map((d) => d.pc),
    { delay: DELAY + 200, duration: 900, stagger: 30 },
  );

  return (
    <Panel id="d-occ" title="Ocupación de las próximas dos semanas" action={<MoreLink href={paths.calendario()}>Calendario</MoreLink>}>
      <div className="grid grid-cols-3 gap-4 sm:max-w-[460px]">
        <Figure label="Promedio 7 días" value={<Count value={avg7} format={(n) => `${n} %`} delay={DELAY} />} />
        <Figure label="Noches libres (7 días)" value={<Count value={free7} delay={DELAY} />} />
        <Figure label="Noche más llena" value={`${peak.pc} %`} hint={peak.day === today ? "hoy" : fmtDate(peak.day)} />
      </div>
      <figure aria-label="Ocupación por noche en los próximos 14 días" className="mt-auto">
        <div className="relative">
          {/* Líneas guía al 50 y 100 %. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[150px]">
            {[0, 50].map((t) => (
              <span key={t} className="absolute inset-x-0 border-t border-line" style={{ top: `${t}%` }}>
                <span className="absolute -top-2 right-0 bg-paper pl-1 text-[10.5px] text-ink-subtle tabular-nums">{`${100 - t} %`}</span>
              </span>
            ))}
          </div>
          <ol className="relative flex h-[150px] items-end gap-1.5 border-b border-line-strong pr-9">
            {days.map((d, i) => (
              <li
                key={d.day}
                aria-label={`${fmtDate(d.day)}: ${d.pc} %, ${plural(d.arrivals, "llegada", "llegadas")}`}
                {...tip(
                  () => (
                    <span>
                      <strong>{i === 0 ? "Hoy" : fmtDate(d.day)}</strong> · {d.pc} % · {d.busy} de {d.total} cabañas ·{" "}
                      {plural(d.arrivals, "llegada", "llegadas")}
                    </span>
                  ),
                  { anchor: (el) => el.firstElementChild as HTMLElement | null },
                )}
                className="flex h-full flex-1 items-end justify-center"
              >
                <span
                  aria-hidden="true"
                  className="block w-full max-w-[24px] rounded-t-[4px] transition-opacity hover:opacity-80"
                  style={{
                    height: `${Math.max(d.pc ? 3 : 1.5, heights[i])}%`,
                    background: i === 0 ? "var(--color-chart-a)" : "color-mix(in srgb, var(--color-chart-a) 45%, var(--color-paper))",
                  }}
                />
              </li>
            ))}
          </ol>
        </div>
        <div aria-hidden="true" className="mt-2 flex gap-1.5 pr-9">
          {days.map((d, i) => {
            const date = parseISO(d.day);
            return (
              <span key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <span className={`text-[11px] tabular-nums ${i === 0 ? "font-semibold text-ink" : "text-ink-muted"}`}>
                  {i === 0 ? "Hoy" : date.getUTCDate()}
                </span>
                <span
                  className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums ${d.arrivals ? "bg-ink text-paper" : "text-transparent"}`}
                >
                  {d.arrivals || 0}
                </span>
              </span>
            );
          })}
        </div>
        <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-subtle">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--color-chart-a)" }} />
            Ocupación por noche (hoy en el tono fuerte)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-ink" />
            Número de llegadas del día
          </span>
        </figcaption>
      </figure>
    </Panel>
  );
}

/* ───────────── Canales y cabañas ───────────── */

// De dónde llegan las estadías de este mes (directas o Booking) y cuánto cobró cada cabaña.
function Sources() {
  const { data, today } = useAdmin();
  const tip = useTip();
  const first = monthStart(today);
  const last = monthEnd(first);
  const stays = data.reservations.filter((r) => r.checkIn >= first && r.checkIn <= last && (SECURED.includes(r.status) || r.status === "pending_deposit"));
  const booking = stays.filter(isFromBooking).length;
  const channels = [
    { key: "direct", label: "Directas", value: stays.length - booking, color: "var(--color-chart-a)" },
    { key: "booking", label: "Booking", value: booking, color: "var(--color-chart-b)" },
  ];
  const records = recordsByCode(data.payments);
  const byCabin = data.cabinTypes
    .map((c) => ({
      id: c.id,
      label: c.nombre,
      value: data.reservations
        .filter((r) => r.cabinTypeId === c.id)
        .flatMap((r) => paymentsOf(r, records.get(r.code)))
        .reduce((s, p) => (p.date >= first && p.date <= today ? s + p.amount : s), 0),
    }))
    .sort((a, b) => b.value - a.value);
  const top = Math.max(1, ...byCabin.map((c) => c.value));
  const widths = useTweened(
    byCabin.map((c) => (c.value / top) * 100),
    { delay: DELAY + 260, duration: 900, stagger: 60 },
  );

  return (
    <>
      <Panel id="d-src" title="Reservas del mes por canal">
        <p className="text-[13px] text-ink-muted">
          <span className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{stays.length}</span>{" "}
          {stays.length === 1 ? "estadía llega" : "estadías llegan"} este mes
        </p>
        {stays.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <div role="img" aria-label={channels.map((c) => `${c.label}: ${c.value}`).join(", ")} className="flex h-7 gap-[2px]">
              {channels
                .filter((c) => c.value > 0)
                .map((c) => {
                  const share = Math.round((c.value / stays.length) * 100);
                  return (
                    <span
                      key={c.key}
                      {...tip(() => (
                        <span>
                          <strong>{c.label}</strong> · {c.value} · {share} %
                        </span>
                      ))}
                      className="flex h-full items-center rounded-[4px] px-2 text-[11.5px] font-semibold text-white"
                      style={{ width: `${share}%`, background: c.color }}
                    >
                      {share >= 18 ? `${share} %` : ""}
                    </span>
                  );
                })}
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {channels.map((c) => (
                <li key={c.key} className="flex items-center gap-1.5 text-[12.5px] text-ink-muted">
                  <span aria-hidden="true" className="size-2 rounded-full" style={{ background: c.color }} />
                  {c.label}
                  <span className="font-semibold text-ink">{c.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      <Panel id="d-cab" title="Cobrado por cabaña este mes" className="flex-1">
        {byCabin.some((c) => c.value) ? (
          <ul className="flex flex-col gap-3">
            {byCabin.map((c, i) => (
              <li key={c.id} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
                  <span className="truncate font-medium text-ink">{c.label}</span>
                  <span className="flex-none font-semibold text-ink tabular-nums">{money(c.value)}</span>
                </div>
                <span aria-hidden="true" className="block h-2 rounded-full bg-panel">
                  <span className="block h-full rounded-full" style={{ width: `${widths[i]}%`, background: "var(--color-chart-a)" }} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-ink-muted">Aún no hay pagos este mes.</p>
        )}
      </Panel>
    </>
  );
}

/* ───────────── Movimiento de hoy ───────────── */

type Move = { r: Reservation; kind: "llegada" | "salida" | "estadia" | "plazo"; time: string };
type MoveFilter = "todo" | Move["kind"];
const MOVE_META: Record<Move["kind"], { label: string; icon: ReactNode; dot: string }> = {
  llegada: { label: "Llegada", icon: <LoginIcon size={14} />, dot: "bg-pink" },
  salida: { label: "Salida", icon: <LogoutIcon size={14} />, dot: "bg-blue" },
  estadia: { label: "En estadía", icon: <HomeIcon size={14} />, dot: "bg-green" },
  plazo: { label: "Vence abono", icon: <ClockIcon size={14} />, dot: "bg-yellow" },
};

// Todo lo que pasa hoy en una tabla ordenada por hora: llegadas, salidas, estadías en curso y abonos que vencen hoy.
function TodayTable({ arr, dep }: { arr: Reservation[]; dep: Reservation[] }) {
  const { data, today, now, cabinLabel } = useAdmin();
  const s = data.site.settings;
  const [filter, setFilter] = useState<MoveFilter>("todo");
  const staying = data.reservations.filter((r) => r.status === "checked_in" && r.checkIn < today && r.checkOut > today);
  const endOfDay = Date.parse(`${today}T23:59:59-05:00`);
  const due = data.reservations.filter((r) => r.status === "pending_deposit" && Date.parse(r.depositDueAt) <= endOfDay && Date.parse(r.depositDueAt) > now);
  const moves: Move[] = [
    ...arr.map((r) => ({ r, kind: "llegada" as const, time: r.estimatedArrival || s.checkInStart })),
    ...dep.map((r) => ({ r, kind: "salida" as const, time: s.checkOutTime })),
    ...due.map((r) => ({ r, kind: "plazo" as const, time: hhmm(r.depositDueAt) })),
    ...staying.map((r) => ({ r, kind: "estadia" as const, time: "" })),
  ].sort((a, b) => ((a.time || "99") < (b.time || "99") ? -1 : 1));
  const list = moves.filter((m) => filter === "todo" || m.kind === filter);
  const count = (k: Move["kind"]) => moves.filter((m) => m.kind === k).length;

  return (
    <Panel
      id="d-today"
      title={`Hoy, ${fmtDate(today)}`}
      action={
        <Segmented
          label="Mostrar"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "todo", label: "Todo", count: moves.length },
            { value: "llegada", label: "Llegadas", count: count("llegada") },
            { value: "salida", label: "Salidas", count: count("salida") },
            { value: "estadia", label: "En estadía", count: count("estadia") },
          ]}
        />
      }
    >
      {list.length ? (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-y border-line text-[11.5px] font-medium text-ink-muted">
                <th scope="col" className="w-[72px] py-2 pl-5 font-medium">
                  Hora
                </th>
                <th scope="col" className="py-2 font-medium">
                  Huésped
                </th>
                <th scope="col" className="py-2 font-medium">
                  Movimiento
                </th>
                <th scope="col" className="py-2 font-medium">
                  Pago
                </th>
                <th scope="col" className="py-2 pr-5 text-right font-medium">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => {
                const meta = MOVE_META[m.kind];
                const pay = paymentState(m.r);
                return (
                  <tr key={`${m.kind}:${m.r.code}`} className="border-b border-line last:border-b-0 hover:bg-panel/70">
                    <td className="py-3 pl-5 font-semibold text-ink tabular-nums">{m.time || "—"}</td>
                    <td className="max-w-[220px] py-3 pr-3">
                      <Link href={paths.reserva(m.r.code)} className="block truncate font-medium text-ink hover:underline">
                        {m.r.guest.fullName}
                      </Link>
                      <span className="block truncate text-[11.5px] text-ink-muted">{cabinLabel(m.r.cabinTypeId, m.r.unit)}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="inline-flex items-center gap-1.5 text-ink">
                        <span aria-hidden="true" className={`grid size-6 place-items-center rounded-full text-ink ${meta.dot}`}>
                          {meta.icon}
                        </span>
                        {m.kind === "estadia" ? `Sale ${fmtDate(m.r.checkOut)}` : meta.label}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <Badge tone={pay.tone}>{m.kind === "plazo" ? `Abono ${money(m.r.quote.deposit)}` : pay.label}</Badge>
                    </td>
                    <td className="py-3 pr-5">
                      <span className="flex justify-end gap-1">
                        {m.r.guest.phone && (
                          <a
                            href={waTo(m.r.guest.phone)}
                            target="_blank"
                            rel="noopener"
                            aria-label={`WhatsApp a ${m.r.guest.fullName}`}
                            className={iconButtonClass("ghost", "sm")}
                          >
                            <WhatsAppIcon size={15} />
                          </a>
                        )}
                        <Link href={paths.reserva(m.r.code)} aria-label={`Ver la reserva ${m.r.code}`} className={iconButtonClass("ghost", "sm")}>
                          <ArrowRightIcon size={15} />
                        </Link>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          compact
          icon={<LoginIcon size={18} />}
          title={filter === "todo" ? "Hoy no hay llegadas, salidas ni huéspedes en estadía." : "Nada en este filtro hoy."}
        />
      )}
    </Panel>
  );
}

/* ───────────── Próximas llegadas ───────────── */

// Llegadas de los próximos 7 días agrupadas por día.
function Upcoming() {
  const { data, today, cabinLabel } = useAdmin();
  const list = data.reservations
    .filter((r) => r.checkIn > today && r.checkIn <= addDays(today, 7) && ARRIVING.includes(r.status))
    .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1));
  const days = [...new Set(list.map((r) => r.checkIn))];
  return (
    <Panel id="d-up" title="Próximas llegadas" action={<MoreLink href={paths.calendario()}>Ver todas</MoreLink>}>
      {days.length ? (
        <ol className="flex flex-col gap-3">
          {days.slice(0, 4).map((day) => {
            const date = parseISO(day);
            return (
              <li key={day} className="flex gap-3">
                <span className="flex w-11 flex-none flex-col items-center rounded-[12px] bg-panel py-1.5 ring-1 ring-line">
                  <span className="text-[10.5px] font-medium text-ink-muted uppercase">{MS[date.getUTCMonth()]}</span>
                  <span className="text-[16px] leading-tight font-semibold text-ink">{date.getUTCDate()}</span>
                </span>
                <ul className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
                  {list
                    .filter((r) => r.checkIn === day)
                    .map((r) => (
                      <li key={r.code}>
                        <Link href={paths.reserva(r.code)} className="group block min-w-0">
                          <span className="block truncate text-[13px] font-medium text-ink group-hover:underline">{r.guest.fullName}</span>
                          <span className="block truncate text-[11.5px] text-ink-muted">
                            {`${cabinLabel(r.cabinTypeId, r.unit)} · ${plural(nightsBetween(r.checkIn, r.checkOut), "noche", "noches")}${day === addDays(today, 1) ? " · mañana" : ""}`}
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-[13px] text-ink-muted">No hay llegadas en los próximos 7 días.</p>
      )}
    </Panel>
  );
}

/* ───────────── Huéspedes ───────────── */

function Guests() {
  const { data, today } = useAdmin();
  const clients = useMemo(() => buildClients(data.reservations, data.clients, today), [data.reservations, data.clients, today]);
  const fresh = clients.filter((c) => c.isNew).length;
  const recurring = clients.filter((c) => c.isRecurring).length;
  const nights30 = data.reservations
    .filter((r) => SECURED.includes(r.status) && r.checkOut > addDays(today, -30) && r.checkIn <= today)
    .reduce((n, r) => n + nightsBetween(r.checkIn, r.checkOut), 0);
  const bathAlerts = (data.bathrooms ?? []).filter(
    (b) => b.status !== "available" || (data.bathroomBlocks ?? []).some((k) => k.bathroomId === b.id && k.from <= today && today <= k.to),
  ).length;
  const rows: { icon: ReactNode; label: string; value: number; href: string }[] = [
    { icon: <UserPlusIcon size={15} />, label: "Clientes nuevos (30 días)", value: fresh, href: paths.clientes() },
    { icon: <UsersIcon size={15} />, label: "Clientes que repiten", value: recurring, href: paths.clientes() },
    { icon: <MoonIcon size={15} />, label: "Noches alojadas (30 días)", value: nights30, href: paths.finanzas() },
    { icon: <BathIcon size={15} />, label: "Baños con aviso", value: bathAlerts, href: paths.bloqueos() },
  ];
  return (
    <Panel id="d-guests" title="Huéspedes y operación">
      <ul className="-mx-2 flex flex-col">
        {rows.map((x) => (
          <li key={x.label}>
            <Link href={x.href} className="flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors hover:bg-panel">
              <span aria-hidden="true" className="grid size-8 flex-none place-items-center rounded-full bg-panel text-ink ring-1 ring-line">
                {x.icon}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{x.label}</span>
              <span className="text-[15px] font-semibold text-ink tabular-nums">
                <Count value={x.value} delay={DELAY} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href={paths.clientes()} className={buttonClass("secondary", "md", "mt-auto w-full")}>
        Ver clientes
      </Link>
    </Panel>
  );
}
