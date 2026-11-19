"use client";

// Módulo de Pagos (/admin/pagos), como tablero: la operación del dinero. Arriba lo recibido este mes y lo pendiente;
// luego tres vistas: los pagos recibidos como un libro por días, lo que falta por cobrar en tarjetas ordenadas por
// llegada, y los comprobantes por revisar. El análisis (tendencias, comparaciones, distribución) vive en Finanzas.
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, ClockIcon, DownloadIcon, FileTextIcon, HomeIcon, TrendIcon, WalletIcon } from "@/components/ui/icons";
import { balanceDue, finance, pendingOf, paymentsOf, recordsByCode, type Payment } from "@/lib/admin-metrics";
import { cop, download, fmtDate, nightsBetween, plural } from "@/lib/format";
import type { Reservation } from "@/lib/types";
import { StatusPill } from "@/components/ui/status-pill";
import { Combobox } from "@/components/ui/combobox";
import { useTip } from "@/components/ui/floating";
import { useAdmin, useParam } from "@/components/admin/context";
import { PeriodFilter, usePeriod } from "@/components/admin/period";
import { ProofCard } from "@/components/admin/proofs";
import { MODULES, paths } from "@/components/admin/routes";
import { csv, norm } from "@/components/admin/shared";
import { ListSearch } from "@/components/admin/list-table";
import { RowActions } from "@/components/admin/reservations";
import { Paginator, usePaged } from "@/components/admin/paginator";
import { Panel, money as short } from "@/components/admin/board";
import { can } from "@/lib/permissions";
import { Badge, Button, EmptyState, Segmented, enter } from "@/components/admin/ui";

type Tab = "recibidos" | "por-cobrar" | "comprobantes";
type ProofFilter = "por-revisar" | "aprobados" | "rechazados" | "todos";
type Due = "todo" | "abonos" | "saldos";
const PROOF_FILTER: Record<ProofFilter, string | null> = { "por-revisar": "pending", aprobados: "approved", rechazados: "rejected", todos: null };
// Abonos y saldos: los dos colores de las gráficas (validados para daltonismo), siempre con leyenda y valores.
const ABONO = "var(--color-chart-a)";
const SALDO = "var(--color-chart-b)";

