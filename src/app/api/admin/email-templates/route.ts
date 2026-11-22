import type { NextRequest } from "next/server";
import { EMPTY_TEXTS, TEXT_LIMITS, invalidTemplate, isTemplateKind, type EmailTemplate, type EmailTextKey } from "@/lib/email-templates";
import { type Db } from "@/lib/server/db";
import { fail, json, readJson, requireAdmin, requireStaff, route } from "@/lib/server/http";
import { createActorClient } from "@/lib/supabase/server";

// Plantillas de los correos automáticos (panel → Correos): los textos que el equipo cambió y si cada correo está activo.
// Un correo sin fila usa sus textos originales y está activo. Las lee el equipo; las cambia quien edita el contenido.

async function list(sb: Db): Promise<EmailTemplate[]> {
  const { data } = await sb.from("email_templates").select("*").throwOnError();
  return data
    .filter((r) => isTemplateKind(r.kind))
    .map((r) => ({
      kind: r.kind as EmailTemplate["kind"],
      enabled: r.enabled,
      subject: r.subject,
      preheader: r.preheader,
      title: r.title,
      intro: r.intro,
      closing: r.closing,
      updatedAt: r.updated_at,
    }));
}

// GET /api/admin/email-templates → las plantillas guardadas.
export const GET = route(async () => {
  const { sb, error } = await requireStaff();
  if (error) return error;
  return json(await list(sb));
});

// PUT /api/admin/email-templates { kind, enabled, subject, preheader, title, intro, closing } → guarda una plantilla
// (textos vacíos = los originales) y responde con todas.
export const PUT = route(async (req: NextRequest) => {
  const { me, error } = await requireAdmin("content");
  if (error) return error;
  const b = await readJson<Partial<Record<EmailTextKey, unknown>> & { kind?: unknown; enabled?: unknown }>(req);
  if (!b || !isTemplateKind(b.kind) || typeof b.enabled !== "boolean") return fail(400, "INVALID_BODY");
  const texts = { ...EMPTY_TEXTS };
  for (const k of Object.keys(TEXT_LIMITS) as EmailTextKey[]) {
    const v = b[k];
    if (v !== undefined && typeof v !== "string") return fail(400, "INVALID_BODY");
    // El asunto y la vista previa van en una línea; los demás conservan sus saltos (párrafos).
    texts[k] = k === "subject" || k === "preheader" ? (v ?? "").replace(/\s+/g, " ").trim() : (v ?? "").replace(/\r\n/g, "\n").trim();
  }
  const fields = invalidTemplate(b.kind, texts);
  if (Object.keys(fields).length) return fail(422, "VALIDATION_ERROR", { fields });
  const service = await createActorClient(me.id);
  await service
    .from("email_templates")
    .upsert({ kind: b.kind, enabled: b.enabled, ...texts, updated_by: me.id }, { onConflict: "kind" })
    .throwOnError();
  return json(await list(service));
});
