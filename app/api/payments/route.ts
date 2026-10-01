import type { NextRequest } from "next/server";
import { runDeadlines } from "@/lib/server/db";
import { fail, json, readJson, route } from "@/lib/server/http";
import { activeProvider, businessError, checkoutUrl, newReference, siteUrl } from "@/lib/server/payments";
import { createServiceClient } from "@/lib/supabase/server";
import type { PaymentKind, PaymentStart } from "@/lib/types";

const CODE = /^[A-Z0-9]{2,5}-[A-Z0-9]{3,8}$/;
const REF = /^[A-Z0-9-]{8,60}$/;

// POST /api/payments { code, email, kind? } o { ref, kind? } → 201 { reference, checkoutUrl, expiresAt, provider }.
// Abre un intento de pago: abono o pago total (fechas retenidas), o saldo (reserva confirmada, antes de llegar o en la hora
// siguiente al check-in). Quien paga se identifica con el código y el correo de la reserva, o con la referencia de un
// intento anterior (reintentar desde la página del pago).
// La base de datos valida el estado y los plazos (start_payment): la interfaz nunca decide si se puede pagar.
export const POST = route(async (req: NextRequest) => {
  const b = await readJson<{ code?: string; email?: string; ref?: string; kind?: PaymentKind }>(req);
  if (!b) return fail(400, "INVALID_BODY");
  const provider = activeProvider();
  if (!provider) return fail(503, "PAYMENTS_NOT_CONFIGURED");

  const sb = createServiceClient();
  let code = "";
  if (b.ref) {
    const ref = String(b.ref).trim().toUpperCase();
    if (!REF.test(ref)) return fail(404, "NOT_FOUND");
    const { data } = await sb.from("payments").select("reservation_code").eq("reference", ref).maybeSingle().throwOnError();
    code = data?.reservation_code ?? "";
  } else {
    code = String(b.code ?? "").trim().toUpperCase();
    if (!CODE.test(code) || !b.email) return fail(404, "NOT_FOUND");
  }
  if (!code) return fail(404, "NOT_FOUND");

  await runDeadlines();
  const { data: r } = await sb.from("reservations").select("*").eq("code", code).maybeSingle().throwOnError();
  // Mismo 404 si el código no existe o el correo no coincide: no revela qué códigos existen.
  if (!r || (!b.ref && r.guest_email.toLowerCase() !== String(b.email).trim().toLowerCase())) return fail(404, "NOT_FOUND");

  const kind: PaymentKind = b.kind === "deposit" || b.kind === "balance" || b.kind === "full" ? b.kind : r.status === "pending_deposit" ? "deposit" : "balance";
  const { data: p, error } = await sb.rpc("start_payment", { p_code: r.code, p_kind: kind, p_provider: provider, p_reference: newReference(r.code, kind) });
  if (error) {
    const known = businessError(error);
    if (known) return fail(known.status, known.error);
    throw error;
  }
  const payer = { email: r.guest_email, fullName: r.guest_full_name, phone: r.guest_phone, docType: r.guest_doc_type, docNumber: r.guest_doc_number };
  const start: PaymentStart = { reference: p.reference, checkoutUrl: checkoutUrl(p, payer, siteUrl(req.nextUrl.origin)), expiresAt: p.expires_at, provider };
  return json(start, 201);
});
