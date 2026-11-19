"use client";

// Finanzas como tablero (el mismo lenguaje del Inicio): filtros arriba; la cifra principal en una tarjeta oscura junto a
// cuatro indicadores con su variación; el ingreso en el tiempo junto a lo que falta por cobrar; el cobro de las llegadas,
// las cabañas y el tipo de huésped; y al final los últimos pagos y la comparación con el periodo anterior. Los movimientos
// uno a uno se gestionan en Pagos.
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ArrowRightIcon, CalendarIcon, ClockIcon, HomeIcon, MoonIcon, ReceiptIcon, TrendIcon, UsersIcon, WalletIcon } from "@/components/ui/icons";
import { delta, finance, pendingOf, previousRange, recordsByCode } from "@/lib/admin-metrics";
import { cop, fmtDate, plural } from "@/lib/format";
import { Combobox } from "@/components/ui/combobox";
import { useAdmin, useParam } from "@/components/admin/context";
import { useTip } from "@/components/ui/floating";
import { Count, useTweened } from "@/components/admin/motion";
import { PeriodFilter, usePeriod } from "@/components/admin/period";
import { MODULES, paths } from "@/components/admin/routes";
import { Delta, MoreLink, Panel, money } from "@/components/admin/board";
import { EmptyState, buttonClass, enter } from "@/components/admin/ui";

type Fin = ReturnType<typeof finance>;

// Las dos partes del dinero: abonos y saldos (colores validados para daltonismo, siempre con leyenda y valores).
const SERIES = [
  { key: "deposit", label: "Abonos", color: "var(--color-chart-a)" },
  { key: "balance", label: "Saldos", color: "var(--color-chart-b)" },
] as const;

// Cuándo empiezan a moverse las cifras: cuando cada tarjeta ya entró (globals.css, «Entrada del panel»).
const DELAY = 380;
const pctOf = (n: number) => `${n} %`;

