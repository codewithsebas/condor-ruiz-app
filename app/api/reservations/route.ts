import { after, type NextRequest } from "next/server";
import { computeQuote, depositDueAt, newReservationCode, poolFirst, validateReservation } from "@/lib/booking";
import { addDays, todayISO } from "@/lib/format";
import { claimUnit } from "@/lib/server/beds24-sync";
import { atMost, channelPools, syncSoon } from "@/lib/server/channels";
import { loadOccupancy, loadPricing, runDeadlines, toPublic } from "@/lib/server/db";
import { fail, json, readJson, route } from "@/lib/server/http";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { createServiceClient } from "@/lib/supabase/server";
import type { ReservationInput } from "@/lib/types";

const validation = (fields: Record<string, string>) => fail(422, "VALIDATION_ERROR", { fields });

// POST /api/reservations (cabecera Idempotency-Key) → 201 con las fechas retenidas mientras se paga el abono.
// Todavía no es una reserva confirmada: se confirma solo cuando la pasarela aprueba el abono (POST /api/payments).
// La restricción de exclusión de la base de datos impide que dos personas retengan la misma cabaña en las mismas noches.
export const POST = route(async (req: NextRequest) => {
  const b = await readJson<ReservationInput>(req);
  if (!b) return fail(400, "INVALID_BODY");
  if (b.website) return validation({ website: "Solicitud rechazada." });
  if (!(await verifyTurnstile(b.captchaToken, req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null)))
    return validation({ captchaToken: "No pudimos verificar que no eres un robot. Inténtalo de nuevo." });

  const sb = createServiceClient();
  const idemKey = req.headers.get("idempotency-key")?.slice(0, 100) || null;
  const findByKey = async (key: string) => (await sb.from("reservations").select("*").eq("idempotency_key", key).maybeSingle().throwOnError()).data;
  if (idemKey) {
    const existing = await findByKey(idemKey);
    if (existing) return json(toPublic(existing), 201);
  }

  await runDeadlines();
  const { types, units, seasons } = await loadPricing(sb);
  const fields = validateReservation(b, types, todayISO());
  if (Object.keys(fields).length) return validation(fields);

  const type = types.find((t) => t.id === b.cabinTypeId)!;
  const guests = Number(b.adults) + Number(b.children);
  const row = {
    cabin_type_id: type.id,
    check_in: b.checkIn,
    check_out: b.checkOut,
    adults: Number(b.adults),
    children: Number(b.children),
    pet: { hasPet: !!b.pet?.hasPet, smallBreedConfirmed: !!(b.pet?.hasPet && b.pet.smallBreedConfirmed) },
    decoration: b.decoration?.requested ? { requested: true, occasion: b.decoration.occasion, notes: (b.decoration.notes ?? "").trim() } : { requested: false, occasion: "", notes: "" },
    estimated_arrival: b.estimatedArrival,
    guest_full_name: b.guest.fullName.trim(),
    guest_doc_type: b.guest.docType,
    guest_doc_number: b.guest.docNumber.trim(),
    guest_email: b.guest.email.trim(),
    guest_phone: b.guest.phone.trim(),
    guest_city: b.guest.city.trim(),
    special_requests: (b.specialRequests ?? "").trim(),
    consents: { policies: true, dataProcessing: true, marketing: !!b.consents.marketing },
    quote: computeQuote(type, b.checkIn, b.checkOut, guests, seasons),
    idempotency_key: idemKey,
  };

  // Antes de asignar la cabaña se leen los calendarios de Booking de este tipo si hace más de 90 s que no se leen
  // (máximo 2,5 s de espera: si Booking tarda, se sigue con la última lectura y esta termina en segundo plano).
  const sync = syncSoon({ cabinTypeId: type.id, minAgeMs: 90_000 });
  after(() => sync);
  await atMost(sync, 2500);
  const pools = await channelPools(sb, type.id);

  // La restricción de exclusión en la base de datos resuelve reservas simultáneas:
  // si otra solicitud tomó la unidad, se recalcula y se intenta de nuevo.
  for (let attempt = 0; attempt < 4; attempt++) {
    const occ = await loadOccupancy(sb, b.checkIn, addDays(b.checkOut, -1), type.id);
    const code = newReservationCode();
    // Si la unidad se vende en Booking por Beds24, primero se retiene allá: si Booking ya la vendió, se prueba otra.
    const claim = await claimUnit(occ, {
      units: units[type.id] ?? 0,
      cabinTypeId: type.id,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      // Primero las que no se venden en Booking y luego las de los grupos con más cabañas libres: así cada tipo de
      // Booking conserva una libre el mayor tiempo posible.
      prefer: poolFirst(occ, units[type.id] ?? 0, type.id, b.checkIn, b.checkOut, pools),
      source: "reservation",
      sourceId: code,
      label: `Web ${code}`,
      adults: row.adults,
      children: row.children,
    });
    // Sin Beds24 no se vende una cabaña que también está en Booking: mejor pedir que lo intente en un momento.
    if (!claim.hold) return claim.channelDown ? fail(503, "CHANNEL_UNAVAILABLE") : fail(409, "DATES_UNAVAILABLE");
    const { data, error } = await sb
      .from("reservations")
      .insert({ ...row, code, unit: claim.unit, deposit_due_at: depositDueAt() })
      .select("*")
      .single();
    if (!error) {
      await claim.hold.commit();
      return json(toPublic(data), 201);
    }
    await claim.hold.release();
    if (error.code === "23P01") continue;
    if (error.code === "23505" && idemKey && error.message.includes("idempotency")) {
      const existing = await findByKey(idemKey);
      if (existing) return json(toPublic(existing), 201);
    }
    if (error.code === "23505") continue; // código repetido: se genera otro
    throw error;
  }
  return fail(409, "DATES_UNAVAILABLE");
});
