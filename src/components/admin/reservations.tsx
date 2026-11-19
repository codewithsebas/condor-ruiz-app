"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookingIcon, CalendarIcon, ClockIcon, CloseIcon, FileTextIcon, HomeIcon, LoginIcon, PlusIcon, SearchIcon, WhatsAppIcon } from "@/components/ui/icons";
import { useLabelTip, useTip } from "@/components/ui/floating";
import { StatusPill } from "@/components/ui/status-pill";
import { paymentState, pendingOf } from "@/lib/admin-metrics";
import { MS, STATUS, WD_MIN, addDays, cop, isISO, monthStart, parseISO, plural } from "@/lib/format";
import { lastOfMonth, monthOptions } from "@/components/admin/calendar/shared";
import { CHANNEL_NAME, isFromBooking, staysWithoutData } from "@/lib/booking";
import type { ChannelStay, Reservation, ReservationStatus } from "@/lib/types";
import { BookingStayDialog, BookingStaysPending } from "@/components/admin/booking-stay";
import { Combobox } from "@/components/ui/combobox";
import { useAdmin, useParam } from "@/components/admin/context";
import { DateRangePicker } from "@/components/admin/date-picker";
import { NewReservationDialog } from "@/components/admin/new-reservation";
import { Paginator, usePaged } from "@/components/admin/paginator";
import { MODULES, paths } from "@/components/admin/routes";
import { ARRIVING, DEPARTING, adminInput, norm, rowOf } from "@/components/admin/shared";
import { SyncMark } from "@/components/admin/sync";
import { useReservationActions } from "@/components/admin/reservation-detail";
import { ACTION_ICON, ActionMenu, inMenu, type ActionKind } from "@/components/admin/action-menu";
import { Badge, Button, EmptyState, IconButton, ModalPresence, Segmented, enter, iconButtonClass } from "@/components/admin/ui";
import { Panel } from "@/components/admin/board";

// Más reciente primero; si dos se crearon a la vez (un grupo), desempata el código para que el orden no salte.
const newestFirst = (a: Reservation, b: Reservation) => b.createdAt.localeCompare(a.createdAt) || b.code.localeCompare(a.code);

// Un solo filtro de estado: los estados de la reserva y dos vistas de trabajo (comprobantes por revisar, próximas llegadas).
type View = "" | "comprobantes" | "proximas" | "booking-sin-datos" | ReservationStatus;
type Sort = "creada-desc" | "llegada-desc" | "llegada-asc" | "valor-desc";

