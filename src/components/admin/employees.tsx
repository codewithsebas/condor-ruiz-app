"use client";

// Empleados del panel (solo administradores), como tablero: el equipo en cifras (activas por rol, quién entró esta
// semana, quién nunca ha entrado), las cuentas en tarjetas con sus acciones, la actividad reciente y lo que incluye cada
// rol. Cada cuenta se crea o edita en una ventana: su rol, su acceso y su contraseña inicial.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  BanIcon,
  CheckIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  IdCardIcon,
  PencilIcon,
  RefreshIcon,
  ShieldIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { api } from "@/lib/client/api";
import { ROLE_HINT, ROLE_LABEL, canManageRole, isAdminRole } from "@/lib/permissions";
import { fmtDate, dateOf, timeAgo } from "@/lib/format";
import type { ApiResult, Employee, EmployeeInput, PanelRole } from "@/lib/types";
import { useAdmin } from "@/components/admin/context";
import { useSyncStatus } from "@/components/admin/sync";
import { MODULES } from "@/components/admin/routes";
import { Avatar, RoleBadge, RoleCapabilities, displayName } from "@/components/admin/account";
import { Paginator, usePaged } from "@/components/admin/paginator";
import { adminInput, norm } from "@/components/admin/shared";
import { ListSearch } from "@/components/admin/list-table";
import { Panel } from "@/components/admin/board";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  FieldError,
  IconButton,
  Modal,
  ModalPresence,
  Callout,
  Segmented,
  Switch,
  enter,
} from "@/components/admin/ui";
import { PersonCardSkeleton, RecentSignInsSkeleton } from "@/components/admin/skeletons";

type Filter = "todos" | PanelRole | "inactivos";
type Draft = { id?: string; name: string; email: string; role: PanelRole; password: string; active: boolean };

const ROLES: PanelRole[] = ["recepcion", "admin", "superadmin"];

// Mensaje de los rechazos del servidor que no son de un campo.
const REFUSAL: Record<string, string> = {
  SELF_LOCKOUT: "No puedes cambiar tu propio rol ni desactivar o borrar tu cuenta.",
  SUPERADMIN_ONLY: "Solo un superadministrador puede crear o cambiar cuentas de superadministrador.",
  LAST_ADMIN: "Debe quedar al menos un administrador activo.",
};

// Contraseña inicial legible (sin caracteres que se confunden: 0/O, 1/l/I).
function newPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const n = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(n, (x) => chars[x % chars.length]).join("");
}

