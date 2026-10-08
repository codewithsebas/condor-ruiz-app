import "server-only";
import { randomBytes } from "node:crypto";
import { ACTIVE_STATUSES, planChannelMoves, webFirst, type ChannelSpan, type Units } from "@/lib/booking";
import { config } from "@/lib/config";
import { addDays, fmtDate, nightsBetween, sleep, todayISO } from "@/lib/format";
import { buildIcs, parseIcs, type IcsEvent } from "@/lib/ical";
import type { Tables } from "@/lib/supabase/database.types";
import { createServiceClient } from "@/lib/supabase/server";
import type { CabinType, ChannelSyncResult, NotificationKind } from "@/lib/types";
import { type Db, isExclusionViolation, isMissingTable, loadCabinTypes, loadOccupancy } from "./db";

// Sincronización de disponibilidad con Booking.com por calendarios iCal (extranet → Sincronizar calendarios).
//   Booking → app: se lee el enlace de exportación de cada unidad y sus fechas quedan en channel_stays (cuentan como
//   bloqueos en la disponibilidad). Si caen sobre una reserva de la web, se reacomoda a otra unidad libre del mismo tipo
//   o se avisa al equipo de una posible sobreventa.
//   App → Booking: /api/ical/<token> publica las reservas activas y los bloqueos de la unidad; Booking lo importa a su ritmo.
// Se lee cada 5 minutos (pg_cron → /api/channels/sync), justo antes de asignar una reserva nueva y al consultar
// disponibilidad si hace rato no se lee. sync_started_at hace de candado: dos lecturas del mismo calendario no se cruzan.

type CalendarRow = Tables<"channel_calendars">;

const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 1_000_000;
const HISTORY_DAYS = 400; // fechas pasadas que se guardan (ocupación del último año)
const HORIZON_DAYS = 800; // fechas futuras que se aceptan
const MAX_NIGHTS = 366;

// Solo https. En desarrollo también http hacia este equipo (para probar con un archivo .ics local).
export function validImportUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.protocol === "https:") return true;
    return process.env.NODE_ENV !== "production" && u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname);
  } catch {
    return false;
  }
}

export const newExportToken = () => randomBytes(24).toString("hex");

const unitName = (types: CabinType[], typeId: string, unit: number) => `${(types.find((t) => t.id === typeId)?.nombre ?? typeId).replace(/^Cabaña\s+/i, "")} ${unit}`;

async function fetchIcs(url: string): Promise<IcsEvent[]> {
  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "text/calendar, text/plain;q=0.9, */*;q=0.1", "User-Agent": `${config.name} (sincronizacion de calendario)` },
    });
  } catch (e) {
    throw new Error((e as Error)?.name === "TimeoutError" ? "Booking no respondió a tiempo." : "No se pudo conectar con el enlace del calendario.");
  }
  if (!res.ok) throw new Error(res.status === 404 || res.status === 410 ? "El enlace ya no existe (404): cópialo de nuevo desde el extranet." : `El enlace respondió con un error (${res.status}).`);
  if (Number(res.headers.get("content-length") || 0) > MAX_BYTES) throw new Error("El calendario es demasiado grande.");
  const text = await res.text();
  if (text.length > MAX_BYTES) throw new Error("El calendario es demasiado grande.");
  try {
    return parseIcs(text);
  } catch {
    throw new Error("El enlace no devuelve un calendario iCal. Usa el enlace de exportación del extranet.");
  }
}

async function notify(sb: Db, kind: NotificationKind, title: string, body: string, code: string | null) {
  await sb.from("admin_notifications").insert({ kind, title: title.slice(0, 200), body: body.slice(0, 500), reservation_code: code }).throwOnError();
}

// Toma el calendario si nadie lo leyó (o intentó leer) en los últimos `minAgeMs`. Devuelve false si otro lo tiene.
async function claim(sb: Db, cal: CalendarRow, minAgeMs: number) {
  const cutoff = new Date(Date.now() - minAgeMs).toISOString();
  const { data } = await sb
    .from("channel_calendars")
    .update({ sync_started_at: new Date().toISOString() })
    .eq("id", cal.id)
    .or(`sync_started_at.is.null,sync_started_at.lt."${cutoff}"`)
    .select("id")
    .throwOnError();
  return data.length > 0;
}

// Unidades de un tipo enlazadas con Booking (las reservas de la web prueban primero las demás).
export async function linkedUnits(sb: Db, cabinTypeId: string) {
  const { data, error } = await sb.from("channel_calendars").select("unit").eq("cabin_type_id", cabinTypeId).not("import_url", "is", null);
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return data.map((c) => c.unit);
}

