"use client";

// Conexión con Booking.com por calendario (iCal), una por cabaña y en los dos sentidos: el panel lee el calendario de
// exportación de Booking (sus noches ocupan la cabaña) y Booking importa el del panel. Arriba, cifras de lo que llega de
// Booking; abajo, los calendarios de cada cabaña (solo administradores).
import { BookingIcon, CalendarIcon, CloseIcon, UserIcon } from "@/components/ui/icons";
import { isFromBooking } from "@/lib/booking";
import { addDays, cop, nightsBetween, plural } from "@/lib/format";
import { useAdmin } from "@/components/admin/context";
import { useSyncStatus } from "@/components/admin/sync";
import { BookingCalendars } from "@/components/admin/booking-calendars";
import { MODULES } from "@/components/admin/routes";
import { isAdminRole } from "@/lib/permissions";
import { Callout, enter } from "@/components/admin/ui";

export function BookingView() {
  const { sync, data, today } = useAdmin();
  const offline = useSyncStatus(sync).network === "offline";

  // Estadías que Booking tiene en los calendarios (las que el propio panel le mandó no cuentan).
  const stays = data.channelStays.filter((s) => !s.echo);
  const upcoming = stays.filter((s) => !s.removedAt && s.checkOut > today);
  const upcomingNights = upcoming.reduce((n, s) => n + nightsBetween(s.checkIn < today ? today : s.checkIn, s.checkOut), 0);
  const withoutGuest = upcoming.filter((s) => !s.reservationCode);
  const cancelled = stays.filter((s) => s.removedAt && s.removedAt.slice(0, 10) >= addDays(today, -30));
  // Booking en el mes: reservas de Booking que llegan este mes, su valor y sus noches.
  const monthStays = data.reservations.filter((r) => isFromBooking(r) && r.checkIn.slice(0, 7) === today.slice(0, 7) && r.status !== "cancelled");
  const monthValue = monthStays.reduce((s, r) => s + r.quote.total, 0);
  const monthNights = monthStays.reduce((n, r) => n + nightsBetween(r.checkIn, r.checkOut), 0);

  return (
    <div className="flex flex-col gap-5">
      <header {...enter(0)} className="min-w-0">
        <p className="text-[13px] font-medium text-ink-muted">Conexión con Booking.com por calendario (iCal), una por cabaña y en los dos sentidos</p>
        <h1 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-[-0.025em] text-ink">{MODULES.booking.label}</h1>
      </header>

      {offline && <Callout tone="warning">Sin conexión: los calendarios de Booking se vuelven a leer al recuperar internet.</Callout>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section {...enter(1)} aria-label="Estadías de Booking por llegar" className="flex flex-col gap-4 rounded-[22px] bg-ink p-6 text-paper xl:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[13px] font-medium text-paper/70">Estadías de Booking por llegar</h2>
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-paper/10">
              <BookingIcon size={16} />
            </span>
          </div>
          <p className="text-[56px] leading-none font-semibold tracking-[-0.04em]">{upcoming.length}</p>
          <p className="text-[12.5px] text-paper/60">
            {upcoming.length ? `${plural(upcomingNights, "noche ocupada", "noches ocupadas")} en el calendario` : "Booking no tiene estadías por llegar"}
          </p>
        </section>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3 xl:col-span-7">
          {[
            {
              icon: <CalendarIcon size={15} />,
              label: "Booking este mes",
              value: short(monthValue),
              hint: `${plural(monthStays.length, "estadía", "estadías")} · ${plural(monthNights, "noche", "noches")}`,
            },
            {
              icon: <UserIcon size={15} />,
              label: "Sin datos del huésped",
              value: String(withoutGuest.length),
              hint: withoutGuest.length ? "complétalas desde el calendario" : "todas tienen su reserva",
            },
            { icon: <CloseIcon size={15} />, label: "Canceladas en Booking", value: String(cancelled.length), hint: "en los últimos 30 días" },
          ].map((t, i) => (
            <section
              key={t.label}
              {...enter(1.5 + i * 0.4)}
              aria-label={t.label}
              className="flex min-w-0 flex-col gap-3 rounded-[22px] bg-paper p-5 ring-1 ring-line ring-inset"
            >
              <span className="flex items-center gap-2 text-[12.5px] font-medium text-ink-muted">
                <span aria-hidden="true" className="grid size-7 flex-none place-items-center rounded-full bg-panel text-ink ring-1 ring-line">
                  {t.icon}
                </span>
                {t.label}
              </span>
              <p className="text-[26px] leading-none font-semibold tracking-[-0.03em] text-ink">{t.value}</p>
              <p className="mt-auto text-[12px] text-ink-subtle">{t.hint}</p>
            </section>
          ))}
        </div>
      </div>

      {isAdminRole(data.me.role) && <BookingCalendars offline={offline} />}
    </div>
  );
}

// $390 mil · $1,2 M
const short = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1).replace(".", ",")} M` : n >= 1e3 ? `$${Math.round(n / 1e3)} mil` : cop(n));
