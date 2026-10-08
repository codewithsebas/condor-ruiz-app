"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarIcon, ChevronRightIcon, ClockIcon, FileTextIcon, HomeIcon, LoginIcon, LogoutIcon, TrendIcon, WalletIcon } from "@/components/icons";
import { StatusPill } from "@/components/status-pill";
import { balanceDue, finance, pendingOf } from "@/lib/admin-metrics";
import { ACTIVE_STATUSES, channelBlocks } from "@/lib/booking";
import { addDays, cop, countdown, fmtDate, fmtFullDate, plural } from "@/lib/format";
import type { Reservation } from "@/lib/types";
import { useAdmin } from "./context";
import { useTip } from "@/components/ui/floating";
import { MODULES, paths } from "./routes";
import { ARRIVING, DEPARTING, rowOf } from "./shared";
import { Badge, Card, CardHeader, CountBadge, EmptyState, PageHeader, StatCard, buttonClass } from "./ui";

function ReservationRow({ r, meta, right }: { r: Reservation; meta: string; right: ReactNode }) {
  return (
    <li>
      <Link href={paths.reserva(r.code)} className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-canvas">
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] leading-snug font-semibold text-ink">{r.guest.fullName}</span>
          <span className="block text-[12.5px] leading-snug text-ink-muted">{meta}</span>
        </span>
        {right}
        <ChevronRightIcon size={16} className="text-ink-subtle transition-transform duration-150 motion-safe:group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

function ListCard({ id, icon, title, count, empty, className = "", children }: { id: string; icon: ReactNode; title: string; count: number; empty: string; className?: string; children: ReactNode }) {
  return (
    <Card aria-labelledby={id} className={`flex flex-col gap-3 p-4 sm:p-5 ${className}`}>
      <CardHeader
        id={id}
        icon={icon}
        title={
          <span className="flex items-center gap-2">
            {title} <CountBadge n={count} />
          </span>
        }
      />
      {count ? <ul className="-mx-2.5 flex flex-col">{children}</ul> : <EmptyState compact icon={icon} title={empty} />}
    </Card>
  );
}

function occupancy(d: ReturnType<typeof useAdmin>["data"], date: string) {
  let busy = 0;
  let total = 0;
  for (const c of d.cabinTypes) {
    if (!c.activa && !d.reservations.some((r) => r.cabinTypeId === c.id)) continue;
    total += c.units;
    const set = new Set<number>();
    d.reservations.forEach((r) => r.cabinTypeId === c.id && ACTIVE_STATUSES.includes(r.status) && r.checkIn <= date && date < r.checkOut && set.add(r.unit));
    [...d.blocks, ...channelBlocks(d.channelStays)].forEach((b) => b.cabinTypeId === c.id && b.from <= date && date <= b.to && set.add(b.unit));
    busy += set.size;
  }
  return { busy, total };
}

export function Dashboard() {
  const { data, today, now, cabinLabel } = useAdmin();
  const R = data.reservations;
  const arr = R.filter((r) => r.checkIn === today && ARRIVING.includes(r.status));
  const dep = R.filter((r) => r.checkOut === today && DEPARTING.includes(r.status));
  // Pagos por completar: abonos de fechas retenidas y saldos de huéspedes en estadía (con su plazo), el más urgente primero.
  const deadlineOf = (r: Reservation) => (r.status === "pending_deposit" ? r.depositDueAt : (r.balanceDueAt ?? ""));
  const pend = R.filter((r) => r.status === "pending_deposit" || balanceDue(r, now)).sort((a, b) => (deadlineOf(a) < deadlineOf(b) ? -1 : 1));
  const proofFor = (code: string) => data.proofs.find((p) => p.reservationCode === code && p.status === "pending");
  const occToday = occupancy(data, today);
  const month = finance(R, data.blocks, data.cabinTypes, { from: today.slice(0, 8) + "01", to: today }, "", data.channelStays);
  const toCollect = R.reduce((s, r) => s + pendingOf(r).total, 0);

  return (
    <>
      <PageHeader
        title={MODULES.dashboard.label}
        description={fmtFullDate(today)}
        actions={
          <Link href={paths.calendario()} className={buttonClass()}>
            <CalendarIcon size={16} />
            Ver calendario
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ocupación esta noche" value={`${occToday.busy} de ${occToday.total}`} hint={occToday.total ? `${Math.round((occToday.busy / occToday.total) * 100)} % de las cabañas` : "Sin cabañas"} icon={<HomeIcon size={15} />} />
        <StatCard label="Movimiento de hoy" value={`${arr.length} · ${dep.length}`} hint="llegadas · salidas" icon={<LoginIcon size={15} />} />
        <StatCard label="Ingresos del mes" value={cop(month.received)} hint={`${plural(month.confirmedCount, "reserva confirmada", "reservas confirmadas")}`} icon={<TrendIcon size={15} />} tone="success" />
        <StatCard label="Por cobrar" value={cop(toCollect)} hint={<Link href={paths.pagos({ vista: "por-cobrar" })} className="font-semibold text-ink underline-offset-2 hover:underline">Ver pagos pendientes</Link>} icon={<WalletIcon size={15} />} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ListCard id="d-arr" icon={<LoginIcon size={18} />} title="Llegadas hoy" count={arr.length} empty="No hay llegadas programadas hoy.">
          {arr.map((r) => {
            const x = rowOf(r, cabinLabel);
            return <ReservationRow key={r.code} r={r} meta={[x.cabin, x.code, x.arrival].filter(Boolean).join(" · ")} right={<StatusPill status={r.status} size="sm" />} />;
          })}
        </ListCard>
        <ListCard id="d-dep" icon={<LogoutIcon size={18} />} title="Salidas hoy" count={dep.length} empty="No hay salidas programadas hoy.">
          {dep.map((r) => {
            const x = rowOf(r, cabinLabel);
            return <ReservationRow key={r.code} r={r} meta={`${x.cabin} · ${x.code}`} right={<StatusPill status={r.status} size="sm" />} />;
          })}
        </ListCard>
        <ListCard id="d-pend" icon={<WalletIcon size={18} />} title="Pagos por completar" count={pend.length} empty="No hay abonos ni saldos pendientes." className="md:col-span-2 xl:col-span-1">
          {pend.map((r) => {
            const x = rowOf(r, cabinLabel);
            const bd = balanceDue(r, now);
            const deadline = deadlineOf(r);
            const minutes = deadline ? (Date.parse(deadline) - now) / 6e4 : 0;
            const proof = proofFor(r.code);
            return (
              <ReservationRow
                key={r.code}
                r={r}
                meta={bd ? `${x.code} · saldo ${cop(bd.amount)} · en estadía` : `${x.code} · abono ${x.deposit} · llega ${fmtDate(r.checkIn)}`}
                right={
                  bd?.overdue ? (
                    <Badge tone="danger">Saldo vencido</Badge>
                  ) : proof ? (
                    <Badge tone="info" icon={<FileTextIcon size={12} />}>
                      Comprobante
                    </Badge>
                  ) : (
                    <span className={`inline-flex flex-none items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums ${minutes < 10 ? "bg-error-soft text-error" : "bg-warning-soft text-warning"}`}>
                      <ClockIcon size={13} />
                      <span className="sr-only">{bd ? "El saldo vence en " : "La retención vence en "}</span>
                      {countdown(deadline)}
                    </span>
                  )
                }
              />
            );
          })}
        </ListCard>
      </div>
      <OccupancyChart />
    </>
  );
}

// Columnas de ocupación (una serie: el título la nombra; etiqueta directa solo en hoy; el resto en el tooltip).
function OccupancyChart() {
  const { data, today } = useAdmin();
  const tip = useTip();
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i);
    const { busy, total } = occupancy(data, day);
    return { day, label: i === 0 ? "Hoy" : fmtDate(day), busy, total, pc: total ? Math.round((busy / total) * 100) : 0 };
  });
  const avg = Math.round(week.reduce((s, d) => s + d.pc, 0) / week.length);

  return (
    <Card aria-labelledby="d-week" className="flex flex-col gap-5 p-4 sm:p-5">
      <CardHeader id="d-week" icon={<CalendarIcon size={18} />} title="Ocupación de los próximos 7 días" subtitle={`Promedio ${avg} % · ${plural(week[0].total, "cabaña", "cabañas")}`} />
      <div className="pl-9">
        <div className="relative h-[168px]">
          {[100, 50, 0].map((pc) => (
            <div key={pc} aria-hidden="true" className="absolute inset-x-0 border-t border-line" style={{ top: `${100 - pc}%` }}>
              <span className="absolute top-0 right-full -translate-y-1/2 pr-2 text-[11px] whitespace-nowrap text-ink-subtle tabular-nums">{pc} %</span>
            </div>
          ))}
          <ol className="relative grid h-full grid-cols-7">
            {week.map((d, i) => (
              <li
                key={d.day}
                role="img"
                aria-label={`${fmtDate(d.day)}: ${d.pc} % de ocupación, ${d.busy} de ${d.total} cabañas`}
                {...tip(() => (
                  <span>
                    <strong>{fmtDate(d.day)}</strong> · {d.pc} % · {d.busy} de {d.total} cabañas
                  </span>
                ))}
                className="group relative flex h-full flex-col items-center justify-end"
              >
                <span aria-hidden="true" className="relative block w-6 rounded-t-[4px] bg-chart transition-[filter] group-hover:brightness-90" style={{ height: d.pc ? `${d.pc}%` : 0 }}>
                  {i === 0 && <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 text-[12px] font-bold whitespace-nowrap text-ink tabular-nums">{d.pc} %</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <ol aria-hidden="true" className="mt-2 grid grid-cols-7 text-center text-[12px]">
          {week.map((d, i) => (
            <li key={d.day} className={i === 0 ? "font-bold text-ink" : "text-ink-muted"}>
              {d.label}
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
