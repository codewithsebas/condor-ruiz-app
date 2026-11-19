"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  BanIcon,
  BathIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  HomeIcon,
  MoonIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  WarningIcon,
  WrenchIcon,
} from "@/components/ui/icons";
import { BLOCK_REASONS, busyBlocks, clashingReservations, unitLabel } from "@/lib/booking";
import { unitMarks } from "@/lib/admin-metrics";
import { api } from "@/lib/client/api";
import { addDays, fmtDate, isISO, nightsBetween, parseISO, plural } from "@/lib/format";
import { can } from "@/lib/permissions";
import type { Block, BlockInput } from "@/lib/types";
import { Combobox } from "@/components/ui/combobox";
import { useAdmin, useParam, useSetParams } from "@/components/admin/context";
import { MODULES } from "@/components/admin/routes";
import { DateRangePicker } from "@/components/admin/date-picker";
import { BathroomsPanel } from "@/components/admin/bathrooms";
import { Paginator, usePaged } from "@/components/admin/paginator";
import { adminInput, norm } from "@/components/admin/shared";
import { ListSearch } from "@/components/admin/list-table";
import { Panel } from "@/components/admin/board";
import { useTip } from "@/components/ui/floating";
import { Badge, Button, Callout, EmptyState, Field, FieldError, IconButton, Modal, ModalPresence, Segmented, enter, type Tone } from "@/components/admin/ui";
import { SyncMark } from "@/components/admin/sync";

type Filter = "vigentes" | "finalizados" | "todos";
type View = "cabanas" | "banos";
type Draft = { id?: string; type: string; unit: string; from: string | null; to: string | null; reason: string; notes: string };

const BG =
  "repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-status-block) 32%, white) 0 5px, color-mix(in srgb, var(--color-status-block) 14%, white) 5px 10px)";

function stateOf(b: Block, today: string): { label: string; tone: Tone; order: number } {
  if (b.to < today) return { label: "Finalizado", tone: "neutral", order: 2 };
  if (b.from <= today) return { label: "En curso", tone: "warning", order: 0 };
  const d = nightsBetween(today, b.from);
  return { label: d === 1 ? "Empieza mañana" : `Empieza en ${d} días`, tone: "info", order: 1 };
}

