import type { NextRequest } from "next/server";
import { fail, json, requireStaff, route } from "@/lib/server/http";
import { activeProvider, payLinkUrl } from "@/lib/server/online-payments";
import { originOf, siteUrl } from "@/lib/server/site";

// GET /api/admin/pay-link?code → { url }: enlace de pago en línea de la reserva, para mandarlo al huésped por WhatsApp.
// La firma la calcula el servidor; el enlace no vence (lo que se cobra siempre es lo que falta en ese momento).
export const GET = route(async (req: NextRequest) => {
  const { error } = await requireStaff();
  if (error) return error;
  const code = (req.nextUrl.searchParams.get("code") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{2,5}-[A-Z0-9]{3,8}$/.test(code)) return fail(400, "INVALID_CODE");
  if (!activeProvider()) return fail(503, "PAYMENTS_DISABLED");
  return json({ url: payLinkUrl(siteUrl(originOf(req)), code) });
});
