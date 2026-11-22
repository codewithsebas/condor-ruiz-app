import { after, type NextRequest } from "next/server";
import { fail, json, readJson, route } from "@/lib/server/http";
import { processOutbox } from "@/lib/server/mailer";
import { activeProvider, settle } from "@/lib/server/online-payments";
import { dispatchPush } from "@/lib/server/push";
import { originOf, siteUrl } from "@/lib/server/site";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/payments/simulate { ref, result } → resultado de un pago simulado (solo sin Wompi y donde el simulador esté
// permitido). Pasa por la misma función de la base de datos que un pago real.
export const POST = route(async (req: NextRequest) => {
  if (activeProvider() !== "simulado") return fail(404, "NOT_FOUND");
  const b = await readJson<{ ref?: string; result?: "approved" | "declined" }>(req);
  if (!b || typeof b.ref !== "string" || (b.result !== "approved" && b.result !== "declined")) return fail(400, "INVALID_BODY");
  const sb = createServiceClient();
  const { data: a } = await sb.from("online_payments").select("*").eq("reference", b.ref).maybeSingle().throwOnError();
  if (!a || a.provider !== "simulado") return fail(404, "NOT_FOUND");
  const result = await settle(sb, a, {
    id: `sim-${a.reference}`,
    reference: a.reference,
    status: b.result,
    amountInCents: a.amount * 100,
    currency: "COP",
    method: "SIMULADO",
    detail: b.result === "declined" ? "Pago rechazado en el simulador" : "",
  });
  if (result.changed) after(() => processOutbox(siteUrl(originOf(req))).then(() => dispatchPush()));
  return json({ ok: true });
});
