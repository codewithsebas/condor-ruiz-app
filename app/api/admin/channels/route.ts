import { after, type NextRequest } from "next/server";
import { type Db, isMissingTable, loadCabinTypes, loadChannels } from "@/lib/server/db";
import { fail, json, readJson, requireAdmin, route } from "@/lib/server/http";
import { newExportToken, syncCalendars, validImportUrl } from "@/lib/server/channels";
import { siteUrl } from "@/lib/server/payments";
import { dispatchPush } from "@/lib/server/push";
import { createServiceClient } from "@/lib/supabase/server";
import type { ChannelCalendarInput, ChannelSyncResult } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invalid = (fields: Record<string, string>) => fail(422, "VALIDATION_ERROR", { fields });
// La migración de canales todavía no está aplicada en la base de datos.
const notReady = () => fail(503, "CHANNELS_NOT_READY");

async function respond(req: NextRequest, sb: Db, results?: ChannelSyncResult[]) {
  const channels = await loadChannels(sb, siteUrl(req.nextUrl.origin));
  if (results?.some((r) => r.moved.length || r.conflicts.length)) after(dispatchPush);
  return json({ ...channels, ...(results && { results }) });
}

// GET /api/admin/channels → calendarios de Booking enlazados y sus fechas.
export const GET = route(async (req: NextRequest) => {
  const { sb, error } = await requireAdmin();
  if (error) return error;
  return respond(req, sb);
});

// PUT /api/admin/channels { cabinTypeId, unit, label, importUrl } → enlaza una unidad con un tipo de alojamiento de Booking
// (importUrl vacío la desenlaza). Si cambia el enlace, las fechas del anterior se borran y se lee el nuevo de inmediato.
export const PUT = route(async (req: NextRequest) => {
  const { sb, error } = await requireAdmin();
  if (error) return error;
  const b = await readJson<ChannelCalendarInput>(req);
  if (!b) return fail(400, "INVALID_BODY");
  const { units } = await loadCabinTypes(sb);
  const unit = Number(b.unit);
  if (!units[b.cabinTypeId] || !Number.isInteger(unit) || unit < 1 || unit > units[b.cabinTypeId]!) return fail(400, "INVALID_UNIT");
  const label = String(b.label ?? "").trim();
  const importUrl = String(b.importUrl ?? "").trim() || null;
  if (label.length > 80) return invalid({ label: "Máximo 80 caracteres." });
  if (importUrl && (importUrl.length > 1000 || !validImportUrl(importUrl))) return invalid({ importUrl: "Pega el enlace de exportación del extranet (empieza por https://)." });

  const { data: all, error: e1 } = await sb.from("channel_calendars").select("*");
  if (e1) {
    if (isMissingTable(e1)) return notReady();
    throw e1;
  }
  const current = all.find((c) => c.cabin_type_id === b.cabinTypeId && c.unit === unit);
  const taken = importUrl && all.find((c) => c.import_url === importUrl && c.id !== current?.id);
  if (taken) return invalid({ importUrl: `Ese enlace ya está en otra cabaña (${taken.label || `unidad ${taken.unit}`}).` });

  const changed = (current?.import_url ?? null) !== importUrl;
  const reset = changed ? { last_synced_at: null, sync_started_at: null, last_status: null, last_error: "", last_event_count: 0 } : {};
  const { data: saved } = await sb
    .from("channel_calendars")
    .upsert({ cabin_type_id: b.cabinTypeId, unit, channel: "booking", label, import_url: importUrl, ...reset }, { onConflict: "cabin_type_id,unit,channel" })
    .select("id")
    .single()
    .throwOnError();
  // Las fechas del enlace anterior ya no dicen nada de este (solo la sincronización escribe en channel_stays).
  if (changed && current) await createServiceClient().from("channel_stays").delete().eq("calendar_id", current.id).throwOnError();
  const results = changed && importUrl ? await syncCalendars({ calendarId: saved.id, minAgeMs: 0, notifyErrors: false }) : undefined;
  return respond(req, sb, results);
});

// POST /api/admin/channels { action: "sync" } → lee ahora todos los calendarios enlazados.
// POST /api/admin/channels { action: "rotate", id } → nuevo enlace para Booking (el anterior deja de funcionar).
export const POST = route(async (req: NextRequest) => {
  const { sb, error } = await requireAdmin();
  if (error) return error;
  const b = await readJson<{ action: "sync" } | { action: "rotate"; id: string }>(req);
  if (b?.action === "sync") {
    const { error: e } = await sb.from("channel_calendars").select("id").limit(1);
    if (e) {
      if (isMissingTable(e)) return notReady();
      throw e;
    }
    return respond(req, sb, await syncCalendars({ minAgeMs: 10_000, notifyErrors: false }));
  }
  if (b?.action === "rotate" && UUID.test(String(b.id))) {
    const { data, error: e } = await sb.from("channel_calendars").update({ export_token: newExportToken(), last_fetched_at: null }).eq("id", b.id).select("id");
    if (e) {
      if (isMissingTable(e)) return notReady();
      throw e;
    }
    if (!data.length) return fail(404, "NOT_FOUND");
    return respond(req, sb);
  }
  return fail(400, "INVALID_BODY");
});