export function FinanceView() {
  const { data } = useAdmin();
  const period = usePeriod("30");
  const [cabinId, setCabinId] = useParam("cabana", "");
  const range = period.range;
  const prev = previousRange(range);
  const records = useMemo(() => recordsByCode(data.payments), [data.payments]);
  const now = useMemo(() => finance(data.reservations, data.blocks, data.cabinTypes, range, cabinId, records), [data, range.from, range.to, cabinId, records]); // eslint-disable-line react-hooks/exhaustive-deps
  const before = useMemo(() => finance(data.reservations, data.blocks, data.cabinTypes, prev, cabinId, records), [data, prev.from, prev.to, cabinId, records]); // eslint-disable-line react-hooks/exhaustive-deps
  // Los enlaces a Pagos conservan el periodo y la cabaña elegida aquí.
  const same = {
    periodo: period.preset === "30" ? null : period.preset,
    desde: period.preset === "personalizado" ? range.from : null,
    hasta: period.preset === "personalizado" ? range.to : null,
    cabana: cabinId || null,
  };
  const against = `los ${period.daysLabel} anteriores`;
  const perNight = (f: Fin) => (f.occupied ? Math.round(f.received / f.occupied) : 0);

  return (
    <>
      <header {...enter(0)} className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-muted">{`${period.label} · comparado con ${against}`}</p>
          <h1 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-[-0.025em] text-ink">{MODULES.finanzas.label}</h1>
        </div>
        <div role="search" aria-label="Filtrar finanzas" className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <PeriodFilter period={period} />
          <div className="w-full sm:w-[210px]">
            <Combobox
              value={cabinId}
              onChange={setCabinId}
              options={[{ value: "", label: "Todas las cabañas" }, ...data.cabinTypes.map((c) => ({ value: c.id, label: c.nombre }))]}
              icon={<HomeIcon size={14} className="text-ink-muted" />}
            />
          </div>
          <Link href={paths.pagos({ vista: "recibidos", ...same })} className={buttonClass("primary")}>
            <ReceiptIcon size={15} />
            Pagos del periodo
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div {...enter(1)} className="min-w-0 xl:col-span-5">
          <Hero now={now} before={before} against={against} />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-7">
          <Kpi
            order={1.5}
            icon={<CalendarIcon size={16} />}
            label="Reservas confirmadas"
            value={<Count value={now.confirmedCount} delay={DELAY} />}
            hint="pagaron su abono en estas fechas"
            change={delta(now.confirmedCount, before.confirmedCount)}
            against={against}
          />
          <Kpi
            order={2}
            icon={<HomeIcon size={16} />}
            label="Ocupación"
            value={<Count value={Math.round(now.occupancy * 100)} format={pctOf} delay={DELAY} />}
            hint={`${now.occupied} de ${plural(now.available, "noche disponible", "noches disponibles")}`}
            change={before.available && now.available ? (now.occupancy - before.occupancy) * 100 : null}
            unit="pp"
            against={against}
            meter={Math.round(now.occupancy * 100)}
          />
          <Kpi
            order={2.5}
            icon={<UsersIcon size={16} />}
            label="Valor promedio por reserva"
            value={now.ticket ? <Count value={now.ticket} format={cop} delay={DELAY} /> : "—"}
            hint="de las reservas confirmadas"
            change={now.ticket && before.ticket ? delta(now.ticket, before.ticket) : null}
            against={against}
          />
          <Kpi
            order={3}
            icon={<MoonIcon size={16} />}
            label="Ingreso por noche ocupada"
            value={perNight(now) ? <Count value={perNight(now)} format={cop} delay={DELAY} /> : "—"}
            hint={`${cop(now.available ? Math.round(now.received / now.available) : 0)} por noche disponible`}
            change={perNight(now) && perNight(before) ? delta(perNight(now), perNight(before)) : null}
            against={against}
          />
        </div>

        <div {...enter(3.5)} className="min-w-0 xl:col-span-8">
          <RevenueChart buckets={now.buckets} deposits={now.depositsTotal} balances={now.balancesTotal} />
        </div>
        <div {...enter(4)} className="min-w-0 xl:col-span-4">
          <Receivables cabinId={cabinId} />
        </div>

        <div {...enter(4.5)} className="min-w-0 xl:col-span-4">
          <StaysMeter stays={now.stays} />
        </div>
        <div {...enter(5)} className="min-w-0 xl:col-span-4">
          <Ranking id="fi-cabin" title="¿Qué cabaña genera más?" subtitle="Dinero recibido en el periodo" rows={now.byCabin} total={now.received} />
        </div>
        <div {...enter(5.5)} className="min-w-0 xl:col-span-4">
          <Ranking
            id="fi-type"
            title="¿Quién reserva?"
            subtitle="Pareja, familia (con niños), grupo (3 o más adultos) o individual"
            rows={now.byType}
            total={now.received}
          />
        </div>

        <div {...enter(6)} className="min-w-0 xl:col-span-7">
          <LatestPayments payments={now.payments} href={paths.pagos({ vista: "recibidos", ...same })} />
        </div>
        <div {...enter(6.5)} className="min-w-0 xl:col-span-5">
          <Compare now={now} before={before} perNight={perNight} />
        </div>
      </div>
    </>
  );
}

/* ───────────── Cifra principal ───────────── */

