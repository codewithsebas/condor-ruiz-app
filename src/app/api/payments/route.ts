import type { NextRequest } from "next/server";
import { runDeadlines } from "@/lib/server/db";
import { fail, json, readJson, route } from "@/lib/server/http";
import {
  activeProvider,
  CardError,
  cardSetup,
  createCardTransaction,
  isSandbox,
  newReference,
  parseCardInput,
  payOptions,
  payerReservation,
  simulatorUrl,
} from "@/lib/server/online-payments";
import { originOf, siteUrl } from "@/lib/server/site";
import { createServiceClient } from "@/lib/supabase/server";
import type { OnlinePayInfo, PaymentKind } from "@/lib/types";

// Minutos que vale un intento de pago (después se da por vencido).
const ATTEMPT_MINUTES = 60;

// GET /api/payments?code&email | &k → lo que el huésped puede pagar en línea ahora (con el correo de la reserva o con la
// firma del enlace de pago que compartió el equipo).
export const GET = route(async (req: NextRequest) => {
  const p = req.nextUrl.searchParams;
  const sb = createServiceClient();
  await runDeadlines();
  const found = await payerReservation(sb, p.get("code") ?? "", p.get("email") ?? "", p.get("k") ?? "");
  if (!found) return fail(404, "NOT_FOUND");
  const { lead, group } = found;
  const live = group.filter((r) => r.status !== "cancelled");
  const rows = live.length ? live : group;
  const provider = activeProvider();
  const info: OnlinePayInfo = {
    code: lead.code,
    guestFirstName: lead.guest_full_name.split(" ")[0],
    status: lead.status,
    checkIn: lead.check_in,
    checkOut: lead.check_out,
    cabins: rows.map((r) => r.cabin_type_id),
    total: rows.reduce((s, r) => s + (r.quote as { total: number }).total, 0),
    paid: rows.reduce((s, r) => s + r.paid_amount, 0),
    options: provider ? payOptions(group) : [],
    provider,
    sandbox: provider === "wompi" && isSandbox(),
    card: provider === "wompi" ? await cardSetup() : null,
  };
  return json(info);
});

// POST /api/payments { code, email | k, kind, card: { token, installments }, accepted } → { url, reference }: crea el
// intento por el valor que corresponde (lo calcula el servidor, nunca el navegador), cobra la tarjeta ya tokenizada en
// Wompi y devuelve la página de resultado. Con el simulador no hay tarjeta: devuelve la página del simulador.
export const POST = route(async (req: NextRequest) => {
  const b = await readJson<{
    code?: string;
    email?: string;
    k?: string;
    kind?: PaymentKind;
    card?: { token?: unknown; installments?: unknown };
    accepted?: unknown;
  }>(req);
  if (!b || typeof b.code !== "string") return fail(400, "INVALID_BODY");
  const provider = activeProvider();
  if (!provider) return fail(503, "PAYMENTS_DISABLED");
  const card = provider === "wompi" ? parseCardInput(b.card) : null;
  if (provider === "wompi" && !card) return fail(400, "INVALID_CARD");
  if (card && b.accepted !== true) return fail(400, "TERMS_NOT_ACCEPTED");
  const sb = createServiceClient();
  await runDeadlines();
  const found = await payerReservation(sb, b.code, String(b.email ?? ""), String(b.k ?? ""));
  if (!found) return fail(404, "NOT_FOUND");
  const option = payOptions(found.group).find((o) => o.kind === b.kind);
  if (!option) return fail(409, "NOTHING_TO_PAY");

  const { lead } = found;
  const reference = newReference(lead.code, option.kind);
  const expiresAt = new Date(Date.now() + ATTEMPT_MINUTES * 60_000).toISOString();
  await sb
    .from("online_payments")
    .insert({ reference, reservation_code: lead.code, kind: option.kind, amount: option.amount, provider, expires_at: expiresAt })
    .throwOnError();
  const base = siteUrl(originOf(req));
  if (!card) return json({ url: simulatorUrl(base, reference), reference });

  const payer = {
    email: lead.guest_email,
    fullName: lead.guest_full_name,
    phone: lead.guest_phone,
    docType: lead.guest_doc_type,
    docNumber: lead.guest_doc_number,
  };
  try {
    const tx = await createCardTransaction({ reference, amount: option.amount }, payer, card, base);
    await sb.from("online_payments").update({ tx_id: tx.id, status: "pending" }).eq("reference", reference).eq("status", "initiated").throwOnError();
    return json({ url: tx.resultUrl, reference });
  } catch (e) {
    if (!(e instanceof CardError)) throw e;
    await sb.from("online_payments").update({ status: "error", detail: "Wompi no aceptó la transacción" }).eq("reference", reference).throwOnError();
    return fail(e.message === "CARD_REJECTED" ? 422 : 503, e.message);
  }
});
