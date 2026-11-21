"use client";

// Los demás huéspedes de una reserva (además del titular): nombre y documento obligatorios; celular, correo y ciudad,
// opcionales y plegados para que el formulario no crezca. Caben las personas de la reserva menos el titular.
// Se usa en Nueva reserva y al editar los huéspedes desde la ficha de la reserva.
import { useState } from "react";
import { CloseIcon, PlusIcon, UsersIcon } from "@/components/ui/icons";
import { plural } from "@/lib/format";
import type { Companion, CompanionDocType } from "@/lib/types";
import { adminInput } from "@/components/admin/shared";
import { Button, Field, FieldError, Segmented } from "@/components/admin/ui";

export const COMPANION_DOCS: { value: CompanionDocType; label: string }[] = [
  { value: "CC", label: "CC" },
  { value: "CE", label: "CE" },
  { value: "Pasaporte", label: "Pasaporte" },
  { value: "PPT", label: "PPT" },
  { value: "TI", label: "TI" },
  { value: "RC", label: "RC" },
];

// Nombre largo del tipo de documento (para leerlo en la ficha).
export const COMPANION_DOC_LABEL: Record<CompanionDocType, string> = {
  CC: "Cédula",
  CE: "Cédula de extranjería",
  Pasaporte: "Pasaporte",
  PPT: "PPT",
  TI: "Tarjeta de identidad",
  RC: "Registro civil",
};

export const emptyCompanion = (): Companion => ({ fullName: "", docType: "CC", docNumber: "", phone: "", email: "", city: "" });

export function CompanionFields({
  list,
  onChange,
  people,
  err,
}: {
  list: Companion[];
  onChange: (list: Companion[]) => void;
  people: number; // personas de la reserva, con el titular
  err: (key: string) => string | undefined;
}) {
  // Con contacto desplegado: los que lo abrieron o ya traen alguno de esos datos.
  const [open, setOpen] = useState<Set<number>>(() => new Set(list.flatMap((c, i) => (c.phone || c.email || c.city ? [i] : []))));
  const cap = Math.max(0, people - 1);
  const set = (i: number, p: Partial<Companion>) => onChange(list.map((c, j) => (j === i ? { ...c, ...p } : c)));
  const remove = (i: number) => {
    onChange(list.filter((_, j) => j !== i));
    setOpen((s) => new Set([...s].filter((j) => j !== i).map((j) => (j > i ? j - 1 : j))));
  };

  return (
    <div className="col-span-2 flex flex-col gap-3">
      {list.map((c, i) => (
        <fieldset key={i} className="grid min-w-0 grid-cols-2 gap-3 rounded-[18px] border border-line p-3">
          <legend className="px-1 text-[13px] font-semibold text-ink">{`Huésped ${i + 2}`}</legend>
          <div className="col-span-2 -mt-2 flex justify-end">
            <Button size="sm" variant="ghost" icon={<CloseIcon size={14} />} onClick={() => remove(i)}>
              Quitar<span className="sr-only">{` al huésped ${i + 2}`}</span>
            </Button>
          </div>
          <Field label="Nombre completo" className="col-span-2" error={err(`companions.${i}.fullName`)}>
            {(p) => (
              <input
                {...p}
                type="text"
                autoComplete="off"
                maxLength={120}
                value={c.fullName}
                onChange={(e) => set(i, { fullName: e.target.value })}
                className={adminInput}
              />
            )}
          </Field>
          <fieldset className="col-span-2 flex min-w-0 flex-col gap-1.5">
            <legend className="mb-1.5 text-[13px] font-semibold text-ink">Tipo de documento</legend>
            <Segmented
              label={`Tipo de documento del huésped ${i + 2}`}
              size="sm"
              value={c.docType}
              onChange={(v) => set(i, { docType: v })}
              options={COMPANION_DOCS}
            />
          </fieldset>
          <Field label="Número de documento" className="col-span-2" error={err(`companions.${i}.docNumber`)}>
            {(p) => (
              <input
                {...p}
                type="text"
                autoComplete="off"
                maxLength={15}
                value={c.docNumber}
                onChange={(e) => set(i, { docNumber: e.target.value.replace(/[^A-Za-z0-9]/g, "") })}
                className={adminInput}
              />
            )}
          </Field>
          {open.has(i) ? (
            <>
              <Field label="Celular (opcional)" error={err(`companions.${i}.phone`)}>
                {(p) => (
                  <input
                    {...p}
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    maxLength={24}
                    value={c.phone}
                    onChange={(e) => set(i, { phone: e.target.value })}
                    placeholder="300 123 4567"
                    className={adminInput}
                  />
                )}
              </Field>
              <Field label="Ciudad (opcional)" error={err(`companions.${i}.city`)}>
                {(p) => (
                  <input
                    {...p}
                    type="text"
                    autoComplete="off"
                    maxLength={80}
                    value={c.city}
                    onChange={(e) => set(i, { city: e.target.value })}
                    className={adminInput}
                  />
                )}
              </Field>
              <Field label="Correo (opcional)" className="col-span-2" error={err(`companions.${i}.email`)}>
                {(p) => (
                  <input
                    {...p}
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    maxLength={160}
                    value={c.email}
                    onChange={(e) => set(i, { email: e.target.value })}
                    className={adminInput}
                  />
                )}
              </Field>
            </>
          ) : (
            <div className="col-span-2">
              <Button size="sm" variant="ghost" icon={<PlusIcon size={14} />} onClick={() => setOpen((s) => new Set(s).add(i))}>
                Celular, correo y ciudad (opcional)
              </Button>
            </div>
          )}
        </fieldset>
      ))}
      <div>
        <Button variant="secondary" icon={<UsersIcon size={14} />} disabled={list.length >= cap} onClick={() => onChange([...list, emptyCompanion()])}>
          Agregar huésped
        </Button>
        <p className="mt-1.5 text-[12.5px] text-ink-muted">
          {cap === 0
            ? "Para agregar más huéspedes, sube el número de personas de la estadía."
            : list.length >= cap
              ? `Ya están todos: ${plural(people, "persona", "personas")} en la reserva.`
              : `Además del titular caben ${plural(cap - list.length, "huésped más", "huéspedes más")}. Nombre y documento obligatorios.`}
        </p>
        {err("companions") && <FieldError>{err("companions")}</FieldError>}
      </div>
    </div>
  );
}