export function PaymentsView() {
  const { data, today } = useAdmin();
  const money = can(data.me.role, "finance");
  const tabs: Tab[] = money ? ["recibidos", "por-cobrar", "comprobantes"] : ["por-cobrar", "comprobantes"];
  const [tabP, setTab] = useParam<Tab>("vista", tabs[0]);
  const tab: Tab = tabs.includes(tabP) ? tabP : tabs[0];
  const pendingProofs = data.proofs.filter((p) => p.status === "pending");
  const due = data.reservations.filter((r) => pendingOf(r).total > 0);
  const deposits = due.filter((r) => pendingOf(r).deposit > 0);
  const balances = due.filter((r) => pendingOf(r).balance > 0);
  const depTotal = deposits.reduce((s, r) => s + pendingOf(r).deposit, 0);
  const balTotal = balances.reduce((s, r) => s + pendingOf(r).balance, 0);
  const month = finance(data.reservations, data.blocks, data.cabinTypes, { from: today.slice(0, 8) + "01", to: today }, "", recordsByCode(data.payments));

  return (
    <>
      <header {...enter(0)} className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-muted">{MODULES.pagos.description}</p>
          <h1 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-[-0.025em] text-ink">{MODULES.pagos.label}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Pagos"
            value={tab}
            onChange={setTab}
            options={[
              ...(money ? [{ value: "recibidos" as Tab, label: "Recibidos", icon: <TrendIcon size={14} /> }] : []),
              { value: "por-cobrar" as Tab, label: "Por cobrar", icon: <ClockIcon size={14} />, count: due.length },
              { value: "comprobantes" as Tab, label: "Comprobantes", icon: <FileTextIcon size={14} />, count: pendingProofs.length },
            ]}
          />
          {money && (
            <Link
              href={paths.finanzas()}
              className="inline-flex items-center gap-1 px-2 text-[12.5px] font-medium text-ink-muted transition-colors hover:text-ink"
            >
              Análisis en Finanzas
              <ArrowRightIcon size={13} />
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section
          {...enter(1)}
          aria-label={money ? "Recibido este mes" : "Por cobrar"}
          className="flex flex-col gap-4 rounded-[22px] bg-ink p-6 text-paper xl:col-span-5"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[13px] font-medium text-paper/70">{money ? "Recibido este mes" : "Por cobrar hoy"}</h2>
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-paper/10">
              <WalletIcon size={16} />
            </span>
          </div>
          <p className="text-[clamp(2.2rem,3.6vw,3rem)] leading-none font-semibold tracking-[-0.04em]">{cop(money ? month.received : depTotal + balTotal)}</p>
          <Split
            parts={
              money
                ? [
                    { label: "Abonos", value: month.depositsTotal, color: ABONO },
                    { label: "Saldos", value: month.balancesTotal, color: SALDO },
                  ]
                : [
                    { label: "Abonos", value: depTotal, color: ABONO },
                    { label: "Saldos", value: balTotal, color: SALDO },
                  ]
            }
            extra={money ? { label: "Pagos", value: String(month.payments.length) } : { label: "Reservas", value: String(due.length) }}
          />
        </section>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3 xl:col-span-7">
          <Tile
            order={1.5}
            icon={<FileTextIcon size={15} />}
            label="Comprobantes por revisar"
            value={String(pendingProofs.length)}
            hint={pendingProofs.length ? "transferencias por confirmar" : "ninguno ahora"}
            tone={pendingProofs.length ? "bg-info-soft" : ""}
          />
          <Tile
            order={2}
            icon={<ClockIcon size={15} />}
            label="Abonos pendientes"
            value={short(depTotal)}
            hint={plural(deposits.length, "retención sin abono", "retenciones sin abono")}
          />
          <Tile
            order={2.5}
            icon={<WalletIcon size={15} />}
            label="Saldos por cobrar"
            value={short(balTotal)}
            hint={plural(balances.length, "estadía", "estadías")}
          />
        </div>
      </div>

      <div key={tab} className="flex flex-col gap-4 motion-safe:animate-fade-in">
        {tab === "comprobantes" ? <ProofsTab /> : tab === "recibidos" ? <ReceivedTab /> : <DueTab rows={due} />}
      </div>
    </>
  );
}

/* ───────────── Piezas ───────────── */

// Barra en dos partes (abonos y saldos) con su leyenda y los valores, sobre la tarjeta oscura.
function Split({ parts, extra }: { parts: { label: string; value: number; color: string }[]; extra: { label: string; value: string } }) {
  const tip = useTip();
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div className="mt-auto flex flex-col gap-3">
      {total > 0 && (
        <div role="img" aria-label={parts.map((p) => `${p.label}: ${cop(p.value)}`).join(", ")} className="flex h-2.5 gap-[2px]">
          {parts
            .filter((p) => p.value > 0)
            .map((p) => (
              <span
                key={p.label}
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
        {[...parts.map((p) => ({ k: p.label, v: short(p.value), dot: p.color })), { k: extra.label, v: extra.value, dot: "" }].map((x) => (
          <div key={x.k} className="min-w-0 border-l border-paper/15 pl-3">
            <dt className="flex items-center gap-1.5 text-[12px] text-paper/60">
              {x.dot && <span aria-hidden="true" className="size-2 rounded-full" style={{ background: x.dot }} />}
              {x.k}
            </dt>
            <dd className="mt-1 text-[17px] font-semibold">{x.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Tile({ order, icon, label, value, hint, tone = "" }: { order: number; icon: ReactNode; label: string; value: string; hint: string; tone?: string }) {
  return (
    <section
      {...enter(order)}
      aria-label={label}
      className={`flex min-w-0 flex-col gap-3 rounded-[22px] p-5 ring-1 ring-line ring-inset ${tone || "bg-paper"}`}
    >
      <span className="flex items-center gap-2 text-[12.5px] font-medium text-ink-muted">
        <span aria-hidden="true" className="grid size-7 flex-none place-items-center rounded-full bg-panel text-ink ring-1 ring-line">
          {icon}
        </span>
        {label}
      </span>
      <p className="text-[26px] leading-none font-semibold tracking-[-0.03em] text-ink">{value}</p>
      <p className="mt-auto text-[12px] text-ink-subtle">{hint}</p>
    </section>
  );
}

const cabinOptions = (cabins: { id: string; nombre: string }[]) => [
  { value: "", label: "Todas las cabañas" },
  ...cabins.map((c) => ({ value: c.id, label: c.nombre })),
];

/* ───────────── Comprobantes ───────────── */

function ProofsTab() {
  const { data } = useAdmin();
  const [filter, setFilter] = useParam<ProofFilter>("estado", "por-revisar");
  const current: ProofFilter = filter in PROOF_FILTER ? filter : "por-revisar";
  const status = PROOF_FILTER[current];
  const list = data.proofs.filter((p) => !status || p.status === status);
  const count = (s: string) => data.proofs.filter((p) => p.status === s).length;
  const byCode = new Map(data.reservations.map((r) => [r.code, r]));
  const paged = usePaged(list, "comprobantes", current);

  return (
    <>
      <Segmented
        label="Estado del comprobante"
        value={current}
        onChange={setFilter}
        options={[
          { value: "por-revisar", label: "Por revisar", count: count("pending") },
          { value: "aprobados", label: "Aprobados", count: count("approved") },
          { value: "rechazados", label: "Rechazados", count: count("rejected") },
          { value: "todos", label: "Todos", count: data.proofs.length },
        ]}
      />
      {list.length ? (
        <>
          <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {paged.rows.map((p) => (
              <ProofCard key={p.id} p={p} r={byCode.get(p.reservationCode)} showReservation />
            ))}
          </ul>
          <Paginator p={paged} noun="comprobantes" className="rounded-[18px] bg-paper px-4 py-3 ring-1 ring-line" />
        </>
      ) : (
        <Panel id="pg-proofs-empty" title="Comprobantes">
          <EmptyState
            icon={<FileTextIcon size={18} />}
            title={current === "por-revisar" ? "No hay comprobantes por revisar" : "No hay comprobantes en este filtro"}
            text={current === "por-revisar" ? "Cuando un huésped suba su comprobante te llegará una notificación y aparecerá aquí." : undefined}
          />
        </Panel>
      )}
    </>
  );
}

/* ───────────── Pagos recibidos ───────────── */

function ReceivedTab() {
  const { data, cabin } = useAdmin();
  const period = usePeriod("30");
  const [cabinId, setCabinId] = useParam("cabana", "");
  const [q, setQ] = useParam("q", "");
  const nq = norm(q.trim());
  const records = recordsByCode(data.payments);
  const rows = data.reservations
    .filter(
      (r) =>
        (!cabinId || r.cabinTypeId === cabinId) &&
        (!nq || [r.code, r.guest.fullName, r.guest.phone, r.guest.docNumber].some((v) => norm(v || "").includes(nq))),
    )
    .flatMap((r) => paymentsOf(r, records.get(r.code)))
    .filter((p) => p.date >= period.range.from && p.date <= period.range.to)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const total = rows.reduce((s, p) => s + p.amount, 0);

  const exportCsv = () =>
    download(
      `pagos-${period.range.from}-a-${period.range.to}.csv`,
      csv([
        ["Fecha", "Reserva", "Huésped", "Cabaña", "Concepto", "Valor"],
        ...rows.map((p) => [
          p.date,
          p.r.code,
          p.r.guest.fullName,
          cabin(p.r.cabinTypeId)?.nombre ?? p.r.cabinTypeId,
          p.kind === "deposit" ? "Abono" : "Saldo",
          p.amount,
        ]),
      ]),
      "text/csv;charset=utf-8",
    );

  return (
    <>
      <div role="search" aria-label="Filtrar pagos" className="flex flex-wrap items-center gap-2">
        <ListSearch
          id="pg-q"
          label="Buscar pagos"
          value={q}
          onChange={setQ}
          placeholder="Nombre, código, celular o documento"
          className="w-full sm:w-[300px]"
        />
        <PeriodFilter period={period} />
        <div className="w-full sm:w-[210px]">
          <Combobox value={cabinId} onChange={setCabinId} options={cabinOptions(data.cabinTypes)} icon={<HomeIcon size={14} className="text-ink-muted" />} />
        </div>
        {rows.length > 0 && (
          <Button icon={<DownloadIcon size={14} />} onClick={exportCsv} className="sm:ml-auto">
            Descargar CSV
          </Button>
        )}
      </div>
      {rows.length ? (
        <Ledger rows={rows} total={total} reset={`${period.range.from}|${period.range.to}|${cabinId}|${nq}`} />
      ) : (
        <Panel id="pg-rec-empty" title="Pagos recibidos">
          <EmptyState icon={<WalletIcon size={18} />} title="No hay pagos con esos filtros" text="Prueba con un periodo más largo u otra búsqueda." />
        </Panel>
      )}
    </>
  );
}

// Libro de pagos: agrupados por día (el día con su total), cada pago con su concepto, la reserva y el valor.
function Ledger({ rows, total, reset }: { rows: Payment[]; total: number; reset: string }) {
  const { cabinLabel } = useAdmin();
  const paged = usePaged(rows, "pagos-recibidos", reset);
  const days = [...new Set(paged.rows.map((p) => p.date))];
  const dep = rows.filter((p) => p.kind === "deposit").reduce((s, p) => s + p.amount, 0);
  return (
    <Panel
      id="pg-ledger"
      title="Pagos recibidos"
      subtitle={plural(rows.length, "pago en el periodo", "pagos en el periodo")}
      action={
        <ul className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-[12.5px] text-ink-muted">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-full" style={{ background: ABONO }} />
            Abonos <span className="font-semibold text-ink">{short(dep)}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-full" style={{ background: SALDO }} />
            Saldos <span className="font-semibold text-ink">{short(total - dep)}</span>
          </li>
          <li>
            Total <span className="font-semibold text-ink">{cop(total)}</span>
          </li>
        </ul>
      }
    >
      <ol className="flex flex-col gap-4">
        {days.map((day) => {
          const items = paged.rows.filter((p) => p.date === day);
          return (
            <li key={day} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 border-b border-line pb-1.5">
                <h3 className="text-[12.5px] font-semibold text-ink first-letter:uppercase">{fmtDate(day, true)}</h3>
                <span className="text-[12px] text-ink-muted tabular-nums">{cop(items.reduce((s, p) => s + p.amount, 0))}</span>
              </div>
              <ul className="flex flex-col">
                {items.map((p) => (
                  <li key={`${p.r.code}-${p.kind}-${p.amount}`}>
                    <Link href={paths.reserva(p.r.code)} className="-mx-2 flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors hover:bg-panel">
                      <span aria-hidden="true" className="h-8 w-1 flex-none rounded-full" style={{ background: p.kind === "deposit" ? ABONO : SALDO }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">{p.r.guest.fullName}</span>
                        <span className="block truncate text-[11.5px] text-ink-muted">{`${p.kind === "deposit" ? "Abono" : "Saldo"} · ${p.r.code} · ${cabinLabel(p.r.cabinTypeId, p.r.unit)}`}</span>
                      </span>
                      <span className="flex-none text-[14px] font-semibold text-ink tabular-nums">{cop(p.amount)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
      <Paginator p={paged} noun="pagos" className="border-t border-line pt-3" />
    </Panel>
  );
}

/* ───────────── Por cobrar ───────────── */

function DueTab({ rows }: { rows: Reservation[] }) {
  const { data, today, cabinLabel } = useAdmin();
  const [kindP, setKind] = useParam<Due>("tipo", "todo");
  const kind: Due = kindP === "abonos" || kindP === "saldos" ? kindP : "todo";
  const [q, setQ] = useParam("q", "");
  const [cabinId, setCabinId] = useParam("cabana", "");
  const nq = norm(q.trim());
  const list = rows
    .filter(
      (r) =>
        (kind === "todo" || (kind === "abonos" ? pendingOf(r).deposit > 0 : pendingOf(r).balance > 0)) &&
        (!cabinId || r.cabinTypeId === cabinId) &&
        (!nq || [r.code, r.guest.fullName, r.guest.phone, r.guest.docNumber].some((v) => norm(v || "").includes(nq))),
    )
    .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1));
  const amount = (r: Reservation) => (kind === "abonos" ? pendingOf(r).deposit : kind === "saldos" ? pendingOf(r).balance : pendingOf(r).total);
  const total = list.reduce((s, r) => s + amount(r), 0);
  const paged = usePaged(list, "por-cobrar", [kind, nq, cabinId].join("|"));
  const detail = (r: Reservation) =>
    r.status === "pending_deposit"
      ? "Sin confirmar, no aparta las fechas"
      : balanceDue(r)
        ? "En estadía, saldo por cobrar"
        : "Saldo antes de llegar o en recepción";
  // Cuándo llega: hoy, mañana, en N días, o «en estadía».
  const when = (r: Reservation) => {
    if (r.checkIn <= today) return { label: r.status === "checked_in" ? "En estadía" : "Llega hoy", urgent: true };
    const d = nightsBetween(today, r.checkIn);
    return { label: d === 1 ? "Llega mañana" : `Llega en ${d} días`, urgent: d <= 2 };
  };

  return (
    <>
      <div role="search" aria-label="Filtrar por cobrar" className="flex flex-wrap items-center gap-2">
        <ListSearch
          id="pg-due-q"
          label="Buscar por cobrar"
          value={q}
          onChange={setQ}
          placeholder="Nombre, código, celular o documento"
          className="w-full sm:w-[300px]"
        />
        <div className="w-full sm:w-[210px]">
          <Combobox value={cabinId} onChange={setCabinId} options={cabinOptions(data.cabinTypes)} icon={<HomeIcon size={14} className="text-ink-muted" />} />
        </div>
        <Segmented
          label="Qué falta por cobrar"
          value={kind}
          onChange={setKind}
          className="sm:ml-auto"
          options={[
            { value: "todo", label: "Todo", count: rows.length },
            { value: "abonos", label: "Abonos", count: rows.filter((r) => pendingOf(r).deposit > 0).length },
            { value: "saldos", label: "Saldos", count: rows.filter((r) => pendingOf(r).balance > 0).length },
          ]}
        />
      </div>
      {list.length ? (
        <>
          <p className="text-[13px] text-ink-muted">
            {`${plural(list.length, "reserva", "reservas")} · total por cobrar `}
            <strong className="font-semibold text-ink">{cop(total)}</strong>
          </p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {paged.rows.map((r) => {
              const w = when(r);
              const pend = pendingOf(r);
              const isDeposit = kind === "abonos" || (kind === "todo" && pend.deposit > 0);
              const both = kind === "todo" && pend.deposit > 0 && pend.balance > 0;
              return (
                <li key={r.code} className={`flex min-w-0 flex-col rounded-[22px] bg-paper ring-1 ring-inset ${w.urgent ? "ring-warning/45" : "ring-line"}`}>
                  <Link href={paths.reserva(r.code)} className="flex min-w-0 flex-col gap-3 rounded-t-[22px] p-5 transition-colors hover:bg-panel/60">
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold text-ink">{r.guest.fullName}</span>
                        <span className="block truncate text-[12px] text-ink-muted">{`${r.code} · ${cabinLabel(r.cabinTypeId, r.unit)}`}</span>
                      </span>
                      <StatusPill status={r.status} size="sm" />
                    </span>
                    <span className="flex items-end justify-between gap-3">
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-[12px] text-ink-muted">
                          <span aria-hidden="true" className="size-2 rounded-full" style={{ background: isDeposit ? ABONO : SALDO }} />
                          {both ? "Abono y saldo" : isDeposit ? "Abono" : "Saldo"}
                        </span>
                        <span className="mt-0.5 block text-[26px] leading-none font-semibold tracking-[-0.03em] text-ink">{cop(amount(r))}</span>
                        {both && (
                          <span className="mt-1 block text-[11.5px] text-ink-muted">{`abono ${short(pend.deposit)} · saldo ${short(pend.balance)}`}</span>
                        )}
                      </span>
                      <Badge tone={w.urgent ? "warning" : "neutral"} icon={<ClockIcon size={11} />}>
                        {w.label}
                      </Badge>
                    </span>
                    <span className="text-[12px] text-ink-muted">{`${detail(r)} · llega ${fmtDate(r.checkIn)}`}</span>
                  </Link>
                  <div className="mt-auto border-t border-line px-3 py-2">
                    <RowActions r={r} only={["pay"]} />
                  </div>
                </li>
              );
            })}
          </ul>
          <Paginator p={paged} noun="reservas" className="rounded-[18px] bg-paper px-4 py-3 ring-1 ring-line" />
        </>
      ) : (
        <Panel id="pg-due-empty" title="Por cobrar">
          <EmptyState icon={<ClockIcon size={18} />} title={rows.length ? "No hay pagos pendientes con esos filtros" : "No hay pagos pendientes"} />
        </Panel>
      )}
    </>
  );
}
