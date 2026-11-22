"use client";

// Datos de un pago recibido por el equipo: cuánto (completo, abono u otro valor), cómo (efectivo, transferencia o las dos)
// y una nota. Los usan el registro de pagos de una reserva y la nueva reserva.
import { CheckIcon } from "@/components/ui/icons";
import { cop } from "@/lib/format";
import { PAY_METHODS } from "@/lib/payments";
import type { PayMethod } from "@/lib/types";
import { adminInput } from "@/components/admin/shared";
import { Field, FieldError, MoneyInput } from "@/components/admin/ui";

export type PayChoice = "full" | "deposit" | "custom";
export type PayOption = { value: PayChoice; label: string; hint: string };

// Error de la parte en efectivo de un pago dividido (`amount`: el valor recibido).
export function cashSplitError(method: PayMethod | null, cash: number, amount: number) {
  if (method !== "both" || amount <= 0) return "";
  if (cash <= 0) return "Escribe cuánto recibiste en efectivo.";
  if (cash >= amount) return `Debe ser menos de ${cop(amount)}: el resto es la transferencia.`;
  return "";
}

export function PaymentFields({
  options,
  choice,
  onChoice,
  custom,
  onCustom,
  amountError,
  method,
  onMethod,
  amount,
  cash,
  onCash,
  note,
  onNote,
  tried,
}: {
  options: PayOption[];
  choice: PayChoice;
  onChoice: (c: PayChoice) => void;
  custom: number;
  onCustom: (n: number) => void;
  amountError: string;
  method: PayMethod | null;
  onMethod: (m: PayMethod) => void;
  amount: number; // valor recibido (para el reparto entre efectivo y transferencia)
  cash: number;
  onCash: (n: number) => void;
  note: string;
  onNote: (s: string) => void;
  tried: boolean;
}) {
  return (
    <>
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-1.5 text-[13px] font-semibold text-ink">¿Cuánto pagó?</legend>
        <div className={`grid grid-cols-1 gap-2 ${options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {options.map((o) => {
            const on = choice === o.value;
            return (
              <label
                key={o.value}
                className={`flex cursor-pointer items-start gap-2.5 rounded-[18px] border p-3.5 transition-colors ${on ? "border-ink bg-panel/60" : "border-line-strong hover:bg-panel/40"}`}
              >
                <input
                  type="radio"
                  name="pay-choice"
                  value={o.value}
                  checked={on}
                  onChange={() => onChoice(o.value)}
                  className="mt-0.5 size-4 flex-none accent-[var(--color-ink)]"
                />
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-ink">{o.label}</span>
                  <span className="block text-[13px] text-ink-muted tabular-nums">{o.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
        {choice === "custom" && (
          <Field label="Valor recibido" error={tried ? amountError || undefined : undefined} className="mt-1">
            {(p) => <MoneyInput id={p.id} describedBy={p["aria-describedby"]} invalid={!!p["aria-invalid"]} value={custom} onChange={onCustom} />}
          </Field>
        )}
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-1.5 text-[13px] font-semibold text-ink">¿Cómo pagó?</legend>
        <div className="flex flex-wrap gap-2">
          {PAY_METHODS.map((m) => {
            const on = method === m.value;
            return (
              <label
                key={m.value}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-semibold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ink has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-paper ${on ? "border-ink bg-ink text-paper" : "border-line-strong text-ink hover:bg-panel/60"}`}
              >
                <input type="radio" name="pay-method" value={m.value} checked={on} onChange={() => onMethod(m.value)} className="sr-only" />
                {on && <CheckIcon size={14} />}
                {m.label}
              </label>
            );
          })}
        </div>
        {tried && !method && <FieldError>Elige si pagó en efectivo, por transferencia o con las dos.</FieldError>}
        {method === "both" && (
          <Field
            label="En efectivo"
            hint={cash > 0 && cash < amount ? `Por transferencia: ${cop(amount - cash)}` : "Lo demás queda como transferencia."}
            error={tried ? cashSplitError(method, cash, amount) || undefined : undefined}
            className="mt-1"
          >
            {(p) => <MoneyInput id={p.id} describedBy={p["aria-describedby"]} invalid={!!p["aria-invalid"]} value={cash} onChange={onCash} />}
          </Field>
        )}
      </fieldset>

      <Field label="Nota (opcional)" hint="Queda en el historial de pagos de la reserva.">
        {(p) => (
          <textarea
            {...p}
            rows={2}
            maxLength={200}
            value={note}
            placeholder={
              method === "cash"
                ? "Quién lo recibió, en qué momento…"
                : method === "both"
                  ? "Quién recibió el efectivo; banco y referencia de la transferencia…"
                  : "Banco y referencia: Bancolombia, ref. 4521…"
            }
            onChange={(e) => onNote(e.target.value)}
            className={`${adminInput} resize-y leading-relaxed`}
          />
        )}
      </Field>
    </>
  );
}
