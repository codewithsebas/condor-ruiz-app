import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { fail, json, readJson, requireAdmin, route } from "@/lib/server/http";
import { loadSiteContent } from "@/lib/server/site";
import { TEXT_LIMITS, mergeTexts } from "@/lib/site";
import type { SiteInput } from "@/lib/types";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const URL_OK = /^https:\/\/[^\s]+$/;

// PUT /api/admin/site { settings, policies, content } → horarios, contacto, RNT, políticas y textos. Regenera todo el sitio.
export const PUT = route(async (req: NextRequest) => {
  const { sb, error } = await requireAdmin();
  if (error) return error;
  const b = await readJson<SiteInput>(req);
  const s = b?.settings;
  if (!b || !s || !Array.isArray(b.policies)) return fail(400, "INVALID_BODY");

  const phones = (Array.isArray(s.phones) ? s.phones : []).map((p) => String(p).trim()).filter(Boolean);
  const whatsapp = String(s.whatsapp ?? "").replace(/\D/g, "");
  const errors: Record<string, string> = {};
  if (!TIME.test(s.checkInStart) || !TIME.test(s.checkInEnd) || s.checkInEnd <= s.checkInStart) errors.checkIn = "La hora final del check-in debe ser posterior a la inicial.";
  if (!TIME.test(s.checkOutTime)) errors.checkOut = "Hora de check-out no válida.";
  if (!phones.length || phones.length > 5 || phones.some((p) => !/^[\d\s()+-]{7,20}$/.test(p))) errors.phones = "Escribe entre 1 y 5 teléfonos (solo números y espacios).";
  if (!/^\d{10,15}$/.test(whatsapp)) errors.whatsapp = "El WhatsApp debe incluir el indicativo del país, por ejemplo 573144001279.";
  if (String(s.rnt ?? "").length > 30) errors.rnt = "El RNT es demasiado largo.";

  const policies = b.policies.map((p, i) => ({ id: String(p.id ?? ""), question: String(p.q ?? "").trim(), answer: String(p.a ?? "").trim(), sort: i + 1 }));
  if (!policies.length || policies.length > 20) errors.policies = "Debe haber entre 1 y 20 políticas.";
  else if (policies.some((p) => !UUID.test(p.id) || !p.question || p.question.length > 120 || !p.answer || p.answer.length > 2000))
    errors.policies = "Cada política necesita un título (máx. 120 caracteres) y un texto (máx. 2000).";
  // Textos: solo las claves conocidas; cada una con su límite. Las redes sociales deben ser enlaces https.
  const t = mergeTexts(b.content);
  const trim = (v: string) => v.trim();
  const texts = {
    hero: { title: trim(t.hero.title), highlight: trim(t.hero.highlight), badge: trim(t.hero.badge), description: trim(t.hero.description) },
    location: { note: trim(t.location.note) },
    payment: { instructions: trim(t.payment.instructions) },
    social: { instagram: trim(t.social.instagram), facebook: trim(t.social.facebook), tiktok: trim(t.social.tiktok) },
  };
  if (!texts.hero.title || texts.hero.title.length > TEXT_LIMITS.title || texts.hero.highlight.length > TEXT_LIMITS.highlight) errors.hero = "El título de la portada es obligatorio (máximo 40 caracteres por línea).";
  if (texts.hero.badge.length > TEXT_LIMITS.badge || texts.hero.description.length > TEXT_LIMITS.description) errors.heroText = "La etiqueta o la descripción de la portada es demasiado larga.";
  if (texts.location.note.length > TEXT_LIMITS.note) errors.location = "La nota de ubicación es demasiado larga.";
  if (texts.payment.instructions.length > TEXT_LIMITS.instructions) errors.payment = "Las instrucciones de pago son demasiado largas.";
  if (Object.values(texts.social).some((u) => u && (!URL_OK.test(u) || u.length > TEXT_LIMITS.url))) errors.social = "Las redes sociales deben ser enlaces completos que empiecen por https://";
  if (Object.keys(errors).length) return fail(422, "VALIDATION_ERROR", { fields: errors });

  await sb
    .from("site_settings")
    .upsert({ id: true, check_in_start: s.checkInStart, check_in_end: s.checkInEnd, check_out_time: s.checkOutTime, phones, whatsapp, rnt: String(s.rnt ?? "").trim(), content: texts })
    .throwOnError();
  // Primero se guardan las políticas y luego se borran las que ya no están: nunca queda la lista vacía.
  await sb.from("site_policies").upsert(policies).throwOnError();
  await sb.from("site_policies").delete().not("id", "in", `(${policies.map((p) => p.id).join(",")})`).throwOnError();

  revalidatePath("/", "layout");
  return json(await loadSiteContent(sb));
});