// Tarjeta oscura: lo recibido en el periodo, su variación, cómo se divide entre abonos y saldos y cuántos pagos fueron.
function Hero({ now, before, against }: { now: Fin; before: Fin; against: string }) {
  const tip = useTip();
  const total = now.depositsTotal + now.balancesTotal;
  const parts = [
    { ...SERIES[0], value: now.depositsTotal },
    { ...SERIES[1], value: now.balancesTotal },
  ];
  return (
    <section aria-labelledby="fi-hero" className="flex h-full min-w-0 flex-col gap-5 rounded-[22px] bg-ink p-6 text-paper">
      <div className="flex items-start justify-between gap-3">
        <h2 id="fi-hero" className="text-[13px] font-medium text-paper/70">
          Ingresos recibidos
        </h2>
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-paper/10">
          <TrendIcon size={16} />
        </span>
      </div>
      <div>
        <p className="text-[clamp(2.3rem,4vw,3.2rem)] leading-none font-semibold tracking-[-0.04em]">
          <Count value={now.received} format={cop} delay={DELAY} />
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Delta value={delta(now.received, before.received)} against={against} onDark />
          <span className="text-[12px] text-paper/60">{`antes: ${cop(before.received)}`}</span>
        </div>
      </div>
      {/* Abonos y saldos: barra dividida (2 px de aire entre partes) con su leyenda y los valores. */}
      <div className="mt-auto flex flex-col gap-3">
        {total > 0 && (
          <div role="img" aria-label={parts.map((p) => `${p.label}: ${cop(p.value)}`).join(", ")} className="flex h-2.5 gap-[2px]">
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
        )}
        <dl className="grid grid-cols-3 gap-3">
          {[...parts.map((p) => ({ k: p.label, v: money(p.value), dot: p.color })), { k: "Pagos", v: String(now.payments.length), dot: "" }].map((x) => (
            <div key={x.k} className="min-w-0 border-l border-paper/15 pl-3">
              <dt className="flex items-center gap-1.5 text-[12px] text-paper/60">
                {x.dot && <span aria-hidden="true" className="size-2 rounded-full" style={{ background: x.dot }} />}
                {x.k}
              </dt>
              <dd className="mt-1 text-[17px] font-semibold tracking-[-0.02em]">{x.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// Indicador en tarjeta blanca: icono, rótulo, cifra, variación y una nota; la ocupación lleva además su barra.
function Kpi({
  order,
  icon,
  label,
  value,
  hint,
  change,
  unit,
  against,
  meter,
}: {
  order: number;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint: string;
  change: number | null;
  unit?: "%" | "pp";
  against: string;
  meter?: number;
}) {
  const [fill] = useTweened([meter ?? 0], { delay: DELAY, duration: 900 });
  return (
    <section {...enter(order)} aria-label={label} className="flex min-w-0 flex-col gap-3 rounded-[22px] bg-paper p-5 ring-1 ring-line ring-inset">
      <span className="flex min-w-0 items-center gap-2 text-[12.5px] font-medium text-ink-muted">
        <span aria-hidden="true" className="grid size-7 flex-none place-items-center rounded-full bg-panel text-ink ring-1 ring-line">
          {icon}
        </span>
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <p className="text-[24px] leading-none font-semibold tracking-[-0.03em] text-ink">{value}</p>
        {change !== null && <Delta value={change} unit={unit} against={against} />}
      </div>
      {meter !== undefined && (
        <span
          aria-hidden="true"
          className="block h-1.5 overflow-hidden rounded-full"
          style={{ background: "color-mix(in srgb, var(--color-chart-a) 18%, transparent)" }}
        >
          <span className="block h-full rounded-full" style={{ width: `${fill}%`, background: "var(--color-chart-a)" }} />
        </span>
      )}
      <p className="mt-auto truncate text-[12px] text-ink-subtle">{hint}</p>
    </section>
  );
}

/* ───────────── Ingresos en el tiempo (columnas apiladas: abonos + saldos) ───────────── */

// La columna entera recibe el ratón, pero el tooltip apunta a la barra (justo encima de ella, no al tope del gráfico).
const BAR_TIP = { anchor: (el: HTMLElement) => el.querySelector<HTMLElement>("[data-bar]") };

function RevenueChart({ buckets, deposits, balances }: { buckets: Fin["buckets"]; deposits: number; balances: number }) {
  const tip = useTip();
  const max = Math.max(1, ...buckets.map((b) => b.deposit + b.balance));
  const top = buckets.reduce((m, b, i) => (b.deposit + b.balance > buckets[m].deposit + buckets[m].balance ? i : m), 0);
  const every = Math.ceil(buckets.length / 10); // etiquetas del eje x sin amontonarse (en el teléfono, la mitad)
  const empty = buckets.every((b) => !b.deposit && !b.balance);
  const heights = useTweened(
    buckets.map((b) => ((b.deposit + b.balance) / max) * 100),
    { delay: DELAY + 150, duration: 900, stagger: Math.max(8, 300 / buckets.length) },
  );
  const by =
    buckets[0]?.from === buckets[0]?.to
      ? "Dinero recibido cada día"
      : buckets[0]?.label.startsWith("Sem.")
        ? "Dinero recibido cada semana"
        : "Dinero recibido cada mes";

  return (
    <Panel
      id="fi-trend"
      title="¿Cuándo entró el dinero?"
      subtitle={by}
      action={
        <ul className="flex flex-wrap justify-end gap-x-4 gap-y-1">
          {[
            { ...SERIES[0], value: deposits },
            { ...SERIES[1], value: balances },
          ].map((s) => (
            <li key={s.key} className="flex items-center gap-1.5 text-[12.5px] text-ink-muted">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: s.color }} />
              {s.label}
              <span className="font-semibold text-ink">{money(s.value)}</span>
            </li>
          ))}
        </ul>
      }
    >
      {empty ? (
        <EmptyState
          compact
          icon={<TrendIcon size={18} />}
          title="Sin ingresos en este periodo"
          text="Cuando se registren abonos o saldos, verás aquí su evolución."
        />
      ) : (
        <div className="flex flex-1 flex-col pl-12">
          <div className="relative min-h-[260px] flex-1">
            {/* Líneas guía finas y sólidas, con su valor a la izquierda. */}
            {[1, 0.5, 0].map((f) => (
              <div
                key={f}
                aria-hidden="true"
                className={`absolute inset-x-0 border-t ${f === 0 ? "border-line-strong" : "border-line"}`}
                style={{ top: `${(1 - f) * 100}%` }}
              >
                <span className="absolute top-0 right-full -translate-y-1/2 pr-2 text-[11px] whitespace-nowrap text-ink-subtle tabular-nums">
                  {money(max * f)}
                </span>
              </div>
            ))}
            <ol className="relative flex h-full items-end gap-[2px]">
              {buckets.map((b, i) => {
                const total = b.deposit + b.balance;
                return (
                  <li
                    key={b.key}
                    role="img"
                    aria-label={`${b.label}: ${cop(total)} (abonos ${cop(b.deposit)}, saldos ${cop(b.balance)})`}
                    {...tip(
                      () => (
                        <span className="flex flex-col gap-0.5">
                          <strong>{b.from === b.to ? fmtDate(b.from, true) : `${fmtDate(b.from)} → ${fmtDate(b.to)}`}</strong>
                          <span>Total {cop(total)}</span>
                          {SERIES.map((s) => (
                            <span key={s.key} className="flex items-center gap-1.5">
                              <span className="size-2.5 rounded-full ring-[1.5px] ring-current" style={{ background: s.color }} />
                              {s.label} {cop(b[s.key])}
                            </span>
                          ))}
                        </span>
                      ),
                      BAR_TIP,
                    )}
                    className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                  >
                    {/* Pila: abono abajo y saldo encima, separados por 2 px; esquinas redondeadas solo arriba. */}
                    <span
                      aria-hidden="true"
                      data-bar
                      className="flex w-full max-w-[24px] flex-col-reverse gap-[2px] overflow-hidden rounded-t-[4px] transition-[filter] group-hover:brightness-110"
                      style={{ height: `${heights[i]}%` }}
                    >
                      {b.deposit > 0 && <span className="w-full" style={{ flex: b.deposit, background: SERIES[0].color }} />}
                      {b.balance > 0 && <span className="w-full" style={{ flex: b.balance, background: SERIES[1].color }} />}
                    </span>
                    {i === top && total > 0 && (
                      <span className="absolute -top-5 text-[11.5px] font-semibold whitespace-nowrap text-ink tabular-nums">{money(total)}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
          {/* Solo se rotula una de cada `every` columnas: la etiqueta se centra en su barra y ocupa el espacio de las vecinas. */}
          <ol aria-hidden="true" className="mt-2 flex h-4 gap-[2px] text-[11px] text-ink-muted">
            {buckets.map((b, i) => (
              <li key={b.key} className="relative min-w-0 flex-1">
                {i % every === 0 && (
                  <span className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap ${i % (every * 2) ? "max-sm:hidden" : ""}`}>
                    {b.label.replace(/^Sem\. /, "")}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </Panel>
  );
}

/* ───────────── Por cobrar hoy ───────────── */

// Lo que falta por cobrar de todas las reservas activas (no depende del periodo), con atajos a Pagos.
function Receivables({ cabinId }: { cabinId: string }) {
  const { data } = useAdmin();
  const due = data.reservations.filter((r) => (!cabinId || r.cabinTypeId === cabinId) && pendingOf(r).total > 0);
  const awaiting = due.filter((r) => pendingOf(r).deposit > 0);
  const balances = due.filter((r) => pendingOf(r).balance > 0);
  const dep = awaiting.reduce((s, r) => s + pendingOf(r).deposit, 0);
  const bal = balances.reduce((s, r) => s + pendingOf(r).balance, 0);
  const rows = [
    {
      tipo: "abonos" as const,
      icon: <ClockIcon size={15} />,
      label: "Abonos por recibir",
      hint: plural(awaiting.length, "reserva sin abono", "reservas sin abono"),
      amount: dep,
      color: SERIES[0].color,
    },
    {
      tipo: "saldos" as const,
      icon: <WalletIcon size={15} />,
      label: "Saldos por cobrar",
      hint: plural(balances.length, "reserva confirmada", "reservas confirmadas"),
      amount: bal,
      color: SERIES[1].color,
    },
  ];
  return (
    <Panel
      id="fi-due"
      title="Por cobrar hoy"
      subtitle="De todas las reservas activas; no cambia con el periodo"
      action={<MoreLink href={paths.pagos({ vista: "por-cobrar", cabana: cabinId || null })}>Pagos</MoreLink>}
    >
      <p className="text-[30px] leading-none font-semibold tracking-[-0.03em] text-ink">
        <Count value={dep + bal} format={cop} delay={DELAY} />
      </p>
      <ul className="-mx-2 flex flex-col">
        {rows.map((x) => (
          <li key={x.tipo}>
            <Link
              href={paths.pagos({ vista: "por-cobrar", tipo: x.tipo, cabana: cabinId || null })}
              className="flex items-center gap-3 rounded-[14px] px-2 py-2.5 transition-colors hover:bg-panel"
            >
              <span aria-hidden="true" className="grid size-9 flex-none place-items-center rounded-full bg-panel text-ink ring-1 ring-line">
                {x.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                  <span aria-hidden="true" className="size-2 rounded-full" style={{ background: x.color }} />
                  {x.label}
                </span>
                <span className="block truncate text-[11.5px] text-ink-muted">{x.hint}</span>
              </span>
              <span className="flex-none text-[14px] font-semibold text-ink tabular-nums">{money(x.amount)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {dep + bal > 0 && (
        <div role="img" aria-label={`Abonos ${cop(dep)}, saldos ${cop(bal)}`} className="mt-auto flex h-2 gap-[2px]">
          {rows
            .filter((x) => x.amount > 0)
            .map((x) => (
              <span key={x.tipo} className="h-full rounded-full" style={{ width: `${(x.amount / (dep + bal)) * 100}%`, background: x.color }} />
            ))}
        </div>
      )}
    </Panel>
  );
}

/* ───────────── Cobro de las estadías del periodo ───────────── */

// Anillo con el porcentaje ya cobrado de las estadías que llegan en el periodo.
function StaysMeter({ stays }: { stays: Fin["stays"] }) {
  const pct = stays.value ? Math.round((stays.received / stays.value) * 100) : 0;
  const [shown] = useTweened([pct], { delay: DELAY + 200, duration: 1000 });
  const C = 2 * Math.PI * 42;
  return (
    <Panel
      id="fi-stays"
      title="¿Ya pagaron quienes llegan?"
      subtitle={stays.count ? `${plural(stays.count, "reserva llega", "reservas llegan")} en estas fechas` : "Reservas que llegan en estas fechas"}
    >
      {stays.count ? (
        <div className="flex flex-1 items-center gap-5">
          <div className="relative size-[112px] flex-none">
            <svg viewBox="0 0 100 100" aria-hidden="true" className="size-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="9" style={{ stroke: "color-mix(in srgb, var(--color-chart-a) 16%, transparent)" }} />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - shown / 100)}
                style={{ stroke: "var(--color-chart-a)" }}
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-[22px] font-semibold tracking-[-0.03em] text-ink">{`${Math.round(shown)} %`}</span>
          </div>
          <dl className="flex min-w-0 flex-1 flex-col gap-3 text-[12.5px]">
            {[
              { k: "Valor de las estadías", v: cop(stays.value) },
              { k: "Ya cobrado", v: cop(stays.received) },
              { k: "Falta por cobrar", v: cop(stays.pending) },
            ].map((x) => (
              <div key={x.k} className="min-w-0">
                <dt className="text-ink-muted">{x.k}</dt>
                <dd className="truncate text-[14px] font-semibold text-ink tabular-nums">{x.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <p className="rounded-[14px] border border-dashed border-line-strong px-4 py-3 text-[13px] text-ink-muted">No hay llegadas en este periodo.</p>
      )}
    </Panel>
  );
}

/* ───────────── Listas con barra (ranking) ───────────── */

function Ranking({
  id,
  title,
  subtitle,
  rows,
  total,
}: {
  id: string;
  title: string;
  subtitle: string;
  rows: { id: string; label: string; value: number }[];
  total: number;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  // Lo que no generó dinero no ocupa una fila: se resume al final.
  const earning = rows.filter((r) => r.value > 0);
  const none = rows.filter((r) => r.value <= 0);
  const widths = useTweened(
    earning.map((r) => (r.value / max) * 100),
    { delay: DELAY + 250, duration: 900, stagger: 60 },
  );
  return (
    <Panel id={id} title={title} subtitle={subtitle}>
      {total ? (
        <ol className="flex flex-col gap-3.5">
          {earning.map((r, i) => (
            <li key={r.id} className="flex flex-col gap-1.5">
              <span className="flex items-baseline justify-between gap-3 text-[12.5px]">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`text-[11px] font-semibold tabular-nums ${i === 0 ? "text-ink" : "text-ink-subtle"}`}>{`${i + 1}.`}</span>
                  <span className="truncate font-medium text-ink">{r.label}</span>
                </span>
                <span className="flex-none text-ink-muted tabular-nums">
                  <strong className="font-semibold text-ink">{money(r.value)}</strong> · {Math.round((r.value / total) * 100)} %
                </span>
              </span>
              <span aria-hidden="true" className="block h-2 rounded-full bg-panel">
                <span className="block h-full rounded-full" style={{ width: `${widths[i]}%`, background: "var(--color-chart-a)" }} />
              </span>
            </li>
          ))}
          {none.length > 0 && <li className="text-[12px] text-ink-muted">{`Sin ingresos: ${none.map((r) => r.label).join(", ")}.`}</li>}
        </ol>
      ) : (
        <p className="rounded-[14px] border border-dashed border-line-strong px-4 py-3 text-[13px] text-ink-muted">Sin ingresos en este periodo.</p>
      )}
    </Panel>
  );
}

/* ───────────── Últimos pagos ───────────── */

function LatestPayments({ payments, href }: { payments: Fin["payments"]; href: string }) {
  const { cabinLabel } = useAdmin();
  return (
    <Panel id="fi-latest" title="Últimos pagos del periodo" action={<MoreLink href={href}>Ver todos</MoreLink>}>
      {payments.length ? (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-y border-line text-[11.5px] text-ink-muted">
                <th scope="col" className="py-2 pl-5 font-medium">
                  Fecha
                </th>
                <th scope="col" className="py-2 font-medium">
                  Huésped
                </th>
                <th scope="col" className="py-2 font-medium">
                  Tipo
                </th>
                <th scope="col" className="py-2 pr-5 text-right font-medium">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 8).map((p, i) => {
                const s = SERIES[p.kind === "deposit" ? 0 : 1];
                return (
                  <tr key={`${p.r.code}:${p.date}:${i}`} className="border-b border-line last:border-b-0 hover:bg-panel/70">
                    <td className="py-2.5 pl-5 whitespace-nowrap text-ink-muted tabular-nums">{fmtDate(p.date)}</td>
                    <td className="max-w-[240px] py-2.5 pr-3">
                      <Link href={paths.reserva(p.r.code)} className="block truncate font-medium text-ink hover:underline">
                        {p.r.guest.fullName}
                      </Link>
                      <span className="block truncate text-[11.5px] text-ink-muted">{cabinLabel(p.r.cabinTypeId, p.r.unit)}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="inline-flex items-center gap-1.5 text-ink">
                        <span aria-hidden="true" className="size-2 rounded-full" style={{ background: s.color }} />
                        {p.kind === "deposit" ? "Abono" : "Saldo"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-5 text-right font-semibold text-ink tabular-nums">{cop(p.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-[13px] text-ink-muted">No hay pagos en este periodo.</p>
      )}
    </Panel>
  );
}

/* ───────────── Comparación ───────────── */

// Cada indicador ahora y en el periodo anterior, con su variación.
function Compare({ now, before, perNight }: { now: Fin; before: Fin; perNight: (f: Fin) => number }) {
  const rows: { k: string; a: string; b: string; d: number | null; unit?: "%" | "pp" }[] = [
    { k: "Ingresos", a: money(now.received), b: money(before.received), d: delta(now.received, before.received) },
    { k: "Abonos", a: money(now.depositsTotal), b: money(before.depositsTotal), d: delta(now.depositsTotal, before.depositsTotal) },
    { k: "Saldos", a: money(now.balancesTotal), b: money(before.balancesTotal), d: delta(now.balancesTotal, before.balancesTotal) },
    { k: "Confirmadas", a: String(now.confirmedCount), b: String(before.confirmedCount), d: delta(now.confirmedCount, before.confirmedCount) },
    {
      k: "Ocupación",
      a: `${Math.round(now.occupancy * 100)} %`,
      b: `${Math.round(before.occupancy * 100)} %`,
      d: before.available && now.available ? (now.occupancy - before.occupancy) * 100 : null,
      unit: "pp",
    },
    { k: "Noches ocupadas", a: String(now.occupied), b: String(before.occupied), d: delta(now.occupied, before.occupied) },
    { k: "Por noche ocupada", a: money(perNight(now)), b: money(perNight(before)), d: perNight(before) ? delta(perNight(now), perNight(before)) : null },
  ];
  return (
    <Panel id="fi-compare" title="Contra el periodo anterior">
      <table className="w-full border-collapse text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-line text-[11.5px] text-ink-muted">
            <th scope="col" className="py-2 font-medium">
              <span className="sr-only">Indicador</span>
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Ahora
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Antes
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              <span className="sr-only">Variación</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.k} className="border-b border-line last:border-b-0">
              <th scope="row" className="py-2.5 pr-2 font-medium whitespace-nowrap text-ink">
                {x.k}
              </th>
              <td className="py-2.5 text-right font-semibold whitespace-nowrap text-ink tabular-nums">{x.a}</td>
              <td className="py-2.5 pl-3 text-right whitespace-nowrap text-ink-muted tabular-nums">{x.b}</td>
              <td className="py-2.5 pl-3 text-right">{x.d === null ? <span className="text-ink-subtle">—</span> : <Delta value={x.d} unit={x.unit} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link href={paths.pagos()} className={`${buttonClass("secondary", "md", "mt-auto w-full")}`}>
        Ir a Pagos
        <ArrowRightIcon size={14} />
      </Link>
    </Panel>
  );
}