export function BlocksView() {
  const { data, today, ask, cabinLabel } = useAdmin();
  const params = useSearchParams();
  const setParams = useSetParams();
  const [filter, setFilter] = useParam<Filter>("mostrar", "vigentes");
  const [view, setView] = useParam<View>("ver", "cabanas");
  const [q, setQ] = useParam("q", "");
  const [cabinId, setCabinId] = useParam("cabana-lista", "");
  const canDelete = can(data.me.role, "delete");

  // El editor se abre desde la URL: ?editar=<bloqueo> o ?nuevo=1[&cabana=&unidad=&fecha=] (atajo desde el calendario).
  const editId = params.get("editar");
  const isNew = params.has("nuevo");
  const draftFromUrl = (): Draft | null => {
    if (isNew) {
      const type = params.get("cabana");
      const cabin = data.cabinTypes.find((c) => c.id === type && c.units > 0) ?? data.cabinTypes.find((c) => c.units > 0);
      const unit = Number(params.get("unidad"));
      const date = params.get("fecha");
      const valid = isISO(date) && date >= today;
      return {
        type: cabin?.id ?? "",
        unit: cabin && unit >= 1 && unit <= cabin.units ? String(unit) : "1",
        from: valid ? date : null,
        to: valid ? date : null,
        reason: "Mantenimiento",
        notes: "",
      };
    }
    const b = editId ? data.blocks.find((x) => x.id === editId) : null;
    return b ? { id: b.id, type: b.cabinTypeId, unit: String(b.unit), from: b.from, to: b.to, reason: b.reason, notes: b.notes } : null;
  };
  const editing = draftFromUrl();
  const openNew = () => setParams({ nuevo: "1", editar: null });
  const close = () => setParams({ nuevo: null, editar: null, cabana: null, unidad: null, fecha: null });

  const sorted = useMemo(
    () => [...data.blocks].sort((a, b) => stateOf(a, today).order - stateOf(b, today).order || (a.from < b.from ? -1 : 1)),
    [data.blocks, today],
  );
  const nq = norm(q.trim());
  const list = sorted.filter(
    (b) =>
      (filter === "todos" || (filter === "finalizados" ? b.to < today : b.to >= today)) &&
      (!cabinId || b.cabinTypeId === cabinId) &&
      (!nq || norm(`${cabinLabel(b.cabinTypeId, b.unit)} ${b.reason} ${b.notes}`).includes(nq)),
  );
  const paged = usePaged(list, "bloqueos", [filter, nq, cabinId].join("|"));
  const baths = data.bathrooms ?? [];
  const bathBlocksToday = (data.bathroomBlocks ?? []).filter((k) => k.from <= today && today <= k.to);
  const inCourse = data.blocks.filter((b) => b.from <= today && b.to >= today).length;
  const next30 = addDays(today, 30);
  const upcoming = data.blocks.filter((b) => b.from > today && b.from <= next30).length;
  let nights = 0;
  for (const b of data.blocks) {
    const a = b.from > today ? b.from : today;
    const z = b.to < next30 ? b.to : next30;
    if (z >= a) nights += nightsBetween(a, z) + 1;
  }

  const remove = (b: Block) =>
    ask({
      title: "Eliminar bloqueo",
      text: `Las fechas de ${cabinLabel(b.cabinTypeId, b.unit)} quedarán disponibles para reservar en el sitio.`,
      details: [
        { k: "Fechas", v: `${fmtDate(b.from, true)} → ${fmtDate(b.to, true)}` },
        { k: "Motivo", v: b.notes ? `${b.reason} · ${b.notes}` : b.reason },
      ],
      okLabel: "Eliminar bloqueo",
      danger: true,
      done: "Bloqueo eliminado",
      run: async () => {
        const r = await api.admin.deleteBlock(b.id);
        if (r.status < 400) close();
        return r;
      },
    });

  const units = data.cabinTypes.reduce((n, c) => n + c.units, 0);
  const share = units ? Math.round((nights / (units * 30)) * 100) : 0;
  const closedNow = data.blocks.filter((b) => b.from <= today && b.to >= today);
  const bathsOut = baths.filter((b) => b.status !== "available").length;
  const counts = {
    vigentes: data.blocks.filter((b) => b.to >= today).length,
    finalizados: data.blocks.filter((b) => b.to < today).length,
    todos: data.blocks.length,
  };
  const edit = (b: Block) => setParams({ editar: b.id, nuevo: null });

  return (
    <>
      <header {...enter(0)} className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-muted">
            {view === "banos"
              ? "Estado de cada baño y fechas en que no se puede usar; la cabaña se sigue pudiendo reservar"
              : "Fechas cerradas por mantenimiento, uso propio u otros motivos; no se pueden reservar en el sitio"}
          </p>
          <h1 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-[-0.025em] text-ink">{MODULES.bloqueos.label}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Qué bloquear"
            value={view === "banos" ? "banos" : "cabanas"}
            onChange={setView}
            options={[
              { value: "cabanas", label: "Cabañas", icon: <HomeIcon size={14} />, count: inCourse },
              { value: "banos", label: "Baños", icon: <BathIcon size={14} />, count: bathsOut + bathBlocksToday.length },
            ]}
          />
          {view === "cabanas" && (
            <Button variant="primary" icon={<PlusIcon size={14} />} onClick={openNew}>
              Nuevo bloqueo
            </Button>
          )}
        </div>
      </header>

      {view === "banos" ? (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div {...enter(1)} className="min-w-0 xl:col-span-5">
              <Hero
                icon={<BathIcon size={16} />}
                label="Baños en servicio"
                value={`${baths.length - bathsOut}`}
                of={`de ${baths.length}`}
                note={
                  !baths.length
                    ? "Aún no hay baños registrados"
                    : bathsOut
                      ? plural(bathsOut, "baño con aviso en su cabaña", "baños con aviso en sus cabañas")
                      : "Todos los baños están disponibles"
                }
              />
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-7">
              <Tile order={1.5} icon={<WrenchIcon size={15} />} label="En mantenimiento o fuera" value={bathsOut} hint="con aviso en sus cabañas" />
              <Tile order={2} icon={<BanIcon size={15} />} label="Bloqueados hoy" value={bathBlocksToday.length} hint="por fechas" />
            </div>
          </div>
          <BathroomsPanel />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div {...enter(1)} className="min-w-0 xl:col-span-5">
              <Hero
                icon={<BanIcon size={16} />}
                label="Cerradas hoy"
                value={String(inCourse)}
                of={`de ${plural(units, "cabaña", "cabañas")}`}
                note={inCourse ? "No se pueden reservar mientras dure el bloqueo" : "Todas las cabañas están abiertas"}
              >
                {closedNow.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {closedNow.map((b) => (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() => edit(b)}
                          className="rounded-full bg-paper/10 px-3 py-1 text-[12px] font-medium text-paper transition-colors hover:bg-paper/20"
                        >
                          {`${cabinLabel(b.cabinTypeId, b.unit)} · hasta ${fmtDate(b.to)}`}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Hero>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3 xl:col-span-7">
              <Tile order={1.5} icon={<CalendarIcon size={15} />} label="Próximos 30 días" value={upcoming} hint="bloqueos programados" />
              <Tile order={2} icon={<MoonIcon size={15} />} label="Noches bloqueadas" value={nights} hint="en los próximos 30 días" />
              <Tile
                order={2.5}
                icon={<HomeIcon size={15} />}
                label="Capacidad cerrada"
                value={`${share} %`}
                hint="de las noches de los próximos 30 días"
                meter={share}
              />
            </div>
          </div>

          <div {...enter(3)}>
            <Timeline onEdit={edit} />
          </div>

          <div role="search" aria-label="Filtrar bloqueos" className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:max-w-[320px] sm:flex-1">
              <ListSearch id="bl-q" label="Buscar bloqueos" value={q} onChange={setQ} placeholder="Cabaña, motivo o nota" />
            </div>
            <div className="w-full sm:w-[210px]">
              <Combobox
                value={cabinId}
                onChange={setCabinId}
                options={[{ value: "", label: "Todas las cabañas" }, ...data.cabinTypes.map((c) => ({ value: c.id, label: c.nombre }))]}
                icon={<HomeIcon size={14} className="text-ink-muted" />}
              />
            </div>
            <Segmented
              label="Mostrar"
              value={filter}
              onChange={setFilter}
              className="sm:ml-auto"
              options={[
                { value: "vigentes", label: "Vigentes", count: counts.vigentes },
                { value: "finalizados", label: "Finalizados", count: counts.finalizados },
                { value: "todos", label: "Todos", count: counts.todos },
              ]}
            />
          </div>

          {list.length ? (
            <>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {paged.rows.map((b) => {
                  const st = stateOf(b, today);
                  const days = nightsBetween(b.from, b.to) + 1;
                  return (
                    <li
                      key={b.id}
                      className={`flex min-w-0 flex-col rounded-[22px] bg-paper ring-1 ring-inset ${st.order === 0 ? "ring-warning/40" : "ring-line"} ${st.order === 2 ? "opacity-70" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => edit(b)}
                        className="flex min-w-0 flex-col gap-3 rounded-t-[22px] p-5 text-left transition-colors hover:bg-panel/60"
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2.5">
                            <span aria-hidden="true" className="size-9 flex-none rounded-full ring-1 ring-line" style={{ background: BG }} />
                            <span className="min-w-0">
                              <span className="flex items-center gap-2 truncate text-[14.5px] font-semibold text-ink">
                                {cabinLabel(b.cabinTypeId, b.unit)}
                                <SyncMark entity={`blocks:${b.id}`} />
                              </span>
                              <span className="block truncate text-[12px] text-ink-muted">{b.reason}</span>
                            </span>
                          </span>
                          <Badge tone={st.tone} icon={st.order === 0 ? <ClockIcon size={11} /> : undefined}>
                            {st.label}
                          </Badge>
                        </span>
                        <span className="flex items-center gap-3 rounded-[14px] bg-panel px-3.5 py-2.5 text-[13px] ring-1 ring-line ring-inset">
                          <span className="min-w-0 flex-1">
                            <span className="block text-[11px] text-ink-muted">Desde</span>
                            <span className="block font-semibold text-ink">{fmtDate(b.from)}</span>
                          </span>
                          <span aria-hidden="true" className="text-ink-subtle">
                            →
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[11px] text-ink-muted">Hasta</span>
                            <span className="block font-semibold text-ink">{fmtDate(b.to)}</span>
                          </span>
                          <span className="flex-none rounded-full bg-paper px-2.5 py-0.5 text-[12px] font-semibold text-ink ring-1 ring-line">
                            {plural(days, "día", "días")}
                          </span>
                        </span>
                        {b.notes && <span className="line-clamp-2 text-[12.5px] text-ink-muted">{b.notes}</span>}
                      </button>
                      <div className="mt-auto flex items-center justify-end gap-1 border-t border-line px-3 py-2">
                        <Button size="sm" variant="ghost" icon={<PencilIcon size={13} />} onClick={() => edit(b)} className="mr-auto">
                          Editar
                        </Button>
                        {canDelete && (
                          <IconButton
                            label={`Eliminar bloqueo de ${cabinLabel(b.cabinTypeId, b.unit)}`}
                            size="sm"
                            variant="danger-ghost"
                            data-gesture="cancel"
                            onClick={() => remove(b)}
                          >
                            <TrashIcon size={15} />
                          </IconButton>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Paginator p={paged} noun="bloqueos" className="rounded-[18px] bg-paper px-4 py-3 ring-1 ring-line" />
            </>
          ) : (
            <Panel id="bl-empty" title="Bloqueos">
              <EmptyState
                icon={<CalendarIcon size={18} />}
                title={
                  filter === "finalizados" ? "No hay bloqueos finalizados" : nq || cabinId ? "No hay bloqueos con esos filtros" : "No hay fechas bloqueadas"
                }
                text={
                  filter === "finalizados" || nq || cabinId
                    ? undefined
                    : "Bloquea fechas por mantenimiento o uso propio. También puedes hacerlo desde el calendario, con un clic en un día libre."
                }
                action={
                  filter !== "finalizados" && !nq && !cabinId ? (
                    <Button icon={<PlusIcon size={14} />} onClick={openNew}>
                      Nuevo bloqueo
                    </Button>
                  ) : undefined
                }
              />
            </Panel>
          )}
        </>
      )}

      <ModalPresence>
        {editing && (
          <BlockEditor
            key={editing.id ?? `nuevo-${params.toString()}`}
            initial={editing}
            onClose={close}
            onDelete={editing.id && canDelete ? () => remove(data.blocks.find((b) => b.id === editing.id)!) : undefined}
          />
        )}
      </ModalPresence>
    </>
  );
}

/* ───────────── Resumen ───────────── */

// Tarjeta oscura con la cifra principal (cabañas cerradas hoy o baños en servicio).
function Hero({ icon, label, value, of, note, children }: { icon: ReactNode; label: string; value: string; of: string; note: string; children?: ReactNode }) {
  return (
    <section aria-label={label} className="flex h-full flex-col gap-4 rounded-[22px] bg-ink p-6 text-paper">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[13px] font-medium text-paper/70">{label}</h2>
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-paper/10">
          {icon}
        </span>
      </div>
      <p className="flex items-baseline gap-2">
        <span className="text-[56px] leading-none font-semibold tracking-[-0.04em]">{value}</span>
        <span className="text-[15px] text-paper/60">{of}</span>
      </p>
      <p className="text-[12.5px] text-paper/60">{note}</p>
      {children && <div className="mt-auto">{children}</div>}
    </section>
  );
}

function Tile({ order, icon, label, value, hint, meter }: { order: number; icon: ReactNode; label: string; value: ReactNode; hint: string; meter?: number }) {
  return (
    <section {...enter(order)} aria-label={label} className="flex min-w-0 flex-col gap-3 rounded-[22px] bg-paper p-5 ring-1 ring-line ring-inset">
      <span className="flex items-center gap-2 text-[12.5px] font-medium text-ink-muted">
        <span aria-hidden="true" className="grid size-7 flex-none place-items-center rounded-full bg-panel text-ink ring-1 ring-line">
          {icon}
        </span>
        {label}
      </span>
      <p className="text-[28px] leading-none font-semibold tracking-[-0.03em] text-ink">{value}</p>
      {meter !== undefined && (
        <span
          aria-hidden="true"
          className="block h-1.5 overflow-hidden rounded-full"
          style={{ background: "color-mix(in srgb, var(--color-chart-a) 18%, transparent)" }}
        >
          <span className="block h-full rounded-full" style={{ width: `${Math.min(100, meter)}%`, background: "var(--color-chart-a)" }} />
        </span>
      )}
      <p className="mt-auto text-[12px] text-ink-subtle">{hint}</p>
    </section>
  );
}

/* ───────────── Línea de tiempo ───────────── */

const SPAN = 30;

// Los próximos 30 días por cabaña: cada bloqueo es una barra rayada; un clic la abre para editarla.
function Timeline({ onEdit }: { onEdit: (b: Block) => void }) {
  const { data, today, cabinLabel } = useAdmin();
  const tip = useTip();
  const end = addDays(today, SPAN - 1);
  const types = data.cabinTypes.filter((c) => c.units > 0);
  const any = data.blocks.some((b) => b.to >= today && b.from <= end);
  const days = Array.from({ length: SPAN }, (_, i) => addDays(today, i));
  const pos = (d: string) => (Math.max(0, Math.min(SPAN, nightsBetween(today, d))) / SPAN) * 100;
  return (
    <Panel id="bl-timeline" title="Próximos 30 días" subtitle="Cada barra es un bloqueo; haz clic para editarlo">
      <div className="-mx-5 overflow-x-auto px-5">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[150px_minmax(0,1fr)] items-end gap-3 pb-2">
            <span />
            <div aria-hidden="true" className="flex">
              {days.map((d, i) => {
                const date = parseISO(d);
                const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
                return (
                  <span
                    key={d}
                    className={`flex-1 text-center text-[10.5px] tabular-nums ${i === 0 ? "font-semibold text-ink" : weekend ? "text-ink" : "text-ink-subtle"}`}
                  >
                    {i === 0 ? "Hoy" : i % 2 === 0 ? date.getUTCDate() : ""}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {types.map((c) => (
              <div key={c.id} role="group" aria-label={c.nombre} className="flex flex-col gap-1.5">
                <p className="text-[11.5px] font-medium text-ink-subtle">{c.nombre}</p>
                <ul className="flex flex-col gap-1.5">
                  {Array.from({ length: c.units }, (_, i) => ({ type: c.id, unit: i + 1, label: cabinLabel(c.id, i + 1) })).map((r) => {
                    const own = data.blocks.filter((b) => b.cabinTypeId === r.type && b.unit === r.unit && b.to >= today && b.from <= end);
                    return (
                      <li key={`${r.type}:${r.unit}`} className="grid grid-cols-[150px_minmax(0,1fr)] items-center gap-3">
                        <span className="truncate text-[12.5px] font-medium text-ink">{r.label}</span>
                        <div className="relative h-8 rounded-full bg-panel ring-1 ring-line ring-inset">
                          {own.map((b) => {
                            const left = pos(b.from);
                            const right = pos(addDays(b.to, 1));
                            return (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => onEdit(b)}
                                aria-label={`${r.label}: ${b.reason}, ${fmtDate(b.from)} a ${fmtDate(b.to)}`}
                                {...tip(() => (
                                  <span>
                                    <strong>{b.reason}</strong> · {fmtDate(b.from)} → {fmtDate(b.to)}
                                  </span>
                                ))}
                                className="absolute inset-y-1 flex items-center overflow-hidden rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap text-ink ring-1 ring-ink/15 transition-[filter] hover:brightness-95"
                                style={{ left: `${left}%`, width: `calc(${right - left}% - 2px)`, background: BG }}
                              >
                                {right - left > 12 ? b.reason : ""}
                              </button>
                            );
                          })}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {!any && <p className="mt-3 text-[12.5px] text-ink-muted">No hay fechas bloqueadas en los próximos 30 días: todas las cabañas están abiertas.</p>}
        </div>
      </div>
    </Panel>
  );
}

/* ───────────── Crear / editar ───────────── */

function BlockEditor({ initial, onClose, onDelete }: { initial: Draft; onClose: () => void; onDelete?: () => void }) {
  const { data, setData, toast, today, cabinLabel, onAuthError } = useAdmin();
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tried, setTried] = useState(false);
  const cabin = data.cabinTypes.find((c) => c.id === d.type);
  const units = cabin?.units ?? 0;
  const unitList = d.unit === "all" ? Array.from({ length: units }, (_, i) => i + 1) : [Number(d.unit)];
  const set = (p: Partial<Draft>) => {
    setD((x) => ({ ...x, ...p }));
    setError("");
  };

  // Choques en vivo: reservas activas y otros bloqueos en las unidades y fechas elegidas.
  const clashes = d.from && d.to ? unitList.flatMap((u) => clashingReservations(data.reservations, d.type, u, d.from!, d.to!)) : [];
  const overlaps =
    d.from && d.to
      ? busyBlocks(data).filter((b) => b.id !== d.id && b.cabinTypeId === d.type && unitList.includes(b.unit) && b.from <= d.to! && d.from! <= b.to)
      : [];
  const marks = useMemo(
    () => unitMarks(data.reservations, busyBlocks(data), d.type, d.unit === "all" ? "all" : Number(d.unit), today, addDays(today, 400), d.id),
    [data, d.type, d.unit, today, d.id],
  );

  const errs = {
    dates: !d.from || !d.to ? "Elige el primer y el último día del bloqueo." : "",
    notes: d.reason === "Otro" && !d.notes.trim() ? "Describe el motivo." : d.notes.length > 500 ? "Máximo 500 caracteres." : "",
  };
  const blocked = !!(errs.dates || errs.notes || clashes.length || overlaps.length);

  async function save() {
    setTried(true);
    if (blocked || busy) return;
    setBusy(true);
    const body: BlockInput = {
      cabinTypeId: d.type,
      unit: d.unit === "all" ? "all" : Number(d.unit),
      from: d.from!,
      to: d.to!,
      reason: d.reason,
      notes: d.notes.trim(),
    };
    try {
      const r = d.id ? await api.admin.updateBlock({ ...body, id: d.id }) : await api.admin.addBlock(body);
      if (r.status === 401 || r.status === 403) return onAuthError();
      if (r.status !== 200 || !Array.isArray(r.data)) {
        const err = r.data as unknown as { error?: string; conflicts?: string[] } | null;
        setError(
          err?.error === "RESERVATION_CONFLICT"
            ? `Hay reservas activas en esas fechas (${err.conflicts?.join(", ")}). Reprográmalas o elige otras fechas.`
            : err?.error === "BLOCK_OVERLAP"
              ? "Ya existe un bloqueo que se cruza con estas fechas."
              : "No se pudo guardar el bloqueo. Inténtalo de nuevo.",
        );
        return;
      }
      const blocks = r.data;
      setData((x) => ({ ...x, blocks }));
      toast(d.id ? "Bloqueo actualizado" : unitList.length > 1 ? `Fechas bloqueadas en ${plural(unitList.length, "unidad", "unidades")}` : "Fechas bloqueadas");
      onClose();
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const days = d.from && d.to ? nightsBetween(d.from, d.to) + 1 : 0;
  const cabins = data.cabinTypes.filter((c) => c.units > 0);

  return (
    <Modal onClose={onClose} labelledBy="bk-title" initialFocus="#bk-dates" className="m-auto w-[calc(100%-32px)] max-w-[540px] rounded-[26px] p-0">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <span aria-hidden="true" className="grid size-10 flex-none place-items-center rounded-full text-ink" style={{ background: BG }}>
            <BanIcon size={18} />
          </span>
          <div className="pt-1">
            <h2 id="bk-title" className="text-[18px] font-bold tracking-[-0.02em] text-ink">
              {d.id ? "Editar bloqueo" : "Nuevo bloqueo"}
            </h2>
            <p className="text-[13.5px] text-ink-muted">Las fechas bloqueadas no se pueden reservar en el sitio.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cabaña" className="col-span-2 sm:col-span-1">
            {(p) => (
              <Combobox
                id={p.id}
                value={d.type}
                onChange={(v) => set({ type: v, unit: "1" })}
                options={cabins.map((c) => ({ value: c.id, label: c.nombre, description: plural(c.units, "unidad", "unidades") }))}
              />
            )}
          </Field>
          <Field label="Unidad" className="col-span-2 sm:col-span-1">
            {(p) => (
              <Combobox
                id={p.id}
                value={d.unit}
                onChange={(v) => set({ unit: v })}
                options={[
                  ...Array.from({ length: units }, (_, i) => ({ value: String(i + 1), label: `Cabaña ${unitLabel(cabin, i + 1)}` })),
                  ...(!d.id && units > 1 ? [{ value: "all", label: "Todas las unidades", description: "Cierra este tipo de cabaña completo" }] : []),
                ]}
              />
            )}
          </Field>
          <Field
            label="Fechas (el último día queda incluido)"
            className="col-span-2"
            error={tried ? errs.dates : undefined}
            hint="Los días marcados ya tienen una reserva (punto) o un bloqueo (rayado)."
          >
            {(p) => (
              <DateRangePicker
                id="bk-dates"
                describedBy={p["aria-describedby"]}
                invalid={!!p["aria-invalid"]}
                mode="days"
                from={d.from}
                to={d.to}
                min={d.id ? undefined : today}
                marks={marks}
                legend
                onChange={(from, to) => set({ from, to })}
              />
            )}
          </Field>
        </div>

        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-1.5 text-[13px] font-semibold text-ink">Motivo</legend>
          <Segmented label="Motivo" value={d.reason} onChange={(v) => set({ reason: v })} options={BLOCK_REASONS.map((r) => ({ value: r, label: r }))} />
        </fieldset>
        <Field
          label={d.reason === "Otro" ? "Descripción" : "Descripción (opcional)"}
          error={tried ? errs.notes : undefined}
          hint="Solo la ve el equipo. Ej. pintura del baño, visita familiar."
        >
          {(p) => (
            <textarea {...p} rows={2} maxLength={500} value={d.notes} onChange={(e) => set({ notes: e.target.value })} className={`${adminInput} resize-y`} />
          )}
        </Field>

        {d.from &&
          d.to &&
          (clashes.length || overlaps.length ? (
            <Callout tone="error" role="alert">
              {clashes.length > 0 && (
                <p>
                  <strong>Choca con {plural(clashes.length, "reserva activa", "reservas activas")}:</strong>{" "}
                  {clashes.map((c) => `${c.code} (${fmtDate(c.checkIn)} → ${fmtDate(c.checkOut)})`).join(", ")}. Reprográmala o elige otras fechas.
                </p>
              )}
              {overlaps.length > 0 && (
                <p>
                  Se cruza con otro bloqueo ({overlaps.map((b) => `${cabinLabel(b.cabinTypeId, b.unit)}: ${fmtDate(b.from)} → ${fmtDate(b.to)}`).join(", ")}).
                </p>
              )}
            </Callout>
          ) : (
            <Callout tone="success">
              <span className="font-semibold">Sin conflictos.</span> Se bloquearán {plural(days, "día", "días")} en{" "}
              {d.unit === "all" ? `todas las unidades de ${cabin?.nombre}` : cabinLabel(d.type, Number(d.unit))}, del {fmtDate(d.from, true)} al{" "}
              {fmtDate(d.to, true)}.
            </Callout>
          ))}
        {error && <FieldError>{error}</FieldError>}
      </div>
      <div className="flex flex-col-reverse gap-2 rounded-b-[26px] border-t border-line bg-canvas/70 px-5 py-3.5 sm:flex-row sm:items-center sm:px-6">
        {onDelete && (
          <Button variant="danger-ghost" icon={<TrashIcon size={14} />} onClick={onDelete} className="sm:mr-auto">
            Eliminar
          </Button>
        )}
        <Button onClick={onClose} className="sm:ml-auto">
          Cancelar
        </Button>
        <Button
          variant="primary"
          loading={busy}
          disabled={tried && blocked}
          icon={blocked && tried ? <WarningIcon size={14} /> : <CheckIcon size={14} />}
          onClick={save}
        >
          {d.id ? "Guardar cambios" : "Bloquear fechas"}
        </Button>
      </div>
    </Modal>
  );
}
