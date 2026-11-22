"use client";

import { useState } from "react";
import { CheckIcon, GiftIcon, PencilIcon, PlusIcon } from "@/components/ui/icons";
import { TRANSITIONS, addonsTotal, withAddons } from "@/lib/booking";
import { api } from "@/lib/client/api";
import { cop } from "@/lib/format";
import type { Reservation, ReservationAddon } from "@/lib/types";
import { useAdmin } from "@/components/admin/context";
import { Panel } from "@/components/admin/board";
import { Button, Callout, FieldError, Modal, ModalPresence } from "@/components/admin/ui";

// Elegir decoraciones con costo para una reserva (Nueva reserva y la ficha). `options`: las del catálogo que se pueden
// elegir más las que la reserva ya tiene (aunque estén ocultas o con otro precio: se conservan con el acordado).
export function AddonPicker({
  options,
  value,
  onChange,
  disabled,
}: {
  options: (ReservationAddon & { description?: string })[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  if (!options.length) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {options.map((d) => {
        const on = value.includes(d.id);
        return (
          <li key={d.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onChange(on ? value.filter((x) => x !== d.id) : [...value, d.id])}
              className={`flex w-full items-center gap-3 rounded-[14px] border px-3 py-2 text-left transition-[background-color,border-color] duration-150 disabled:opacity-60 ${
                on ? "border-ink bg-ink/5" : "border-line bg-panel hover:border-line-strong hover:bg-canvas"
              }`}
            >
              <span
                aria-hidden="true"
                className={`grid size-5 flex-none place-items-center rounded-md border ${on ? "border-ink bg-ink text-panel" : "border-line-strong bg-panel"}`}
              >
                {on && <CheckIcon size={13} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink">{d.name}</span>
                {d.description && <span className="block truncate text-[12px] text-ink-muted">{d.description}</span>}
              </span>
              <span className="flex-none text-[13.5px] font-semibold text-ink tabular-nums">{cop(d.price)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// Lista de solo lectura: «Pétalos y velas · $80.000».
export function AddonList({ addons }: { addons: ReservationAddon[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {addons.map((a) => (
        <li key={a.id} className="flex items-center gap-2 text-[13.5px] text-ink">
          <GiftIcon size={14} className="flex-none text-warning" />
          <span className="min-w-0 flex-1 truncate">{a.name}</span>
          <span className="flex-none font-semibold tabular-nums">{cop(a.price)}</span>
        </li>
      ))}
    </ul>
  );
}

// Ficha de la reserva: sus decoraciones y, si se puede, el botón para cambiarlas. En un grupo, solo en la principal.
export function AddonsCard({ r }: { r: Reservation }) {
  const { data } = useAdmin();
  const [open, setOpen] = useState(false);
  const addons = r.addons ?? [];
  const catalog = data.site.decorations.filter((d) => d.visible);
  const editable = TRANSITIONS.addons.from.includes(r.status) && (!r.groupCode || r.groupCode === r.code);
  if (!addons.length && (!editable || !catalog.length)) return null;
  return (
    <Panel
      id="dt-addons"
      title="Decoraciones"
      subtitle={addons.length ? `${cop(addonsTotal(addons))} incluidos en el total · se pagan con el saldo` : "Extras con costo para la ocasión."}
      action={
        editable && (
          <Button size="sm" icon={addons.length ? <PencilIcon size={14} /> : <PlusIcon size={14} />} onClick={() => setOpen(true)} className="flex-none">
            {addons.length ? "Cambiar" : "Agregar"}
          </Button>
        )
      }
    >
      {addons.length > 0 ? <AddonList addons={addons} /> : <p className="text-[13.5px] text-ink-muted">Sin decoraciones.</p>}
      <ModalPresence>{open && <AddonsDialog r={r} onClose={() => setOpen(false)} />}</ModalPresence>
    </Panel>
  );
}

function AddonsDialog({ r, onClose }: { r: Reservation; onClose: () => void }) {
  const { data, reload, toast, onAuthError } = useAdmin();
  const had = r.addons ?? [];
  // Las que ya tiene (con su precio acordado) y las demás disponibles del catálogo.
  const options = [
    ...had.map((a) => ({ ...a, description: data.site.decorations.find((d) => d.id === a.id)?.description })),
    ...data.site.decorations.filter((d) => d.visible && !had.some((a) => a.id === d.id)),
  ];
  const [ids, setIds] = useState(had.map((a) => a.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const picked = options.filter((o) => ids.includes(o.id));
  const quote = withAddons(r.quote, picked);
  const unchanged = ids.length === had.length && ids.every((id) => had.some((a) => a.id === id));
  const overpaid = quote.total < r.paid;

  async function save() {
    if (busy || unchanged || overpaid) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.admin.action({ code: r.code, action: "addons", addons: ids });
      if (res.status === 401 || res.status === 403) return onAuthError();
      if (res.status !== 200) {
        const d = res.data as { fields?: Record<string, string> } | null;
        return setError(d?.fields?.addons ?? "No se pudo guardar el cambio. Inténtalo de nuevo.");
      }
      await reload();
      toast("Decoraciones actualizadas", "ok");
      onClose();
    } catch {
      setError("Sin conexión con el servidor. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="ad-title" className="m-auto w-[calc(100%-32px)] max-w-[480px] rounded-[26px] p-0">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <span aria-hidden="true" className="grid size-10 flex-none place-items-center rounded-full bg-warning-soft text-warning">
            <GiftIcon size={18} />
          </span>
          <div className="min-w-0 pt-1">
            <h2 id="ad-title" className="text-[18px] font-bold tracking-[-0.02em] text-ink">
              Decoraciones
            </h2>
            <p className="text-[13.5px] text-ink-muted">{`${r.code} · ${r.guest.fullName}`}</p>
          </div>
        </div>
        <AddonPicker options={options} value={ids} onChange={setIds} disabled={busy} />
        <p className="text-[13.5px] text-ink-muted">
          {`Total: ${cop(r.quote.total)} → `}
          <strong className="text-ink">{cop(quote.total)}</strong>
          {` · ya pagado ${cop(r.paid)} · queda por cobrar ${cop(Math.max(0, quote.total - r.paid))}`}
        </p>
        <p className="text-[12.5px] text-ink-muted">El abono no cambia: la decoración se paga con el saldo. El huésped no recibe ningún correo.</p>
        {overpaid && <Callout tone="warning">Ya se pagó más que el nuevo total: no se puede quitar esa decoración.</Callout>}
        {error && <FieldError>{error}</FieldError>}
      </div>
      <div className="flex flex-col-reverse gap-2 rounded-b-[26px] border-t border-line bg-canvas/70 px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6">
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={busy} disabled={unchanged || overpaid} icon={<CheckIcon size={14} />} onClick={save}>
          Guardar cambios
        </Button>
      </div>
    </Modal>
  );
}
