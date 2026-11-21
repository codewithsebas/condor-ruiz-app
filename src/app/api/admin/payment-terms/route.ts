import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { baseVersionOf, fail, json, readJson, requireAdmin, syncRoute } from "@/lib/server/http";
import { loadSiteContent } from "@/lib/server/site";
import { TEXT_LIMITS, mergeTexts } from "@/lib/site";
import type { PaymentTerms } from "@/lib/types";

// PUT /api/admin/payment-terms { depositPct, instructions, key } → abono para confirmar y datos para pagar que ve el huésped.
// Solo administradores (también lo exige la base de datos). El abono aplica a las reservas nuevas y a las que se
// reprogramen; las existentes conservan el de su cotización.
export const PUT = syncRoute(async (req: NextRequest) => {
  const { sb, error } = await requireAdmin("rates");
  if (error) return error;
  const b = await readJson<PaymentTerms>(req);
  if (!b) return fail(400, "INVALID_BODY");

  const depositPct = Number(b.depositPct);
  const instructions = String(b.instructions ?? "").trim();
  const key = b.key === undefined ? undefined : String(b.key).trim();
  const errors: Record<string, string> = {};
  if (!Number.isInteger(depositPct) || depositPct < 1 || depositPct > 100) errors.depositPct = "El abono debe ser un porcentaje entero entre 1 y 100.";
  if (instructions.length > TEXT_LIMITS.instructions) errors.instructions = "Las instrucciones de pago son demasiado largas.";
  if (key !== undefined && key.length > TEXT_LIMITS.paymentKey) errors.key = "La llave es demasiado larga.";
  if (Object.keys(errors).length) return fail(422, "VALIDATION_ERROR", { fields: errors });

  // Los demás textos del sitio se conservan: aquí solo cambian los datos para pagar (sin la llave, se conserva la guardada).
  const { data: current } = await sb.from("site_settings").select("content, version").maybeSingle().throwOnError();
  if (!current) return fail(409, "SITE_NOT_CONFIGURED");
  const base = baseVersionOf(req);
  if (base !== null && current.version !== base) return fail(409, "VERSION_CONFLICT");
  await sb
    .from("site_settings")
    .update({
      deposit_pct: depositPct,
      content: { ...mergeTexts(current.content), payment: { instructions, key: key ?? mergeTexts(current.content).payment.key } },
    })
    .eq("id", true)
    .throwOnError();

  revalidatePath("/", "layout");
  return json(await loadSiteContent(sb));
});