export function EmployeesView() {
  const { sync, data, ask, onAuthError, now } = useAdmin();
  const offline = useSyncStatus(sync).network === "offline";
  const [list, setList] = useState<Employee[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");

  const load = useCallback(
    () =>
      api.admin.employees
        .list()
        .then((r) => {
          if (r.status === 401 || r.status === 403) return onAuthError();
          if (r.status !== 200 || !Array.isArray(r.data)) throw 0;
          setFailed(false);
          setList(r.data);
        })
        .catch(() => setFailed(true)),
    [onAuthError],
  );

  useEffect(() => {
    load();
  }, [load]);

  const all = list ?? [];
  const nq = norm(q.trim());
  const shown = all.filter(
    (e) => (filter === "todos" || (filter === "inactivos" ? !e.active : e.active && e.role === filter)) && (!nq || norm(`${e.name} ${e.email}`).includes(nq)),
  );
  const paged = usePaged(shown, "empleados", `${filter}|${nq}`);
  const active = all.filter((e) => e.active);
  // La última cuenta creada se pinta con otro fondo, como la última reserva en Reservas.
  const newest = all.reduce<Employee | null>((a, e) => (!a || e.createdAt > a.createdAt ? e : a), null)?.id;
  const editOf = (e: Employee) => setEditing({ id: e.id, name: e.name, email: e.email, role: e.role, password: "", active: e.active });

  // Desactivar quita el acceso sin borrar la cuenta; activar lo devuelve. La propia cuenta no se puede desactivar.
  const toggle = (e: Employee) =>
    ask({
      title: e.active ? "Desactivar la cuenta" : "Activar la cuenta",
      text: e.active
        ? `${displayName(e)} no podrá entrar al panel hasta que la vuelvas a activar. La cuenta y su historial se conservan.`
        : `${displayName(e)} podrá volver a entrar al panel con su correo y su contraseña.`,
      details: [
        { k: "Correo", v: e.email },
        { k: "Rol", v: ROLE_LABEL[e.role] },
      ],
      okLabel: e.active ? "Desactivar" : "Activar",
      danger: e.active,
      done: e.active ? "Cuenta desactivada" : "Cuenta activada",
      run: async () => {
        const r = await api.admin.employees.update({ id: e.id, active: !e.active });
        if (r.status === 200 && Array.isArray(r.data)) setList(r.data);
        const code = (r.data as { error?: string } | null)?.error;
        return (code && REFUSAL[code] ? { status: r.status, data: { fields: { cuenta: REFUSAL[code] } } } : r) as ApiResult<unknown>;
      },
    });
  const remove = (e: Employee) =>
    ask({
      title: "Borrar la cuenta",
      text: `${displayName(e)} ya no podrá entrar al panel. Si solo quieres quitarle el acceso por un tiempo, desactívala.`,
      details: [
        { k: "Correo", v: e.email },
        { k: "Rol", v: ROLE_LABEL[e.role] },
      ],
      okLabel: "Borrar cuenta",
      danger: true,
      done: "Cuenta borrada",
      run: async () => {
        const r = await api.admin.employees.remove(e.id);
        if (r.status === 200 && Array.isArray(r.data)) {
          setList(r.data);
          setEditing(null);
        }
        const code = (r.data as { error?: string } | null)?.error;
        return (code && REFUSAL[code] ? { status: r.status, data: { fields: { cuenta: REFUSAL[code] } } } : r) as ApiResult<unknown>;
      },
    });

  const supers = active.filter((e) => e.role === "superadmin").length;
  const admins = active.filter((e) => e.role === "admin").length;
  const me = data.me.role;
  // Roles que quien edita puede asignar: un administrador no ve la opción de superadministrador.
  const roles = ROLES.filter((r) => canManageRole(me, r));
  const reception = active.filter((e) => e.role === "recepcion").length;
  const inactive = all.length - active.length;
  const week = active.filter((e) => e.lastSignInAt && now - Date.parse(e.lastSignInAt) < 7 * 864e5).length;
  const never = active.filter((e) => !e.lastSignInAt).length;
  const recent = [...all].filter((e) => e.lastSignInAt).sort((a, b) => (a.lastSignInAt! < b.lastSignInAt! ? 1 : -1));

  return (
    <>
      {offline && (
        <Callout tone="warning">Sin conexión puedes consultar el equipo, pero crear o cambiar cuentas, roles y contraseñas requiere internet.</Callout>
      )}
      <header {...enter(0)} className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-muted">Cada persona entra con su propio correo; el rol decide qué puede ver y hacer</p>
          <h1 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-[-0.025em] text-ink">{MODULES.empleados.label}</h1>
        </div>
        <Button
          variant="primary"
          icon={<UserPlusIcon size={15} />}
          onClick={() => setEditing({ name: "", email: "", role: "recepcion", password: newPassword(), active: true })}
        >
          Nuevo empleado
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div {...enter(1)} className="min-w-0 xl:col-span-5">
          <TeamHero loading={!list} active={active.length} supers={supers} admins={admins} reception={reception} inactive={inactive} />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3 xl:col-span-7">
          <Tile
            order={1.5}
            icon={<CheckIcon size={15} />}
            label="Entraron esta semana"
            value={list ? week : "—"}
            hint={`de ${active.length} cuentas activas`}
          />
          <Tile
            order={2}
            icon={<ClockIcon size={15} />}
            label="Nunca han entrado"
            value={list ? never : "—"}
            hint={never ? "entrégales su contraseña" : "todos ya entraron"}
          />
          <Tile
            order={2.5}
            icon={<UsersIcon size={15} />}
            label="Último ingreso"
            value={recent[0] ? displayName(recent[0]) : "—"}
            hint={recent[0] ? timeAgo(recent[0].lastSignInAt!, now) : "nadie ha entrado"}
            small
          />
        </div>
      </div>

      <div role="search" aria-label="Filtrar empleados" className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:max-w-[360px] sm:flex-1">
          <ListSearch id="em-q" label="Buscar empleados" value={q} onChange={setQ} placeholder="Buscar por nombre o correo" />
        </div>
        <Segmented
          label="Mostrar"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "todos", label: "Todos", count: all.length },
            ...(supers || me === "superadmin" ? [{ value: "superadmin" as const, label: "Superadministradores", count: supers }] : []),
            { value: "admin", label: "Administradores", count: admins },
            { value: "recepcion", label: "Recepción", count: reception },
            { value: "inactivos", label: "Desactivados", count: inactive },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div {...enter(3)} className="flex min-w-0 flex-col gap-3 xl:col-span-8">
          {failed ? (
            <Panel id="em-err" title="Equipo">
              <ErrorState
                title="No pudimos cargar los empleados"
                text="Revisa tu conexión e inténtalo de nuevo."
                onRetry={() => {
                  setFailed(false);
                  load();
                }}
              />
            </Panel>
          ) : !list ? (
            <ul aria-busy="true" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <PersonCardSkeleton key={i} />
              ))}
            </ul>
          ) : shown.length ? (
            <>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {paged.rows.map((e) => (
                  <PersonCard
                    key={e.id}
                    e={e}
                    self={e.id === data.me.id}
                    locked={!canManageRole(me, e.role)}
                    latest={e.id === newest}
                    now={now}
                    onEdit={() => editOf(e)}
                    onToggle={() => toggle(e)}
                    onRemove={() => remove(e)}
                  />
                ))}
              </ul>
              <Paginator p={paged} noun="cuentas" className="rounded-[18px] bg-paper px-4 py-3 ring-1 ring-line" />
            </>
          ) : (
            <Panel id="em-empty" title="Equipo">
              <EmptyState
                icon={<UsersIcon size={18} />}
                title={all.length ? "Nadie coincide con la búsqueda" : "Aún no hay empleados"}
                text={all.length ? "Prueba con otro nombre o cambia el filtro." : "Crea una cuenta para cada persona del equipo."}
              />
            </Panel>
          )}
        </div>

        <div {...enter(3.6)} className="flex min-w-0 flex-col gap-4 xl:col-span-4">
          <Panel id="em-activity" title="Actividad reciente" subtitle="Último ingreso de cada cuenta">
            {!list ? (
              <RecentSignInsSkeleton />
            ) : recent.length ? (
              <ol className="relative flex flex-col gap-3 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-line">
                {recent.slice(0, 6).map((e) => (
                  <li key={e.id} className="relative flex items-center gap-3">
                    <span className="relative rounded-full ring-4 ring-paper">
                      <Avatar user={e} size={30} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">{displayName(e)}</span>
                      <span className="block truncate text-[11.5px] text-ink-muted">{ROLE_LABEL[e.role]}</span>
                    </span>
                    <span className="flex-none text-[12px] text-ink-muted">{timeAgo(e.lastSignInAt!, now)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[13px] text-ink-muted">Nadie ha entrado al panel todavía.</p>
            )}
          </Panel>
          {[...ROLES]
            .reverse()
            .filter((role) => role !== "superadmin" || me === "superadmin" || supers > 0)
            .map((role) => (
              <Panel
                key={role}
                id={`em-role-${role}`}
                title={ROLE_LABEL[role]}
                subtitle={ROLE_HINT[role]}
                action={
                  <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-panel text-ink ring-1 ring-line">
                    {isAdminRole(role) ? <ShieldIcon size={15} /> : <IdCardIcon size={15} />}
                  </span>
                }
              >
                <RoleCapabilities role={role} />
              </Panel>
            ))}
        </div>
      </div>

      <ModalPresence>
        {editing && canManageRole(me, editing.role) && (
          <EmployeeEditor
            key={editing.id ?? "nuevo"}
            initial={editing}
            isSelf={editing.id === data.me.id}
            roles={roles}
            onClose={() => setEditing(null)}
            onSaved={(l) => {
              setList(l);
              setEditing(null);
            }}
            onDelete={
              editing.id && editing.id !== data.me.id && canManageRole(me, editing.role) ? () => remove(all.find((e) => e.id === editing.id)!) : undefined
            }
          />
        )}
      </ModalPresence>
    </>
  );
}

/* ───────────── Resumen del equipo ───────────── */

// Tarjeta oscura: cuentas activas en grande y cómo se reparten entre administradores y recepción.
function TeamHero({
  loading,
  active,
  supers,
  admins,
  reception,
  inactive,
}: {
  loading: boolean;
  active: number;
  supers: number;
  admins: number;
  reception: number;
  inactive: number;
}) {
  const parts = [
    ...(supers ? [{ key: "superadmin", label: ROLE_LABEL.superadmin, value: supers, color: "var(--color-yellow-deep)" }] : []),
    { key: "admin", label: ROLE_LABEL.admin, value: admins, color: "var(--color-chart-a)" },
    { key: "recepcion", label: ROLE_LABEL.recepcion, value: reception, color: "var(--color-chart-b)" },
  ];
  return (
    <section aria-labelledby="em-hero" className="flex h-full flex-col gap-5 rounded-[22px] bg-ink p-6 text-paper">
      <div className="flex items-start justify-between gap-3">
        <h2 id="em-hero" className="text-[13px] font-medium text-paper/70">
          Cuentas activas
        </h2>
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-paper/10">
          <UsersIcon size={16} />
        </span>
      </div>
      <p className="text-[56px] leading-none font-semibold tracking-[-0.04em]">{loading ? "—" : active}</p>
      <div className="mt-auto flex flex-col gap-3">
        {active > 0 && (
          <div role="img" aria-label={parts.map((p) => `${p.label}: ${p.value}`).join(", ")} className="flex h-2.5 gap-[2px]">
            {parts
              .filter((p) => p.value > 0)
              .map((p) => (
                <span key={p.key} className="h-full rounded-full" style={{ width: `${(p.value / active) * 100}%`, background: p.color }} />
              ))}
          </div>
        )}
        <dl className={`grid gap-3 ${parts.length > 2 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
          {[...parts.map((p) => ({ k: p.label, v: p.value, dot: p.color })), { k: "Desactivadas", v: inactive, dot: "" }].map((x) => (
            <div key={x.k} className="min-w-0 border-l border-paper/15 pl-3">
              <dt className="flex items-center gap-1.5 truncate text-[12px] text-paper/60">
                {x.dot && <span aria-hidden="true" className="size-2 flex-none rounded-full" style={{ background: x.dot }} />}
                {x.k}
              </dt>
              <dd className="mt-1 text-[18px] font-semibold">{loading ? "—" : x.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Tile({
  order,
  icon,
  label,
  value,
  hint,
  small = false,
}: {
  order: number;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint: string;
  small?: boolean;
}) {
  return (
    <section {...enter(order)} aria-label={label} className="flex min-w-0 flex-col gap-3 rounded-[22px] bg-paper p-5 ring-1 ring-line ring-inset">
      <span className="flex items-center gap-2 text-[12.5px] font-medium text-ink-muted">
        <span aria-hidden="true" className="grid size-7 flex-none place-items-center rounded-full bg-panel text-ink ring-1 ring-line">
          {icon}
        </span>
        {label}
      </span>
      <p className={`truncate leading-tight font-semibold tracking-[-0.03em] text-ink ${small ? "text-[18px]" : "text-[28px]"}`}>{value}</p>
      <p className="mt-auto truncate text-[12px] text-ink-subtle">{hint}</p>
    </section>
  );
}

/* ───────────── Tarjeta de cada persona ───────────── */

function PersonCard({
  e,
  self,
  locked,
  latest,
  now,
  onEdit,
  onToggle,
  onRemove,
}: {
  e: Employee;
  self: boolean;
  locked: boolean; // cuenta de superadministrador vista por un administrador: solo lectura
  latest: boolean;
  now: number;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li className={`flex min-w-0 flex-col rounded-[22px] bg-paper ring-1 ring-inset ${latest ? "ring-ink/25" : "ring-line"}`}>
      {/* Desactivada: los datos se atenúan, las acciones no (para que «Activar» se vea disponible). */}
      <button
        type="button"
        onClick={onEdit}
        disabled={locked}
        className={`flex min-w-0 flex-col gap-4 rounded-t-[22px] p-5 text-left transition-colors hover:bg-panel/60 disabled:cursor-default disabled:hover:bg-transparent ${e.active ? "" : "opacity-60"}`}
      >
        <span className="flex items-start gap-3">
          <span className="relative flex-none">
            <Avatar user={e} size={48} />
            <span
              aria-hidden="true"
              className={`absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-paper ${e.active ? "bg-success" : "bg-ink-subtle"}`}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[15px] font-semibold text-ink">{displayName(e)}</span>
              {self && <Badge>Tú</Badge>}
              {latest && !self && <Badge tone="info">Nueva</Badge>}
            </span>
            <span className="block truncate text-[12.5px] text-ink-muted">{e.email}</span>
            <span className="mt-2 flex flex-wrap gap-1.5">
              <RoleBadge role={e.role} />
              {e.active ? <Badge tone="success">Activa</Badge> : <Badge>Desactivada</Badge>}
            </span>
          </span>
        </span>
        <dl className="grid grid-cols-2 gap-3 border-t border-line pt-3 text-[12px]">
          <div className="min-w-0">
            <dt className="text-ink-muted">Último ingreso</dt>
            <dd className="truncate font-medium text-ink">{e.lastSignInAt ? timeAgo(e.lastSignInAt, now) : "Nunca"}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-ink-muted">Creada</dt>
            <dd className="truncate font-medium text-ink">{fmtDate(dateOf(e.createdAt), true)}</dd>
          </div>
        </dl>
      </button>
      <div className="flex items-center justify-end gap-1 border-t border-line px-3 py-2">
        {locked && <p className="mr-auto px-2 py-1.5 text-[12px] text-ink-muted">Solo un superadministrador puede cambiar esta cuenta.</p>}
        {!self && !locked && (
          <Button size="sm" variant="ghost" icon={e.active ? <BanIcon size={14} /> : <CheckIcon size={14} />} onClick={onToggle} className="mr-auto">
            {e.active ? "Desactivar" : "Activar"}
            <span className="sr-only">{` a ${displayName(e)}`}</span>
          </Button>
        )}
        {!locked && (
          <IconButton label={`Editar a ${displayName(e)}`} size="sm" variant="secondary" data-gesture="cancel" onClick={onEdit}>
            <PencilIcon size={15} />
          </IconButton>
        )}
        {!self && !locked && (
          <IconButton label={`Borrar la cuenta de ${displayName(e)}`} size="sm" variant="danger-ghost" data-gesture="cancel" onClick={onRemove}>
            <TrashIcon size={15} />
          </IconButton>
        )}
      </div>
    </li>
  );
}

/* ───────────── Crear / editar ───────────── */

function EmployeeEditor({
  initial,
  isSelf,
  roles,
  onClose,
  onSaved,
  onDelete,
}: {
  initial: Draft;
  isSelf: boolean;
  roles: PanelRole[];
  onClose: () => void;
  onSaved: (list: Employee[]) => void;
  onDelete?: () => void;
}) {
  const { toast, onAuthError } = useAdmin();
  const [d, setD] = useState(initial);
  const [show, setShow] = useState(!initial.id);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const isNew = !initial.id;
  const set = (p: Partial<Draft>) => {
    setD((x) => ({ ...x, ...p }));
    setError("");
  };

  const local: Record<string, string> = {
    name: d.name.trim().length < 2 ? "Escribe el nombre (2 a 80 caracteres)." : "",
    email: isNew && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()) ? "Escribe un correo válido." : "",
    password: (isNew || d.password) && d.password.length < 8 ? "Mínimo 8 caracteres." : "",
  };
  const err = (k: string) => errors[k] || (tried ? local[k] : "") || undefined;

  async function save() {
    setTried(true);
    if (busy || Object.values(local).some(Boolean)) return;
    setBusy(true);
    setErrors({});
    const body: EmployeeInput = isNew
      ? { email: d.email.trim().toLowerCase(), name: d.name.trim(), role: d.role, password: d.password }
      : {
          id: d.id,
          ...(d.name.trim() !== initial.name && { name: d.name.trim() }),
          ...(d.role !== initial.role && { role: d.role }),
          ...(d.active !== initial.active && { active: d.active }),
          ...(d.password && { password: d.password }),
        };
    try {
      const r = isNew ? await api.admin.employees.create(body) : await api.admin.employees.update(body);
      if (r.status === 401 || r.status === 403) return onAuthError();
      if ((r.status !== 200 && r.status !== 201) || !Array.isArray(r.data)) {
        const res = r.data as { error?: string; fields?: Record<string, string> } | null;
        if (res?.fields) setErrors(res.fields);
        else setError((res?.error && REFUSAL[res.error]) || "No se pudo guardar. Inténtalo de nuevo.");
        return;
      }
      toast(isNew ? `Cuenta creada para ${d.name.trim()}` : "Cambios guardados");
      onSaved(r.data);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="em-title" initialFocus="input" className="m-auto w-[calc(100%-32px)] max-w-[560px] rounded-[26px] p-0">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <span aria-hidden="true" className="grid size-10 flex-none place-items-center rounded-full bg-pink text-ink">
              {isNew ? <UserPlusIcon size={18} /> : <PencilIcon size={17} />}
            </span>
            <div className="pt-1">
              <h2 id="em-title" className="text-[18px] font-bold tracking-[-0.02em] text-ink">
                {isNew ? "Nuevo empleado" : `Editar a ${initial.name || initial.email}`}
              </h2>
              <p className="text-[13.5px] text-ink-muted">
                {isNew ? "La cuenta queda lista para entrar con el correo y la contraseña inicial." : initial.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nombre" error={err("name")} className={isNew ? "" : "sm:col-span-2"}>
              {(p) => <input {...p} value={d.name} maxLength={80} autoComplete="off" onChange={(e) => set({ name: e.target.value })} className={adminInput} />}
            </Field>
            {isNew && (
              <Field label="Correo" error={err("email")}>
                {(p) => (
                  <input
                    {...p}
                    type="email"
                    value={d.email}
                    maxLength={160}
                    autoComplete="off"
                    onChange={(e) => set({ email: e.target.value })}
                    className={adminInput}
                  />
                )}
              </Field>
            )}
          </div>

          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="mb-1.5 text-[13px] font-semibold text-ink">Rol</legend>
            <div className={`grid grid-cols-1 gap-2 ${roles.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              {roles.map((role) => {
                const on = d.role === role;
                return (
                  <label
                    key={role}
                    className={`flex cursor-pointer flex-col gap-1 rounded-[18px] border p-3.5 transition-colors ${on ? "border-ink bg-paper" : "border-line-strong hover:bg-paper/60"} ${isSelf && role !== d.role ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                      <input
                        type="radio"
                        name="em-role"
                        value={role}
                        checked={on}
                        disabled={isSelf && role !== d.role}
                        onChange={() => set({ role })}
                        className="size-4 accent-[var(--color-ink)]"
                      />
                      {ROLE_LABEL[role]}
                    </span>
                    <span className="text-[12.5px] leading-snug text-ink-muted">{ROLE_HINT[role]}</span>
                  </label>
                );
              })}
            </div>
            {isSelf && <p className="text-[12.5px] text-ink-muted">Tu propio rol no se puede cambiar desde aquí.</p>}
          </fieldset>

          <Field
            label={isNew ? "Contraseña inicial" : "Nueva contraseña (opcional)"}
            hint={isNew ? "Entrégasela a la persona; podrá cambiarla en «Mi perfil»." : "Déjala vacía para no cambiarla."}
            error={err("password")}
          >
            {(p) => (
              <div className="flex gap-2">
                <input
                  {...p}
                  type={show ? "text" : "password"}
                  value={d.password}
                  autoComplete="new-password"
                  onChange={(e) => set({ password: e.target.value })}
                  className={`${adminInput} min-w-0 flex-1 font-mono`}
                />
                <IconButton label={show ? "Ocultar la contraseña" : "Mostrar la contraseña"} variant="secondary" onClick={() => setShow(!show)}>
                  {show ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </IconButton>
                <IconButton
                  label="Generar otra contraseña"
                  variant="secondary"
                  onClick={() => {
                    set({ password: newPassword() });
                    setShow(true);
                  }}
                >
                  <RefreshIcon size={16} />
                </IconButton>
              </div>
            )}
          </Field>

          {!isNew && (
            <div className="rounded-[18px] border border-line px-4 py-3">
              <Switch
                checked={d.active}
                onChange={(v) => set({ active: v })}
                disabled={isSelf}
                label="Cuenta activa"
                description={isSelf ? "No puedes desactivar tu propia cuenta." : "Desactivada, no puede entrar al panel. Se puede reactivar cuando quieras."}
              />
            </div>
          )}
          {error && <FieldError>{error}</FieldError>}
        </div>
        <div className="flex flex-col-reverse gap-2 rounded-b-[26px] border-t border-line bg-canvas/70 px-5 py-3.5 sm:flex-row sm:items-center sm:px-6">
          {onDelete && (
            <Button variant="danger-ghost" icon={<TrashIcon size={14} />} onClick={onDelete} className="sm:mr-auto">
              Borrar cuenta
            </Button>
          )}
          <Button onClick={onClose} className="sm:ml-auto">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={busy} icon={<CheckIcon size={14} />}>
            {isNew ? "Crear cuenta" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
