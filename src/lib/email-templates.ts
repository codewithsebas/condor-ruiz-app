// Plantillas de los correos automáticos al huésped: qué correos hay, cuándo salen, qué textos se pueden cambiar y qué
// variables aceptan. Los textos que el equipo cambia viven en la tabla email_templates (panel → Correos); vacío = el
// texto original del correo. Funciones puras: las usan el panel, el servidor y las vistas previas.

export type EmailTemplateKind =
  | "reservation_received"
  | "reservation_confirmed"
  | "balance_paid"
  | "reservation_rescheduled"
  | "reservation_moved"
  | "reservation_cancelled"
  | "reservation_expired"
  | "arrival_reminder";

export type EmailTextKey = "subject" | "preheader" | "title" | "intro" | "closing";
export type EmailTexts = Record<EmailTextKey, string>;
export type EmailTemplate = EmailTexts & { kind: EmailTemplateKind; enabled: boolean; updatedAt: string | null };
// Lo que llega al armar un correo: los textos cambiados de cada uno (los vacíos no cuentan).
export type EmailOverrides = Partial<Record<EmailTemplateKind, Partial<EmailTexts>>>;

export const TEXT_LIMITS: Record<EmailTextKey, number> = { subject: 150, preheader: 200, title: 120, intro: 1500, closing: 1000 };
export const TEXT_LABELS: Record<EmailTextKey, { label: string; hint: string }> = {
  subject: { label: "Asunto", hint: "Lo primero que ve el huésped en su bandeja." },
  preheader: { label: "Vista previa", hint: "La línea gris que sigue al asunto en la bandeja de entrada." },
  title: { label: "Título", hint: "El saludo grande al inicio del correo." },
  intro: { label: "Entrada", hint: "El párrafo bajo el título. Deja una línea en blanco para separar párrafos." },
  closing: { label: "Nota final", hint: "La letra pequeña del final del correo." },
};

// Variables: {nombre}, {codigo}… se reemplazan por los datos de la reserva al enviar.
export const VARIABLES: Record<string, string> = {
  nombre: "Primer nombre del huésped",
  nombre_completo: "Nombre completo",
  codigo: "Código de la reserva",
  cabana: "Cabaña (o cabañas)",
  llegada: "Día de llegada",
  salida: "Día de salida",
  noches: "Noches («2 noches»)",
  total: "Valor total",
  pagado: "Lo pagado",
  saldo: "Saldo pendiente",
  abono: "Abono para confirmar",
};

// Cada correo: nombre, cuándo sale, en qué estado queda la reserva, si se puede apagar (con advertencia) y sus variables.
export const EMAIL_CATALOG: {
  kind: EmailTemplateKind;
  name: string;
  when: string;
  state: string;
  warn?: string; // advertencia al apagarlo
  vars: string[];
}[] = [
  {
    kind: "reservation_received",
    name: "Reserva recibida",
    when: "Al crearse la reserva (en el sitio o en el panel) sin pago.",
    state: "Sin confirmar · pendiente de abono",
    warn: "El huésped no recibirá los datos para pagar el abono.",
    vars: ["nombre", "nombre_completo", "codigo", "cabana", "llegada", "salida", "noches", "total", "abono"],
  },
  {
    kind: "reservation_confirmed",
    name: "Reserva confirmada",
    when: "Al registrarse el abono o el pago total (también en línea o al aprobar un comprobante).",
    state: "Confirmada",
    warn: "El huésped no recibirá la confirmación ni el archivo para su calendario.",
    vars: ["nombre", "nombre_completo", "codigo", "cabana", "llegada", "salida", "noches", "total", "pagado", "saldo"],
  },
  {
    kind: "balance_paid",
    name: "Pago total recibido",
    when: "Al completarse el pago de una reserva ya confirmada.",
    state: "Confirmada o en estadía · pagada",
    vars: ["nombre", "nombre_completo", "codigo", "cabana", "llegada", "salida", "noches", "total", "pagado"],
  },
  {
    kind: "reservation_rescheduled",
    name: "Reserva reprogramada",
    when: "Al cambiar las fechas desde el panel.",
    state: "Reprogramada (o sin confirmar, si no tenía abono)",
    vars: ["nombre", "nombre_completo", "codigo", "cabana", "llegada", "salida", "noches", "total", "pagado", "saldo", "abono"],
  },
  {
    kind: "reservation_moved",
    name: "Fechas movidas (sin abono)",
    when: "Cuando otra reserva paga primero sus fechas y la sin abono se corre a las próximas libres.",
    state: "Sin confirmar · pendiente de abono",
    vars: ["nombre", "nombre_completo", "codigo", "cabana", "llegada", "salida", "noches", "total", "abono"],
  },
  {
    kind: "reservation_cancelled",
    name: "Reserva cancelada",
    when: "Al cancelarse la reserva desde el panel.",
    state: "Cancelada",
    vars: ["nombre", "nombre_completo", "codigo", "cabana", "llegada", "salida", "noches", "pagado"],
  },
  {
    kind: "reservation_expired",
    name: "Reserva vencida",
    when: "Al terminar el día de llegada sin abono.",
    state: "Vencida",
    vars: ["nombre", "nombre_completo", "codigo", "cabana", "llegada", "salida", "noches"],
  },
  {
    kind: "arrival_reminder",
    name: "Recordatorio de llegada",
    when: "Dos días antes de la llegada.",
    state: "Confirmada",
    vars: ["nombre", "nombre_completo", "codigo", "cabana", "llegada", "salida", "noches", "saldo"],
  },
];

