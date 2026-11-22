import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { invalidDecoration } from "@/lib/booking";
import { loadDecorations, type Db } from "@/lib/server/db";
import { baseVersionOf, fail, json, opIdOf, readJson, requireAdmin, staleOrMissing, syncRoute } from "@/lib/server/http";
import { DECORATION_LIMITS, type Decoration } from "@/lib/site";

// Catálogo de decoraciones con costo (panel → Decoraciones). Cada cambio se publica de inmediato en el formulario de
// reserva del sitio y responde con la lista completa en orden, también las ocultas. Cambiar un precio no toca las
// reservas que ya la tienen: guardan el precio acordado.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Input = { id?: unknown; name?: unknown; description?: unknown; price?: unknown; visible?: unknown; order?: unknown };
type Fields = Omit<Decoration, "id">;

const text = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

function parse(b: Input): { fields: Fields } | { errors: Record<string, string> } {
  const fields: Fields = { name: text(b.name), description: text(b.description), price: Number(b.price), visible: b.visible !== false };
  const errors = invalidDecoration(fields);
  return Object.keys(errors).length ? { errors } : { fields };
}

async function done(sb: Db) {
  revalidatePath("/", "layout");
  return json(await loadDecorations(sb));
}

// POST /api/admin/decorations { name, description, price, visible } → crea al final de la lista.
export const POST = syncRoute(async (req: NextRequest) => {
  const { sb, error } = await requireAdmin("rates");
  if (error) return error;
  const b = await readJson<Input>(req);
  if (!b) return fail(400, "INVALID_BODY");
  const p = parse(b);
  if ("errors" in p) return fail(422, "VALIDATION_ERROR", { fields: p.errors });
  const { data: last } = await sb.from("decorations").select("sort").order("sort", { ascending: false }).limit(DECORATION_LIMITS.max).throwOnError();
  if (last.length >= DECORATION_LIMITS.max)
    return fail(422, "VALIDATION_ERROR", { fields: { name: `Puedes tener hasta ${DECORATION_LIMITS.max} decoraciones.` } });
  await sb
    .from("decorations")
    .insert({ ...p.fields, sort: (last[0]?.sort ?? 0) + 1, ...(opIdOf(req) && typeof b.id === "string" && UUID.test(b.id) && { id: b.id }) })
    .throwOnError();
  return done(sb);
});

// PUT /api/admin/decorations { id, name, description, price, visible } → edita (también mostrar u ocultar).
export const PUT = syncRoute(async (req: NextRequest) => {
  const { sb, error } = await requireAdmin("rates");
  if (error) return error;
  const b = await readJson<Input>(req);
  if (!b || typeof b.id !== "string" || !UUID.test(b.id)) return fail(400, "INVALID_BODY");
  const p = parse(b);
  if ("errors" in p) return fail(422, "VALIDATION_ERROR", { fields: p.errors });
  const base = baseVersionOf(req);
  let q = sb.from("decorations").update(p.fields).eq("id", b.id);
  if (base !== null) q = q.eq("version", base);
  const { data } = await q.select("id").throwOnError();
  if (!data.length) return staleOrMissing(sb, "decorations", "id", b.id, base);
  return done(sb);
});

// PATCH /api/admin/decorations { order: [id, …] } → nuevo orden.
export const PATCH = syncRoute(async (req: NextRequest) => {
  const { sb, error } = await requireAdmin("rates");
  if (error) return error;
  const b = await readJson<Input>(req);
  const order = Array.isArray(b?.order) ? b.order.filter((id): id is string => typeof id === "string" && UUID.test(id)) : [];
  if (!order.length || order.length > DECORATION_LIMITS.max) return fail(400, "INVALID_ORDER");
  await Promise.all(
    order.map((id, i) =>
      sb
        .from("decorations")
        .update({ sort: i + 1 })
        .eq("id", id)
        .throwOnError(),
    ),
  );
  return done(sb);
});

// DELETE /api/admin/decorations?id=… → elimina del catálogo (las reservas que la tienen la conservan).
export const DELETE = syncRoute(async (req: NextRequest) => {
  const { sb, error } = await requireAdmin("rates");
  if (error) return error;
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !UUID.test(id)) return fail(400, "INVALID_ID");
  await sb.from("decorations").delete().eq("id", id).throwOnError();
  return done(sb);
});
