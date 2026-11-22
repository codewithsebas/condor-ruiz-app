import { after, type NextRequest } from "next/server";
import { fail, json, route } from "@/lib/server/http";
import { processOutbox } from "@/lib/server/mailer";
import { fetchWompiTransaction, settle } from "@/lib/server/online-payments";
import { dispatchPush } from "@/lib/server/push";
import { originOf, siteUrl } from "@/lib/server/site";
import { createServiceClient } from "@/lib/supabase/server";
import type { OnlinePayStatus } from "@/lib/types";

// GET /api/payments/status?ref&id → estado de un intento. Al volver de Wompi llega el id de la transacción: se consulta a
// Wompi y se registra el resultado aquí mismo (no depende de que el evento ya haya llegado). Conocer la referencia
// (aleatoria) es la prueba de que el intento es de quien pregunta; solo se devuelve su estado y su valor.
export const GET = route(async (req: NextRequest) => {
  const ref = (req.nextUrl.searchParams.get("ref") ?? "").trim();
  const id = (req.nextUrl.searchParams.get("id") ?? "").trim();
  if (!/^[A-Z0-9-]{3,40}-[ATS]-[A-Z0-9]{6}$/.test(ref)) return fail(404, "NOT_FOUND");
  const sb = createServiceClient();
  const { data: a } = await sb.from("online_payments").select("*").eq("reference", ref).maybeSingle().throwOnError();
  if (!a) return fail(404, "NOT_FOUND");

  let current = a;
  if (a.provider === "wompi" && (a.status === "initiated" || a.status === "pending") && (id || a.tx_id)) {
    const tx = await fetchWompiTransaction(id || a.tx_id);
    if (tx && tx.reference === a.reference) {
      const result = await settle(sb, a, tx);
      if (result.changed) after(() => processOutbox(siteUrl(originOf(req))).then(() => dispatchPush()));
      const { data } = await sb.from("online_payments").select("*").eq("reference", ref).single().throwOnError();
      current = data;
    }
  }
  const out: OnlinePayStatus = {
    code: current.reservation_code,
    status: current.status as OnlinePayStatus["status"],
    amount: current.amount,
    kind: current.kind,
    detail: current.status === "declined" || current.status === "error" ? current.detail : "",
  };
  return json(out);
});