// Lista de reservas. Los filtros viven en la URL: al abrir una reserva y volver, la lista sigue igual.
export function ReservationsView() {
  const { data, today } = useAdmin();
  const [q, setQ] = useParam("q", "");
  const [view, setView] = useParam<View>("estado", "");
  const [cabin, setCabin] = useParam("cabana", "");
  const [fromP, setFrom] = useParam("desde", "");
  const [toP, setTo] = useParam("hasta", "");
  const [sort, setSort] = useParam<Sort>("orden", "creada-desc");
  const [creating, setCreating] = useState(false);
  const [staying, setStaying] = useState<ChannelStay | null>(null);
  const missing = staysWithoutData(data.channelStays ?? [], today).length;
  const from = isISO(fromP) ? fromP : null;
  const to = isISO(toP) ? toP : null;

  const proofCodes = useMemo(() => new Set(data.proofs.filter((p) => p.status === "pending").map((p) => p.reservationCode)), [data.proofs]);
  const inView = (r: Reservation) =>
    !view ||
    (view === "comprobantes"
      ? proofCodes.has(r.code)
      : view === "proximas"
        ? ["pending_deposit", "confirmed", "rescheduled"].includes(r.status) && r.checkIn >= today
        : r.status === view);
  const byStatus = (s: ReservationStatus) => data.reservations.filter((r) => r.status === s).length;

  const nq = norm(q.trim());
  const list = data.reservations
    .filter(
      (r) =>
        inView(r) &&
        (!cabin || r.cabinTypeId === cabin) &&
        (!from || r.checkIn >= from) &&
        (!to || r.checkIn <= to) &&
        (!nq || [r.code, r.guest.fullName, r.guest.email, r.guest.phone, r.guest.docNumber, r.externalRef ?? ""].some((v) => norm(v || "").includes(nq))),
    )
    .sort((a, b) =>
      sort === "llegada-asc"
        ? a.checkIn < b.checkIn
          ? -1
          : 1
        : sort === "llegada-desc"
          ? a.checkIn < b.checkIn
            ? 1
            : -1
          : sort === "valor-desc"
            ? b.quote.total - a.quote.total
            : newestFirst(a, b),
    );
  // El filtro de mes es un atajo del rango de llegada: muestra el mes solo si el rango lo cubre entero.
  const monthValue = from && to && from === monthStart(from) && to === lastOfMonth(from) ? from : "";
  const months = useMemo(() => monthOptions(today, from ?? today), [today, from]);
  // La última reserva creada (de todas, no solo de las filtradas) se pinta con otro fondo para ubicarla de un vistazo.
  const latest = data.reservations.reduce<Reservation | null>((a, r) => (!a || newestFirst(r, a) < 0 ? r : a), null)?.code;
  const paged = usePaged(list, "reservas", [nq, view, cabin, fromP, toP, sort].join("|"));
  const active = !!(q || view || cabin || from);
  const clear = () => {
    setQ("");
    setView("");
    setCabin("");
    setFrom("");
    setTo("");
  };

  return (
    <>
      <ModalPresence>{creating && <NewReservationDialog draft={{}} onClose={() => setCreating(false)} />}</ModalPresence>

      <header {...enter(0)} className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-muted">{MODULES.reservas.description}</p>
          <h1
            id="ad-title"
            tabIndex={-1}
            className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-[-0.025em] text-ink focus:outline-none"
          >
            {MODULES.reservas.label}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {active && (
            <Button size="sm" variant="ghost" icon={<CloseIcon size={14} />} onClick={clear}>
              Limpiar filtros
            </Button>
          )}
          <Button variant="primary" icon={<PlusIcon size={15} />} onClick={() => setCreating(true)}>
            Nueva reserva
          </Button>
        </div>
      </header>

      <ReservationStats onView={setView} />

      <div className="flex flex-col gap-3">
        {/* Vistas rápidas: todas, las de trabajo y cada estado, con su cantidad. */}
        <Segmented
          label="Mostrar"
          value={view}
          onChange={setView}
          className="w-full"
          options={[
            { value: "" as View, label: "Todas", count: data.reservations.length },
            {
              value: "proximas" as View,
              label: "Próximas llegadas",
              count: data.reservations.filter((r) => ["pending_deposit", "confirmed", "rescheduled"].includes(r.status) && r.checkIn >= today).length,
            },
            { value: "comprobantes" as View, label: "Comprobantes", count: proofCodes.size },
            ...(missing ? [{ value: "booking-sin-datos" as View, label: "Booking sin datos", count: missing }] : []),
            ...(Object.entries(STATUS) as [ReservationStatus, (typeof STATUS)[ReservationStatus]][]).map(([v, s]) => ({
              value: v as View,
              label: s.label,
              count: byStatus(v),
              icon: <span aria-hidden="true" className="size-2 rounded-full ring-1 ring-ink/15" style={{ background: s.bg }} />,
            })),
          ]}
        />
        <form
          role="search"
          aria-label="Filtrar reservas"
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-2 items-center gap-2 md:grid-cols-3 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]"
        >
          <div className="relative col-span-2 min-w-0 md:col-span-3 xl:col-span-1">
            <label htmlFor="res-q" className="sr-only">
              Buscar reservas
            </label>
            <SearchIcon size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
            <input
              id="res-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre, código, correo, celular o documento"
              className={`${adminInput} rounded-full! pl-8!`}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="res-cabana" className="sr-only">
              Cabaña
            </label>
            <Combobox
              id="res-cabana"
              value={cabin}
              onChange={setCabin}
              icon={<HomeIcon size={14} className="text-ink-muted" />}
              options={[
                { value: "", label: "Todas las cabañas" },
                ...data.cabinTypes.map((c) => ({ value: c.id, label: c.nombre, description: c.activa ? undefined : "Inactiva" })),
              ]}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="res-mes" className="sr-only">
              Mes de llegada
            </label>
            {/* Llegadas del mes elegido: fija «Llegada entre» al primer y al último día del mes. */}
            <Combobox
              id="res-mes"
              value={monthValue}
              onChange={(m) => {
                setFrom(m);
                setTo(m ? lastOfMonth(m) : "");
              }}
              options={[{ value: "", label: "Todos los meses" }, ...months]}
              searchable={false}
              selectedFirst
              icon={<CalendarIcon size={14} className="text-ink-muted" />}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="res-llegada" className="sr-only">
              Llegada entre
            </label>
            <DateRangePicker
              id="res-llegada"
              from={from}
              to={to}
              onChange={(a, b) => {
                setFrom(a ?? "");
                setTo(b ?? "");
              }}
              placeholder="Llegada: cualquier fecha"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="res-orden" className="sr-only">
              Ordenar por
            </label>
            <Combobox
              id="res-orden"
              value={sort}
              onChange={(v) => setSort(v as Sort)}
              searchable={false}
              options={[
                { value: "creada-desc", label: "Creada más reciente" },
                { value: "llegada-desc", label: "Llegada más reciente" },
                { value: "llegada-asc", label: "Llegada más antigua" },
                { value: "valor-desc", label: "Mayor valor" },
              ]}
            />
          </div>
        </form>
      </div>

      <ModalPresence>{staying && <BookingStayDialog stay={staying} onClose={() => setStaying(null)} />}</ModalPresence>
      {view === "booking-sin-datos" ? (
        <BookingStaysPending onComplete={setStaying} />
      ) : list.length > 0 ? (
        <>
          <p className="text-[13px] text-ink-muted">
            {plural(list.length, "reserva", "reservas")}
            {list.length > 0 && (
              <>
                {" · valor total "}
                <strong className="font-semibold text-ink">{cop(list.reduce((s, r) => s + r.quote.total, 0))}</strong>
              </>
            )}
          </p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {paged.rows.map((r) => (
              <Ticket key={r.code} r={r} latest={r.code === latest} proof={proofCodes.has(r.code)} />
            ))}
          </ul>
          <Paginator p={paged} noun="reservas" className="rounded-[18px] bg-paper px-4 py-3 ring-1 ring-line" />
        </>
      ) : (
        <Panel id="res-empty" title="Reservas">
          <EmptyState
            icon={<SearchIcon size={18} />}
            title={active ? "No hay reservas con esos filtros" : "Aún no hay reservas"}
            text={active ? "Prueba con otro estado, otras fechas u otro término de búsqueda." : "Las reservas que lleguen desde el sitio aparecerán aquí."}
            action={active ? <Button onClick={clear}>Limpiar filtros</Button> : undefined}
          />
        </Panel>
      )}
    </>
  );
}