// Reservas de la web que quedaron sobre fechas nuevas de Booking: se reacomodan o se avisa de la posible sobreventa.
async function resolveConflicts(sb: Db, cal: CalendarRow, changed: ChannelSpan[], units: Units, types: CabinType[], today: string, result: ChannelSyncResult) {
  const type = cal.cabin_type_id;
  const live = changed.filter((s) => s.checkOut > today);
  if (!live.length) return;
  // Primero las reservas que tocan las fechas nuevas; luego la ocupación de todas sus noches (para buscarles otra unidad).
  let first = live.reduce((m, s) => (s.checkIn < m ? s.checkIn : m), live[0].checkIn);
  let last = live.reduce((m, s) => (s.checkOut > m ? s.checkOut : m), live[0].checkOut);
  const near = await loadOccupancy(sb, first, addDays(last, -1), type);
  for (const r of near.reservations) {
    if (r.checkIn < first) first = r.checkIn;
    if (r.checkOut > last) last = r.checkOut;
  }
  const occ = await loadOccupancy(sb, first, addDays(last, -1), type);
  const linked = await linkedUnits(sb, type);
  const plan = planChannelMoves(occ, live, units, today, (t) => webFirst(units[t] ?? 0, linked));
  const where = (s: ChannelSpan) => `${cal.label || unitName(types, type, cal.unit)} del ${fmtDate(s.checkIn)} al ${fmtDate(s.checkOut)}`;

  for (const m of plan.moves) {
    const stay = live.find((s) => occ.reservations.some((r) => r.code === m.code && s.checkIn < r.checkOut && r.checkIn < s.checkOut))!;
    const { data, error } = await sb.from("reservations").update({ unit: m.to }).eq("code", m.code).eq("unit", m.from).in("status", ACTIVE_STATUSES).select("code");
    if (error && !isExclusionViolation(error)) throw error;
    if (error || !data?.length) {
      // Otra reserva tomó esa unidad mientras tanto (o la reserva cambió): queda como posible sobreventa.
      plan.conflicts.push({ code: m.code, stay });
      continue;
    }
    result.moved.push(m.code);
    await notify(
      sb,
      "channel_moved",
      `Reserva reacomodada · ${m.code}`,
      `Booking.com ocupó ${where(stay)}. La reserva pasó de ${unitName(types, type, m.from)} a ${unitName(types, type, m.to)}.`,
      m.code,
    );
  }
  for (const c of plan.conflicts) {
    result.conflicts.push(c.code);
    await notify(
      sb,
      "channel_conflict",
      `Posible sobreventa con Booking.com · ${c.code}`,
      `Booking.com ocupó ${where(c.stay)}, donde está la reserva ${c.code}, y no hay otra cabaña libre. Revisa en el extranet si es una reserva nueva.`,
      c.code,
    );
  }
}

// Lee un calendario de Booking y actualiza sus fechas. Si falla no borra nada (la disponibilidad queda como estaba).
async function syncCalendar(sb: Db, cal: CalendarRow, units: Units, types: CabinType[], notifyErrors: boolean): Promise<ChannelSyncResult> {
  const result: ChannelSyncResult = { calendarId: cal.id, ok: true, events: 0, added: 0, removed: 0, moved: [], conflicts: [] };
  const today = todayISO();
  try {
    const events = (await fetchIcs(cal.import_url!)).filter(
      (e) => e.checkOut > addDays(today, -HISTORY_DAYS) && e.checkIn < addDays(today, HORIZON_DAYS) && nightsBetween(e.checkIn, e.checkOut) <= MAX_NIGHTS,
    );
    const { data: existing } = await sb.from("channel_stays").select("*").eq("calendar_id", cal.id).throwOnError();
    const byUid = new Map(existing.map((s) => [s.external_uid, s]));
    const now = new Date().toISOString();

    // Solo se escribe lo nuevo o cambiado: una lectura sin cambios no toca la base de datos (ni recarga el panel).
    // `moved`: fechas nuevas o que cambiaron de noches o de unidad (las únicas que pueden crear un choque con la web).
    const moved = (e: IcsEvent) => {
      const prev = byUid.get(e.uid);
      return !prev || !!prev.removed_at || prev.check_in !== e.checkIn || prev.check_out !== e.checkOut || prev.unit !== cal.unit || prev.cabin_type_id !== cal.cabin_type_id;
    };
    const changed = events.filter((e) => moved(e) || byUid.get(e.uid)!.summary !== e.summary);
    if (changed.length)
      await sb
        .from("channel_stays")
        .upsert(
          changed.map((e) => ({ calendar_id: cal.id, cabin_type_id: cal.cabin_type_id, unit: cal.unit, external_uid: e.uid, check_in: e.checkIn, check_out: e.checkOut, summary: e.summary, removed_at: null })),
          { onConflict: "calendar_id,external_uid" },
        )
        .throwOnError();

    // Lo que ya no viene y aún no termina se canceló en Booking. Lo pasado se conserva (historial de ocupación).
    const uids = new Set(events.map((e) => e.uid));
    const gone = existing.filter((s) => !s.removed_at && !uids.has(s.external_uid) && s.check_out > today).map((s) => s.id);
    if (gone.length) await sb.from("channel_stays").update({ removed_at: now }).in("id", gone).throwOnError();

    Object.assign(result, { events: events.length, added: changed.length, removed: gone.length });
    const spans = changed.filter(moved).map((e) => ({ cabinTypeId: cal.cabin_type_id, unit: cal.unit, checkIn: e.checkIn, checkOut: e.checkOut }));
    if (spans.length) await resolveConflicts(sb, cal, spans, units, types, today, result);

    await sb.from("channel_calendars").update({ last_synced_at: now, last_status: "ok", last_error: "", last_event_count: events.length }).eq("id", cal.id).throwOnError();
  } catch (e) {
    const message = (e instanceof Error ? e.message : String(e)).slice(0, 500);
    console.error(`Calendario de Booking ${cal.id}:`, e);
    Object.assign(result, { ok: false, error: message });
    await sb.from("channel_calendars").update({ last_status: "error", last_error: message }).eq("id", cal.id);
    // Se avisa una vez, cuando un calendario que funcionaba deja de leerse (los errores al enlazarlo se ven en el panel).
    if (notifyErrors && cal.last_status === "ok")
      await notify(sb, "channel_sync_failed", `No se pudo leer Booking.com · ${cal.label || unitName(types, cal.cabin_type_id, cal.unit)}`, `${message} Mientras tanto, las fechas de Booking quedan como en la última lectura.`, null).catch(
        () => {},
      );
  }
  return result;
}

