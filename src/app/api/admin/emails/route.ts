import type { NextRequest } from "next/server";
import { stateEmailKind } from "@/lib/email-templates";
import { toEmail } from "@/lib/server/db";
import { fail, json, readJson, requireStaff, route, syncRoute } from "@/lib/server/http";
import { mailConfigured, processOutbox } from "@/lib/server/mailer";
import { originOf, siteUrl } from "@/lib/server/site";
import { createActorClient } from "@/lib/supabase/server";

const KEY = /^(CC|CE|Pasaporte|PPT):[A-Z0-9]{5,15}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body =
  | { action: "send"; clientKey: string; subject: string; message: string; reservationCode?: string | null; requestId: string }
  | { action: "retry"; id: string }
  | { action: "resend"; code: string; requestId: string };

// GET /api/admin/emails → si el envío está configurado (para avisarlo en el panel antes de escribir).
export const GET = route(async () => {
  const { error } = await requireStaff();
  if (error) return error;
  return json({ configured: mailConfigured() });
});

// POST /api/admin/emails
//   { action: "send", clientKey, subject, message, reservationCode?, requestId } → envía un mensaje del equipo al cliente.
//     `requestId` (UUID del intento en el navegador) hace la solicitud idempotente: repetirla nunca envía dos correos.
//   { action: "retry", id } → reintenta ya un correo que falló.
//   { action: "resend", code, requestId } → reenvía a la dirección vigente el correo que corresponde al estado de la
//     reserva (stateEmailKind; en un grupo, el de la principal). Si ese correo está en cola o falló, se reintenta esa
//     misma fila (no salen dos); si no, se encola uno nuevo. Un correo apagado en Correos no se reenvía.
// Responde con el registro del correo (status "sent" o "failed" con el motivo); el resultado queda en la bandeja.
export const POST = syncRoute(async (req: NextRequest) => {
  const { sb, uid, me, error } = await requireStaff();
  if (error) return error;
  const b = await readJson<Body>(req);
  if (!b) return fail(400, "INVALID_BODY");
  const base = siteUrl(originOf(req));
  const service = await createActorClient(me.id);

  if (b.action === "retry") {
    if (!UUID.test(String(b.id))) return fail(400, "INVALID_ID");
    const { data: row } = await sb.from("email_outbox").select("id, status").eq("id", b.id).maybeSingle().throwOnError();
    if (!row) return fail(404, "NOT_FOUND");
    if (row.status !== "sent") await processOutbox(base, { ids: [row.id] });
    const { data } = await service.from("email_outbox").select("*").eq("id", row.id).single().throwOnError();
    return json(toEmail(data));
  }

  if (b.action === "resend") {
    if (typeof b.code !== "string" || !UUID.test(String(b.requestId))) return fail(400, "INVALID_BODY");
    const { data: row } = await sb.from("reservations").select("code, group_code").eq("code", b.code).maybeSingle().throwOnError();
    if (!row) return fail(404, "NOT_FOUND");
    const leadCode = row.group_code ?? row.code;
    const { data: members } = await sb
      .from("reservations")
      .select("code, status, guest_email, deposit_paid_at, balance_paid_at")
      .or(`code.eq.${leadCode},group_code.eq.${leadCode}`)
      .throwOnError();
    const lead = members.find((m) => m.code === leadCode);
    if (!lead) return fail(404, "NOT_FOUND");
    // Los pagos del grupo como en el panel (groupMoney): pagado cuando lo están todas las cabañas activas.
    const active = members.filter((m) => m.code === leadCode || m.status !== "cancelled");
    const kind = stateEmailKind({
      status: lead.status,
      depositPaidAt: active.every((m) => m.deposit_paid_at) ? lead.deposit_paid_at : null,
      balancePaidAt: active.every((m) => m.balance_paid_at) ? lead.balance_paid_at : null,
    });
    if (!kind) return fail(422, "NO_STATE_EMAIL", { fields: { email: "Esta reserva no tiene un correo para su estado." } });
    if (!EMAIL.test(lead.guest_email ?? "")) return fail(422, "NO_EMAIL", { fields: { email: "El huésped no tiene un correo válido." } });
    const { data: template } = await sb.from("email_templates").select("enabled").eq("kind", kind).maybeSingle().throwOnError();
    const disabled = () => fail(422, "EMAIL_DISABLED", { fields: { email: "Este correo está apagado en Correos." } });
    if (template && !template.enabled) return disabled();

    const { data: waiting } = await service
      .from("email_outbox")
      .select("id")
      .eq("reservation_code", leadCode)
      .eq("kind", kind)
      .in("status", ["pending", "failed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .throwOnError();
    let id = waiting[0]?.id;
    if (id) await service.from("email_outbox").update({ to_email: lead.guest_email! }).eq("id", id).throwOnError();
    else {
      const dedupe = `reenvio:${leadCode}:${b.requestId.toLowerCase()}`;
      await service
        .from("email_outbox")
        .upsert(
          { dedupe_key: dedupe, kind, reservation_code: leadCode, to_email: lead.guest_email!, created_by: uid },
          { onConflict: "dedupe_key", ignoreDuplicates: true },
        )
        .throwOnError();
      // El disparador email_outbox_skip_disabled descarta la fila si el correo se apagó mientras tanto.
      const { data: queued } = await service.from("email_outbox").select("id, status").eq("dedupe_key", dedupe).maybeSingle().throwOnError();
      if (!queued) return disabled();
      id = queued.id;
      // Una solicitud repetida devuelve el resultado de la primera.
      if (queued.status === "sent") return json(toEmail((await service.from("email_outbox").select("*").eq("id", id).single().throwOnError()).data));
    }
    await processOutbox(base, { ids: [id] });
    const { data: fresh } = await service.from("email_outbox").select("*").eq("id", id).single().throwOnError();
    return json(toEmail(fresh));
  }

  if (b.action !== "send" || !KEY.test(String(b.clientKey)) || !UUID.test(String(b.requestId))) return fail(400, "INVALID_BODY");
  const subject = String(b.subject ?? "").trim();
  const message = String(b.message ?? "").trim();
  const fields: Record<string, string> = {};
  if (subject.length < 3 || subject.length > 150) fields.subject = "Escribe un asunto de 3 a 150 caracteres.";
  if (message.length < 5 || message.length > 5000) fields.message = "Escribe un mensaje de 5 a 5000 caracteres.";
  if (Object.keys(fields).length) return fail(422, "VALIDATION_ERROR", { fields });

  // El destinatario sale de la última reserva del cliente (nunca del navegador).
  const { data: latest } = await sb
    .from("reservations")
    .select("code, guest_full_name, guest_email")
    .eq("client_key", b.clientKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .throwOnError();
  const client = latest[0];
  if (!client) return fail(404, "CLIENT_NOT_FOUND");
  if (!EMAIL.test(client.guest_email ?? "")) return fail(422, "NO_EMAIL");
  let code: string | null = null;
  if (b.reservationCode) {
    const { data } = await sb.from("reservations").select("code").eq("code", b.reservationCode).eq("client_key", b.clientKey).maybeSingle().throwOnError();
    code = data?.code ?? null;
  }

  const dedupe = `mensaje:${b.requestId.toLowerCase()}`;
  const { data: inserted } = await service
    .from("email_outbox")
    .upsert(
      {
        dedupe_key: dedupe,
        kind: "team_message",
        reservation_code: code,
        to_email: client.guest_email,
        subject,
        payload: { nombre: client.guest_full_name, asunto: subject, mensaje: message, codigo: code, clientKey: b.clientKey },
        created_by: uid,
      },
      { onConflict: "dedupe_key", ignoreDuplicates: true },
    )
    .select("id")
    .throwOnError();
  const { data: row } = await service.from("email_outbox").select("*").eq("dedupe_key", dedupe).single().throwOnError();
  // Una solicitud repetida devuelve el resultado de la primera (si ya salió, no se reenvía).
  if (inserted.length || row.status !== "sent") await processOutbox(base, { ids: [row.id] });
  const { data: fresh } = await service.from("email_outbox").select("*").eq("id", row.id).single().throwOnError();
  return json(toEmail(fresh), inserted.length ? 201 : 200);
});
