// Reglas de pago compartidas por el sitio, el panel y el servidor (funciones puras).
// La fuente de verdad son la base de datos y la API: aquí solo se interpreta lo que ya respondieron.
import type { PaymentKind, PaymentStatus, PublicPayment, PublicReservation, Quote } from "./types";

// Minutos que se retienen las fechas mientras se paga el abono (fecha límite de la retención y de la ventana de pago).
export const HOLD_MINUTES = 30;
// Minutos para pagar el saldo después del check-in. La base de datos fija balance_due_at con este mismo valor (1 hora).
export const BALANCE_MINUTES = 60;

type Money = { quote: Quote; paid?: number; depositPaidAt?: string | null };

// Total, lo pagado y lo que falta. Antes del abono, el saldo es el total menos el abono esperado.
export function moneyOf(r: Money) {
  const total = r.quote.total;
  const paid = r.paid ?? 0;
  const due = Math.max(0, total - paid);
  return { total, paid, due, deposit: r.quote.deposit, balance: r.depositPaidAt ? due : r.quote.balance };
}

export const latestPayment = (r: { payments?: PublicPayment[] }, kind: PaymentKind) => r.payments?.find((p) => p.kind === kind) ?? null;
// Último intento para confirmar la reserva (abono o pago total).
export const latestConfirming = (r: { payments?: PublicPayment[] }) => r.payments?.find((p) => p.kind === "deposit" || p.kind === "full") ?? null;

/**
 * Etapa de la reserva para el huésped:
 * awaiting_deposit   fechas retenidas, falta pagar el abono o el total (la reserva aún no está confirmada)
 * deposit_processing la pasarela procesa el pago del abono o del total
 * hold_expired       la retención venció sin abono
 * confirmed          reserva confirmada (si queda saldo, se puede pagar antes de llegar o en la hora siguiente al check-in)
 * balance_due        check-in hecho, corre la hora para pagar el saldo
 * balance_processing la pasarela procesa el pago del saldo (antes o después del check-in)
 * balance_overdue    pasó la hora sin pagar el saldo
 * paid_in_full       en estadía con todo pagado (el equipo ya puede hacer el check-out)
 * completed / cancelled
 */
export type Stage =
  | "awaiting_deposit"
  | "deposit_processing"
  | "hold_expired"
  | "confirmed"
  | "balance_due"
  | "balance_processing"
  | "balance_overdue"
  | "paid_in_full"
  | "completed"
  | "cancelled";

type StageInput = Pick<PublicReservation, "status" | "depositDueAt" | "balancePaidAt" | "balanceDueAt" | "balanceOverdueAt" | "quote" | "paid" | "depositPaidAt" | "payments">;

// `now`: hora del servidor ajustada (ver useServerClock). Un plazo que ya pasó en el reloj se muestra vencido mientras llega la confirmación del servidor.
export function stageOf(r: StageInput, now = Date.now()): Stage {
  const processing = (kind: PaymentKind) => latestPayment(r, kind)?.status === "pending";
  switch (r.status) {
    case "pending_deposit":
      if (latestConfirming(r)?.status === "pending") return "deposit_processing";
      return Date.parse(r.depositDueAt) <= now ? "hold_expired" : "awaiting_deposit";
    case "expired":
      return "hold_expired";
    case "confirmed":
    case "rescheduled":
      return processing("balance") ? "balance_processing" : "confirmed";
    case "checked_in":
      if (r.balancePaidAt || moneyOf(r).due === 0) return "paid_in_full";
      if (processing("balance")) return "balance_processing";
      if (r.balanceOverdueAt || (r.balanceDueAt && Date.parse(r.balanceDueAt) <= now)) return "balance_overdue";
      return "balance_due";
    case "completed":
      return "completed";
    default:
      return "cancelled";
  }
}

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: "info" | "warning" | "success" | "danger" | "neutral" }> = {
  initiated: { label: "Pago iniciado", tone: "info" },
  pending: { label: "Pago en proceso", tone: "warning" },
  approved: { label: "Pago aprobado", tone: "success" },
  declined: { label: "Pago rechazado", tone: "danger" },
  error: { label: "Error en el pago", tone: "danger" },
  expired: { label: "Sin completar", tone: "neutral" },
};

export const METHOD: Record<string, string> = { CARD: "Tarjeta", PSE: "PSE", NEQUI: "Nequi", BANCOLOMBIA_TRANSFER: "Botón Bancolombia", BANCOLOMBIA_QR: "QR Bancolombia", DAVIPLATA: "Daviplata", SIMULADO: "Simulado", MANUAL: "Registrado por el equipo" };
export const methodLabel = (m: string) => METHOD[m] ?? m;

export const kindLabel = (k: PaymentKind) => (k === "deposit" ? "Abono" : k === "full" ? "Pago total" : "Saldo");

// Mensajes de la API al abrir un pago.
export const START_ERRORS: Record<string, string> = {
  HOLD_EXPIRED: "El tiempo para pagar el abono terminó y las fechas se liberaron.",
  BALANCE_DEADLINE_PASSED: "Pasó la hora para pagar el saldo en línea. Acércate a recepción o escríbenos por WhatsApp.",
  PAYMENT_IN_PROGRESS: "Ya tienes un pago en proceso. Espera la respuesta del banco antes de intentar de nuevo.",
  ALREADY_PAID: "Este pago ya está registrado.",
  NOT_PAYABLE: "Esta reserva no admite pagos en su estado actual.",
  PAYMENTS_NOT_CONFIGURED: "Los pagos en línea no están disponibles en este momento. Escríbenos por WhatsApp.",
  NOT_FOUND: "No encontramos la reserva.",
};