// Reserva como un boleto: franja del color de su estado, código y canal, huésped, las fechas en grande con las noches,
// el total y el pago; abajo, sus acciones.
function Ticket({ r, latest, proof }: { r: Reservation; latest: boolean; proof: boolean }) {
  const { cabinLabel } = useAdmin();
  const x = rowOf(r, cabinLabel);
  const pay = paymentState(r);
  const d = (iso: string) => {
    const date = parseISO(iso);
    return { day: date.getUTCDate(), month: MS[date.getUTCMonth()], wd: WD_MIN[date.getUTCDay()] };
  };
  const a = d(r.checkIn);
  const b = d(r.checkOut);
  return (
    <li className={`relative flex min-w-0 flex-col overflow-hidden rounded-[22px] bg-paper ring-1 ring-inset ${latest ? "ring-ink/30" : "ring-line"}`}>
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{ background: STATUS[r.status]?.bg }} />
      <Link href={paths.reserva(r.code)} className="flex min-w-0 flex-col gap-3 p-5 pl-6 transition-colors hover:bg-panel/60">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-[12px] font-semibold tracking-[.03em] text-ink-muted">
              {x.code}
              {latest && <Badge tone="info">Última</Badge>}
              {r.source === "import" &&
                (isFromBooking(r) ? (
                  <span className="inline-flex items-center gap-1 font-medium">
                    <BookingIcon size={12} />
                    {CHANNEL_NAME}
                  </span>
                ) : (
                  <span className="font-medium">{r.channel || "Importada"}</span>
                ))}
            </span>
            <span className="mt-0.5 block truncate text-[15px] font-semibold text-ink">{x.name}</span>
            <span className="block truncate text-[12px] text-ink-muted">{x.cabin}</span>
          </span>
          <StatusPill status={r.status} size="sm" />
        </span>
        {/* Fechas como en un boleto: llegada → salida, con las noches al centro. */}
        <span className="flex items-center gap-2 rounded-[16px] bg-panel px-3.5 py-2.5 ring-1 ring-line ring-inset">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] text-ink-muted">{`Llega · ${a.wd}`}</span>
            <span className="text-[18px] leading-tight font-semibold text-ink">{`${a.day} ${a.month}`}</span>
          </span>
          <span className="flex flex-none flex-col items-center px-1 text-[11px] text-ink-muted">
            <span aria-hidden="true" className="block h-px w-10 bg-line-strong" />
            <span className="mt-1">{x.nights}</span>
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-end">
            <span className="text-[11px] text-ink-muted">{`Sale · ${b.wd}`}</span>
            <span className="text-[18px] leading-tight font-semibold text-ink">{`${b.day} ${b.month}`}</span>
          </span>
        </span>
        <span className="flex flex-wrap items-center justify-between gap-2">
          {proof ? (
            <Badge tone="info" icon={<FileTextIcon size={12} />}>
              Comprobante por revisar
            </Badge>
          ) : (
            <Badge tone={pay.tone}>{pay.label}</Badge>
          )}
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">{x.total}</span>
        </span>
        <SyncMark entity={`reservations:${r.code}`} />
      </Link>
      <div className="mt-auto border-t border-line px-3 py-2 pl-4">
        <RowActions r={r} />
      </div>
    </li>
  );
}