export const EMPTY_TEXTS: EmailTexts = { subject: "", preheader: "", title: "", intro: "", closing: "" };

// Variables escritas que el correo no conoce: «{nombr}», «{precio}».
export function unknownVariables(text: string, vars: string[]) {
  return [...text.matchAll(/\{([a-z_]+)\}/gi)].map((m) => m[1]).filter((v) => !vars.includes(v.toLowerCase()));
}

// Reemplaza las variables por sus valores (las desconocidas quedan como están).
export function fillVariables(text: string, values: Record<string, string>) {
  return text.replace(/\{([a-z_]+)\}/gi, (all, k: string) => values[k.toLowerCase()] ?? all);
}

// Errores por campo de una plantilla (largo y variables).
export function invalidTemplate(kind: EmailTemplateKind, t: EmailTexts) {
  const vars = EMAIL_CATALOG.find((e) => e.kind === kind)?.vars ?? [];
  const f: Partial<Record<EmailTextKey, string>> = {};
  for (const k of Object.keys(TEXT_LIMITS) as EmailTextKey[]) {
    const v = t[k];
    if (v.length > TEXT_LIMITS[k]) f[k] = `Máximo ${TEXT_LIMITS[k]} caracteres.`;
    else if (unknownVariables(v, vars).length) f[k] = `Esta variable no existe en este correo: {${unknownVariables(v, vars)[0]}}.`;
  }
  return f;
}

export const isTemplateKind = (k: unknown): k is EmailTemplateKind => EMAIL_CATALOG.some((e) => e.kind === k);

// Filas de email_templates → los textos cambiados de cada correo (para armar los correos).
export function overridesOf(rows: Pick<EmailTemplate, "kind" | EmailTextKey>[]): EmailOverrides {
  const out: EmailOverrides = {};
  for (const r of rows) {
    const t: Partial<EmailTexts> = {};
    for (const k of Object.keys(TEXT_LIMITS) as EmailTextKey[]) if (r[k]?.trim()) t[k] = r[k].trim();
    if (Object.keys(t).length) out[r.kind] = t;
  }
  return out;
}

// El correo que corresponde al estado de la reserva, para reenviarlo desde el panel: sin abono, la reserva recibida;
// confirmada, la confirmación (o el pago total si el saldo se pagó después del abono); cancelada o vencida, su aviso.
// Hospedada y finalizada no tienen. En un grupo se pasan los pagos del grupo (groupMoney).
export function stateEmailKind(r: { status: string; depositPaidAt: string | null; balancePaidAt: string | null }): EmailTemplateKind | null {
  switch (r.status) {
    case "pending_deposit":
      return "reservation_received";
    case "confirmed":
    case "rescheduled":
      return r.depositPaidAt && r.balancePaidAt && r.balancePaidAt > r.depositPaidAt ? "balance_paid" : "reservation_confirmed";
    case "cancelled":
      return "reservation_cancelled";
    case "expired":
      return "reservation_expired";
    default:
      return null;
  }
}
