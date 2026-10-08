import { timingSafeEqual } from "node:crypto";
import { after, type NextRequest } from "next/server";
import { syncCalendars } from "@/lib/server/channels";
import { fail, json, route } from "@/lib/server/http";
import { dispatchPush } from "@/lib/server/push";

// POST /api/channels/sync (Authorization: Bearer CHANNEL_SYNC_SECRET) → lee los calendarios de Booking enlazados.
// La llama la base de datos cada 5 minutos (pg_cron → request_channel_sync, con el mismo secreto guardado en Vault).
export const POST = route(async (req: NextRequest) => {
  const secret = process.env.CHANNEL_SYNC_SECRET?.trim();
  if (!secret) return fail(503, "NOT_CONFIGURED");
  const given = Buffer.from(req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "");
  const expected = Buffer.from(secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return fail(401, "UNAUTHORIZED");

  const results = await syncCalendars({ minAgeMs: 60_000, notifyErrors: true });
  // Avisos de reacomodos o posibles sobreventas: salen como notificación push después de responder.
  if (results.some((r) => r.moved.length || r.conflicts.length || !r.ok)) after(dispatchPush);
  return json({ results });
});