// Resumen de todas las reservas: no cambia con los filtros de la lista. Llegadas y salidas se cuentan igual que en Inicio.
function ReservationStats({ onView }: { onView: (v: View) => void }) {
  const { data, today } = useAdmin();
  const tip = useTip();
  const R = data.reservations;
  const arrivals = R.filter((r) => r.checkIn === today && ARRIVING.includes(r.status)).length;
  const departures = R.filter((r) => r.checkOut === today && DEPARTING.includes(r.status)).length;
  const inHouse = R.filter((r) => r.status === "checked_in").length;
  const upcoming = R.filter((r) => r.checkIn >= today && ARRIVING.includes(r.status));
  const week = addDays(today, 7);
  const thisWeek = upcoming.filter((r) => r.checkIn <= week).length;
  const unpaid = R.filter((r) => pendingOf(r).deposit > 0); // La misma cuenta de Pagos.
  // Reservas vigentes por estado (barra en partes con el color de cada estado, su leyenda y su cantidad).
  const live: ReservationStatus[] = ["pending_deposit", "confirmed", "rescheduled", "checked_in"];
  const parts = live.map((s) => ({ s, n: R.filter((r) => r.status === s).length })).filter((p) => p.n);
  const total = parts.reduce((n, p) => n + p.n, 0);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <section {...enter(1)} aria-label="Reservas vigentes" className="flex flex-col gap-4 rounded-[22px] bg-ink p-6 text-paper xl:col-span-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[13px] font-medium text-paper/70">Reservas vigentes</h2>
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-paper/10">
            <CalendarIcon size={16} />
          </span>
        </div>
        <p className="flex items-baseline gap-2">
          <span className="text-[56px] leading-none font-semibold tracking-[-0.04em]">{total}</span>
          <span className="text-[14px] text-paper/60">{`de ${plural(R.length, "reserva", "reservas")}`}</span>
        </p>
        {total > 0 && (
          <div className="mt-auto flex flex-col gap-2.5">
            <div role="img" aria-label={parts.map((p) => `${STATUS[p.s].label}: ${p.n}`).join(", ")} className="flex h-2.5 gap-[2px]">
              {parts.map((p) => (
                <span
                  key={p.s}
                  {...tip(() => (
                    <span>
                      <strong>{STATUS[p.s].label}</strong> · {p.n}
                    </span>
                  ))}
                  className="h-full rounded-full"
                  style={{ width: `${(p.n / total) * 100}%`, background: STATUS[p.s].bg }}
                />
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
              {parts.map((p) => (
                <li key={p.s}>
                  <button
                    type="button"
                    onClick={() => onView(p.s)}
                    className="flex items-center gap-1.5 text-[12px] text-paper/70 transition-colors hover:text-paper"
                  >
                    <span aria-hidden="true" className="size-2 rounded-full" style={{ background: STATUS[p.s].bg }} />
                    {STATUS[p.s].label}
                    <span className="font-semibold text-paper">{p.n}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <div className="grid min-w-0 grid-cols-2 gap-4 xl:col-span-7">
        {[
          { icon: <LoginIcon size={15} />, label: "Llegadas hoy", value: arrivals, hint: arrivals ? "por recibir" : "ninguna hoy" },
          {
            icon: <HomeIcon size={15} />,
            label: "En estadía",
            value: inHouse,
            hint: departures ? plural(departures, "salida hoy", "salidas hoy") : "sin salidas hoy",
          },
          { icon: <CalendarIcon size={15} />, label: "Por llegar", value: upcoming.length, hint: `${thisWeek} en los próximos 7 días` },
          {
            icon: <ClockIcon size={15} />,
            label: "Sin abono",
            value: unpaid.length,
            hint: unpaid.length ? `${cop(unpaid.reduce((s, r) => s + pendingOf(r).deposit, 0))} por recibir` : "ninguno ahora",
          },
        ].map((t, i) => (
          <section
            key={t.label}
            {...enter(1.5 + i * 0.4)}
            aria-label={t.label}
            className="flex min-w-0 flex-col gap-2 rounded-[22px] bg-paper p-5 ring-1 ring-line ring-inset"
          >
            <span className="flex items-center gap-2 text-[12.5px] font-medium text-ink-muted">
              <span aria-hidden="true" className="grid size-7 flex-none place-items-center rounded-full bg-panel text-ink ring-1 ring-line">
                {t.icon}
              </span>
              {t.label}
            </span>
            <p className="text-[28px] leading-none font-semibold tracking-[-0.03em] text-ink">{t.value}</p>
            <p className="mt-auto truncate text-[12px] text-ink-subtle">{t.hint}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

// Las mismas acciones del detalle de la reserva: las del día a día como botones de icono (nombre en el tooltip) y las que
// cambian la reserva, en el menú «⋯». Los clics no abren la reserva (la fila entera sí).
// `only`: deja solo esas acciones, sin menú (WhatsApp siempre está).
export function RowActions({ r, only }: { r: Reservation; only?: ActionKind[] }) {
  const { actions, whatsapp, dialog } = useReservationActions(r);
  const waTip = useLabelTip("WhatsApp");
  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {actions
        .filter((a) => (only ? only.includes(a.id) : !inMenu(a)))
        .map((a) => (
          <IconButton
            key={a.label}
            label={a.disabled ? `${a.label} · ${a.disabled}` : a.label}
            size="sm"
            variant={a.primary ? "primary" : a.danger ? "danger-ghost" : "secondary"}
            disabled={!!a.disabled}
            data-gesture={ACTION_ICON[a.id].gesture}
            onClick={a.run}
          >
            {ACTION_ICON[a.id].icon(15)}
          </IconButton>
        ))}
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener"
        aria-label={`WhatsApp a ${r.guest.fullName}`}
        data-gesture="chat"
        className={iconButtonClass("secondary", "sm", "text-ink")}
        {...waTip}
      >
        <WhatsAppIcon size={15} />
      </a>
      {!only && <ActionMenu actions={actions.filter(inMenu)} compact />}
      {dialog}
    </div>
  );
}
