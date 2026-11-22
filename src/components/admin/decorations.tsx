"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, EyeIcon, EyeOffIcon, GiftIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { api } from "@/lib/client/api";
import { isMockApi } from "@/lib/config";
import { cop } from "@/lib/format";
import { DECORATION_LIMITS, type Decoration } from "@/lib/site";
import { useAdmin } from "@/components/admin/context";
import { MODULES } from "@/components/admin/routes";
import { adminInput } from "@/components/admin/shared";
import {
  Badge,
  Button,
  Callout,
  Card,
  CardHeader,
  EmptyState,
  Field,
  IconButton,
  Modal,
  ModalPresence,
  MoneyInput,
  Switch,
  enter,
} from "@/components/admin/ui";

// Decoraciones con costo: el catálogo que el huésped elige al reservar en el sitio y el equipo en el panel. Cada cambio
// se publica de inmediato. Cambiar un precio o eliminar una decoración no toca las reservas que ya la tienen.

type Draft = Omit<Decoration, "id"> & { id?: string };
const EMPTY: Draft = { name: "", description: "", price: 0, visible: true };

export function DecorationsView() {
  const { data, setData, ask, toast, onAuthError } = useAdmin();
  const list = data.site.decorations;
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const visible = list.filter((s) => s.visible);
  // Reservas con decoraciones (las de los próximos días primero): para ver de un vistazo que se usan.
  const inUse = data.reservations.filter((r) => r.addons?.length && r.status !== "cancelled" && r.status !== "expired").length;

  const apply = (next: Decoration[]) => setData((d) => ({ ...d, site: { ...d.site, decorations: next } }));
  // Ejecuta una operación y aplica la lista que devuelve el servidor (o deshace el cambio optimista si falla).
  async function run(key: string, call: () => Promise<{ status: number; data: Decoration[] | object | null }>, ok: string, undo?: Decoration[]) {
    setBusy(key);
    try {
      const r = await call();
      if (r.status === 401 || r.status === 403) return onAuthError();
      if (r.status !== 200 || !Array.isArray(r.data)) throw new Error();
      apply(r.data);
      toast(ok);
    } catch {
      if (undo) apply(undo);
      toast("No se pudo guardar el cambio. Inténtalo de nuevo.", "error");
    } finally {
      setBusy(null);
    }
  }

  const move = (i: number, dir: -1 | 1) => {
    const next = [...list];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    apply(next);
    void run(`move-${next[i + dir].id}`, () => api.admin.decorations.reorder(next.map((s) => s.id)), "Orden actualizado", list);
  };
  const toggle = (s: Decoration) => {
    const next = list.map((x) => (x.id === s.id ? { ...x, visible: !x.visible } : x));
    apply(next);
    void run(
      `vis-${s.id}`,
      () => api.admin.decorations.update({ ...s, visible: !s.visible }),
      s.visible ? `«${s.name}» quedó oculta` : `«${s.name}» ya se puede elegir`,
      list,
    );
  };
  const remove = (s: Decoration) =>
    ask({
      title: "Eliminar decoración",
      text: `«${s.name}» dejará de ofrecerse. Las reservas que ya la tienen la conservan con su precio. Si solo quieres quitarla por un tiempo, mejor ocúltala.`,
      okLabel: "Eliminar",
      danger: true,
      done: "Decoración eliminada",
      run: () => api.admin.decorations.remove(s.id),
    });

  return (
    <>
      <header {...enter(0)} className="min-w-0">
        <p className="text-[13px] font-medium text-ink-muted">Extras con costo que se agregan, opcionales, a una reserva</p>
        <h1 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-[-0.025em] text-ink">{MODULES.decoraciones.label}</h1>
      </header>

      <div {...enter(1)}>
        <Callout>
          El huésped las elige al reservar en el sitio y el equipo, en Nueva reserva o en la ficha de una reserva. Su valor se suma al total y{" "}
          <strong>se paga con el saldo</strong>: el abono no cambia. Cada cambio se publica al instante.
          {isMockApi && <strong> En modo simulado se guardan solo en este navegador.</strong>}
        </Callout>
      </div>

      <div {...enter(1.6)}>
        <Card aria-labelledby="dc-title" className="flex flex-col gap-4 p-4 sm:p-5">
          <CardHeader
            id="dc-title"
            icon={<GiftIcon size={18} />}
            title="Decoraciones"
            subtitle={`${list.length} en total · ${visible.length} disponibles${inUse ? ` · ${inUse} ${inUse === 1 ? "reserva la tiene" : "reservas las tienen"}` : ""}`}
            actions={
              <Button
                variant="primary"
                size="sm"
                icon={<PlusIcon size={15} />}
                disabled={list.length >= DECORATION_LIMITS.max}
                onClick={() => setEditing({ ...EMPTY })}
              >
                Nueva decoración
              </Button>
            }
          />
          {list.length ? (
            <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-[18px] bg-canvas/60">
              {list.map((s, i) => (
                <li key={s.id} className={`flex items-center gap-3 px-3 py-2.5 sm:px-4 ${s.visible ? "" : "bg-ink/4"}`}>
                  <span
                    aria-hidden="true"
                    className={`grid size-10 flex-none place-items-center rounded-full bg-warning-soft text-warning ${s.visible ? "" : "opacity-50"}`}
                  >
                    <GiftIcon size={18} />
                  </span>
                  <div className={`min-w-0 flex-1 ${s.visible ? "" : "opacity-60"}`}>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px] font-semibold text-ink">
                      <span className="truncate">{s.name}</span>
                      {!s.visible && <Badge>Oculta</Badge>}
                    </p>
                    {s.description && <p className="truncate text-[12.5px] text-ink-muted">{s.description}</p>}
                  </div>
                  <span className="flex-none text-[14px] font-semibold text-ink tabular-nums">{cop(s.price)}</span>
                  <div className="flex flex-none items-center gap-0.5">
                    <IconButton
                      label={s.visible ? `Ocultar «${s.name}»` : `Mostrar «${s.name}»`}
                      size="sm"
                      disabled={!!busy}
                      onClick={() => toggle(s)}
                      aria-pressed={!s.visible}
                    >
                      {s.visible ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
                    </IconButton>
                    <IconButton label={`Subir «${s.name}»`} size="sm" disabled={!!busy || i === 0} onClick={() => move(i, -1)}>
                      <ArrowUpIcon size={15} />
                    </IconButton>
                    <IconButton label={`Bajar «${s.name}»`} size="sm" disabled={!!busy || i === list.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDownIcon size={15} />
                    </IconButton>
                    <IconButton label={`Editar «${s.name}»`} size="sm" disabled={!!busy} onClick={() => setEditing({ ...s })}>
                      <PencilIcon size={15} />
                    </IconButton>
                    <IconButton label={`Eliminar «${s.name}»`} size="sm" variant="danger-ghost" disabled={!!busy} onClick={() => remove(s)}>
                      <TrashIcon size={15} />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<GiftIcon size={18} />}
              title="Aún no hay decoraciones"
              text="Agrega lo que ofreces para una ocasión especial: pétalos y velas, globos, una torta…"
              action={
                <Button variant="primary" icon={<PlusIcon size={15} />} onClick={() => setEditing({ ...EMPTY })}>
                  Nueva decoración
                </Button>
              }
            />
          )}
        </Card>
      </div>

      <ModalPresence>
        {editing && (
          <DecorationEditor
            draft={editing}
            onClose={() => setEditing(null)}
            onSaved={(next, name, isNew) => {
              apply(next);
              setEditing(null);
              toast(isNew ? `«${name}» agregada` : "Cambios publicados");
            }}
            onAuthError={onAuthError}
          />
        )}
      </ModalPresence>
    </>
  );
}

function DecorationEditor({
  draft,
  onClose,
  onSaved,
  onAuthError,
}: {
  draft: Draft;
  onClose: () => void;
  onSaved: (list: Decoration[], name: string, isNew: boolean) => void;
  onAuthError: () => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const isNew = !d.id;
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));

  async function save() {
    if (!d.name.trim()) return setErrors({ name: "Escribe el nombre de la decoración." });
    setBusy(true);
    setErrors({});
    try {
      const body = { name: d.name, description: d.description, price: d.price, visible: d.visible };
      const r = d.id ? await api.admin.decorations.update({ id: d.id, ...body }) : await api.admin.decorations.create(body);
      if (r.status === 401 || r.status === 403) return onAuthError();
      if (r.status === 200 && Array.isArray(r.data)) return onSaved(r.data, d.name.trim(), isNew);
      const fields = (r.data as { fields?: Record<string, string> } | null)?.fields;
      setErrors(fields ?? { form: "No se pudo guardar. Inténtalo de nuevo." });
    } catch {
      setErrors({ form: "Error de conexión. Inténtalo de nuevo." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="dc-ed-title" initialFocus="[data-autofocus]" className="m-auto w-[calc(100%-32px)] max-w-[560px] rounded-[26px] p-0">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <h2 id="dc-ed-title" className="text-[18px] font-bold tracking-[-0.02em] text-ink">
          {isNew ? "Nueva decoración" : "Editar decoración"}
        </h2>
        <Field label="Nombre" error={errors.name} hint={`${d.name.length}/${DECORATION_LIMITS.name}`}>
          {(p) => (
            <input
              {...p}
              data-autofocus
              type="text"
              maxLength={DECORATION_LIMITS.name}
              value={d.name}
              onChange={(e) => set({ name: e.target.value })}
              className={adminInput}
              placeholder="Ej. Pétalos y velas"
            />
          )}
        </Field>
        <Field label="Descripción (opcional)" error={errors.description} hint={`Lo que incluye. ${d.description.length}/${DECORATION_LIMITS.description}`}>
          {(p) => (
            <textarea
              {...p}
              rows={2}
              maxLength={DECORATION_LIMITS.description}
              value={d.description}
              onChange={(e) => set({ description: e.target.value })}
              className={`${adminInput} resize-y leading-relaxed`}
            />
          )}
        </Field>
        <Field label="Precio por reserva" error={errors.price} hint="Se suma al total de la reserva y se paga con el saldo.">
          {(p) => (
            <MoneyInput id={p.id} value={d.price} onChange={(v) => set({ price: v })} invalid={!!p["aria-invalid"]} describedBy={p["aria-describedby"]} />
          )}
        </Field>
        <Switch
          checked={d.visible}
          onChange={(v) => set({ visible: v })}
          label="Disponible"
          description="Si la apagas, queda guardada pero no se puede elegir en reservas nuevas."
        />
        {errors.form && (
          <Callout tone="error" role="alert">
            {errors.form}
          </Callout>
        )}
      </div>
      <div className="flex flex-col-reverse gap-2 rounded-b-[26px] border-t border-line bg-canvas/70 px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6">
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={busy} icon={<CheckIcon size={14} />} onClick={save}>
          {isNew ? "Agregar decoración" : "Guardar cambios"}
        </Button>
      </div>
    </Modal>
  );
}
