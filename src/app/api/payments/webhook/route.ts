import { after, type NextRequest } from "next/server";
import { fail, json, route } from "@/lib/server/http";
import { processOutbox } from "@/lib/server/mailer";
import { parseWompiEvent, settle } from "@/lib/server/online-payments";
import { dispatchPush } from "@/lib/server/push";
import { originOf, siteUrl } from "@/lib/server/site";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/payments/webhook ← eventos de Wompi (URL de eventos configurada en el panel de Wompi).
// Se valida la firma con WOMPI_EVENTS_SECRET; el registro es idempotente (Wompi reintenta si no recibe 200).
// El correo de confirmación sale después de responder: un fallo del correo nunca hace que Wompi reintente el pago.
export const POST = route(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const tx = parseWompiEvent(body, req.headers.get("x-event-checksum"));
  if (!tx) return fail(401, "INVALID_SIGNATURE");

  const sb = createServiceClient();
  const { data: a } = await sb.from("online_payments").select("reference, amount").eq("reference", tx.reference).maybeSingle().throwOnError();
  // Una referencia que no es nuestra (otro canal del comercio o una prueba de Wompi): se confirma la recepción y se ignora.
  if (!a) return json({ ok: true, ignored: true });
  const result = await settle(sb, a, tx);
  if (result.changed) after(() => processOutbox(siteUrl(originOf(req))).then(() => dispatchPush()));
  return json({ ok: true });
});