// Lee los calendarios enlazados que no se leyeron en los últimos `minAgeMs` (todos, los de un tipo o uno).
export async function syncCalendars(opts: { minAgeMs: number; notifyErrors: boolean; cabinTypeId?: string; calendarId?: string }): Promise<ChannelSyncResult[]> {
  const sb = createServiceClient();
  let q = sb.from("channel_calendars").select("*").not("import_url", "is", null);
  if (opts.cabinTypeId) q = q.eq("cabin_type_id", opts.cabinTypeId);
  if (opts.calendarId) q = q.eq("id", opts.calendarId);
  const { data, error } = await q;
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  const due = data.filter((c) => !c.sync_started_at || Date.parse(c.sync_started_at) < Date.now() - opts.minAgeMs);
  if (!due.length) return [];
  const { units, types } = await loadCabinTypes(sb);
  const mine = (await Promise.all(due.map(async (c) => ((await claim(sb, c, opts.minAgeMs)) ? c : null)))).filter((c) => c !== null);
  return Promise.all(mine.map((c) => syncCalendar(sb, c, units, types, opts.notifyErrors)));
}

// Para las rutas públicas: lee si hace falta, pero sin hacer esperar más de `waitMs` (el resto sigue en segundo plano
// con after() de quien llama). Nunca falla: si Booking no responde, se sigue con las fechas de la última lectura.
export function syncSoon(opts: { cabinTypeId?: string; minAgeMs: number }) {
  return syncCalendars({ ...opts, notifyErrors: true }).catch((e) => {
    console.error("Sincronización con Booking:", e);
    return [] as ChannelSyncResult[];
  });
}
export const atMost = <T,>(p: Promise<T>, ms: number) => Promise.race([p, sleep(ms).then(() => null)]);

/* ───────────── Calendario que importa Booking ───────────── */

// Reservas activas (incluidas las retenidas mientras se paga el abono) y bloqueos de la unidad, desde ayer. Nunca las
// fechas que vienen de Booking (no se le devuelve su propio calendario). Sin datos personales.
export async function exportCalendar(token: string, base: string): Promise<string | null> {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  const sb = createServiceClient();
  const { data: cal, error } = await sb.from("channel_calendars").select("*").eq("export_token", token).maybeSingle();
  if (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
  if (!cal) return null;
  const since = addDays(todayISO(), -1);
  // Se anota la descarga (el panel muestra cuándo Booking vio la web por última vez); si falla, igual se sirve el calendario.
  // La hora se toma antes de leer las reservas: todo lo vendido hasta ese momento va en este calendario.
  const fetchedAt = new Date().toISOString();
  const [{ data: rs }, { data: bs }, { types }] = await Promise.all([
    sb.from("reservations").select("code, check_in, check_out").eq("cabin_type_id", cal.cabin_type_id).eq("unit", cal.unit).in("status", ACTIVE_STATUSES).gt("check_out", since).order("check_in").throwOnError(),
    sb.from("blocks").select("id, from_date, to_date").eq("cabin_type_id", cal.cabin_type_id).eq("unit", cal.unit).gte("to_date", since).order("from_date").throwOnError(),
    loadCabinTypes(sb),
    sb.from("channel_calendars").update({ last_fetched_at: fetchedAt }).eq("id", cal.id),
  ]);
  const host = new URL(base).host;
  const events: IcsEvent[] = [
    ...rs.map((r) => ({ uid: `${r.code}@${host}`, checkIn: r.check_in, checkOut: r.check_out, summary: "No disponible" })),
    ...bs.map((b) => ({ uid: `bloqueo-${b.id}@${host}`, checkIn: b.from_date, checkOut: addDays(b.to_date, 1), summary: "No disponible" })),
  ];
  return buildIcs(events, { name: `${config.name} · ${unitName(types, cal.cabin_type_id, cal.unit)}`, prodId: `-//${config.name}//Disponibilidad//ES` });
}
