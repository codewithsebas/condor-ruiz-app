"use client";

// Correos (panel), en dos pestañas. Enviados: el historial de la bandeja de salida (email-history.tsx). Plantillas: la
// lista de los correos automáticos que recibe el huésped (cuándo sale cada uno, en qué estado queda la reserva y si está
// activo) y el editor de sus textos con variables y la vista previa en vivo. Vacío = el texto original.
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, ClockIcon, MailIcon, PencilIcon, PauseIcon, RefreshIcon, SendIcon } from "@/components/ui/icons";
import { useSite } from "@/components/site/site-provider";
import { api } from "@/lib/client/api";
import { isMockApi } from "@/lib/config";
import {
  EMAIL_CATALOG,
  EMPTY_TEXTS,
  TEXT_LABELS,
  TEXT_LIMITS,
  VARIABLES,
  invalidTemplate,
  overridesOf,
  type EmailTemplate,
  type EmailTemplateKind,
  type EmailTextKey,
  type EmailTexts,
} from "@/lib/email-templates";
import { previewEmailTheme, sampleEmail } from "@/lib/emails";
import { plural, timeAgo } from "@/lib/format";
import { useAdmin } from "@/components/admin/context";
import { Panel, SummaryStrip } from "@/components/admin/board";
import { EmailHistory } from "@/components/admin/email-history";
import { MODULES } from "@/components/admin/routes";
import { adminInput } from "@/components/admin/shared";
import { Badge, Button, Callout, EmptyState, Field, FieldError, Segmented, Tabs, enter } from "@/components/admin/ui";

const KEYS = Object.keys(TEXT_LIMITS) as EmailTextKey[];
const textsOf = (t?: EmailTemplate): EmailTexts =>
  t ? { subject: t.subject, preheader: t.preheader, title: t.title, intro: t.intro, closing: t.closing } : { ...EMPTY_TEXTS };
const changed = (t?: EmailTemplate) => !!t && KEYS.some((k) => t[k].trim());

export function EmailTemplatesView() {
  const { ask, toast, onAuthError, now, data } = useAdmin();
  const [tab, setTab] = useState<"enviados" | "plantillas">("enviados");
  const [rows, setRows] = useState<EmailTemplate[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [kind, setKind] = useState<EmailTemplateKind>(EMAIL_CATALOG[0].kind);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    api.admin.emailTemplates.list().then(
      (r) => {
        if (r.status === 401 || r.status === 403) return onAuthError();
        if (r.status === 200 && Array.isArray(r.data)) setRows(r.data);
        else setLoadError(true);
      },
      () => setLoadError(true),
    );
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rowOf = (k: EmailTemplateKind) => rows?.find((r) => r.kind === k);

  // Guarda una plantilla (textos y activo) y responde si se pudo; `fields`: errores por campo del servidor.
  async function save(k: EmailTemplateKind, texts: EmailTexts, enabled: boolean, done: string): Promise<Partial<Record<EmailTextKey, string>> | null> {
    setBusy(k);
    try {
      const r = await api.admin.emailTemplates.save({ kind: k, enabled, ...texts });
      if (r.status === 401 || r.status === 403) {
        onAuthError();
        return {};
      }
      if (r.status === 200 && Array.isArray(r.data)) {
        setRows(r.data);
        toast(done);
        return null;
      }
      const fields = (r.data as { fields?: Partial<Record<EmailTextKey, string>> } | null)?.fields;
      if (fields) return fields;
      toast(r.status === 503 ? "Sin conexión: los correos se editan con internet." : "No se pudo guardar. Inténtalo de nuevo.", "error");
      return {};
    } catch {
      toast("Sin conexión con el servidor. Inténtalo de nuevo.", "error");
      return {};
    } finally {
      setBusy(null);
    }
  }

  const toggle = (k: EmailTemplateKind) => {
    const row = rowOf(k);
    const on = row?.enabled ?? true;
    const meta = EMAIL_CATALOG.find((e) => e.kind === k)!;
    if (!on) return void save(k, textsOf(row), true, `«${meta.name}» activo de nuevo`);
    ask({
      title: `Apagar «${meta.name}»`,
      text: `Mientras esté apagado, este correo no se envía a ningún huésped.${meta.warn ? ` ${meta.warn}` : ""} Los que ya estaban en cola siguen su curso.`,
      okLabel: "Apagar",
      danger: true,
      done: `«${meta.name}» apagado: ya no se envía`,
      run: async () => {
        const r = await api.admin.emailTemplates.save({ kind: k, enabled: false, ...textsOf(row) });
        if (r.status === 200 && Array.isArray(r.data)) setRows(r.data);
        return r;
      },
    });
  };

  const failed = data.emails.filter((e) => e.status === "failed").length;
  const off = EMAIL_CATALOG.filter((e) => rowOf(e.kind)?.enabled === false).length;
  const edited = EMAIL_CATALOG.filter((e) => changed(rowOf(e.kind))).length;
  const lastEdit = rows
    ?.map((r) => r.updatedAt)
    .filter((x): x is string => !!x)
    .sort()
    .at(-1);

  return (
    <>
      <header {...enter(0)} className="min-w-0">
        <p className="text-[13px] font-medium text-ink-muted">Los correos que reciben los huéspedes</p>
        <h1 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-[-0.025em] text-ink">{MODULES.correos.label}</h1>
      </header>

      <div {...enter(0.6)}>
        <Tabs
          label="Secciones de Correos"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "enviados", label: "Enviados", icon: <SendIcon size={15} />, count: failed },
            { value: "plantillas", label: "Plantillas", icon: <PencilIcon size={15} /> },
          ]}
        />
      </div>

      {tab === "enviados" ? (
        <div {...enter(1)}>
          <EmailHistory />
        </div>
      ) : (
        <>
          <div {...enter(1)} className="@container">
            <SummaryStrip
              label="Resumen de las plantillas"
              cells={[
                {
                  label: "Activos",
                  value: rows ? `${EMAIL_CATALOG.length - off} de ${EMAIL_CATALOG.length}` : "—",
                  hint: off ? `${plural(off, "apagado", "apagados")}` : "Todos salen",
                  icon: <MailIcon size={16} />,
                  meter: rows ? Math.round(((EMAIL_CATALOG.length - off) / EMAIL_CATALOG.length) * 100) : undefined,
                },
                {
                  label: "Apagados",
                  value: rows ? off : "—",
                  hint: off ? "No se envían a ningún huésped" : "Ninguno apagado",
                  icon: <PauseIcon size={16} />,
                },
                {
                  label: "Con texto cambiado",
                  value: rows ? edited : "—",
                  hint: edited ? "Los demás usan su texto original" : "Todos con su texto original",
                  icon: <PencilIcon size={16} />,
                },
                {
                  label: "Último cambio",
                  value: lastEdit ? timeAgo(lastEdit, now) : "—",
                  hint: lastEdit ? "En los textos o si está activo" : "Sin cambios todavía",
                  icon: <ClockIcon size={16} />,
                },
              ]}
            />
          </div>

          <div {...enter(1.3)}>
            <Callout>
              Cada correo sale solo cuando la reserva cambia de estado. Puedes cambiar sus textos (con variables como <code>{"{nombre}"}</code> o{" "}
              <code>{"{codigo}"}</code>) o apagarlo; las tablas de la estadía, los valores, los botones y el mapa se mantienen. Un campo vacío usa el texto
              original.
              {isMockApi && <strong> En modo simulado se guardan solo en este navegador y no se envía nada.</strong>}
            </Callout>
          </div>

          {loadError ? (
            <div {...enter(1.6)}>
              <EmptyState
                icon={<MailIcon size={18} />}
                title="No se pudieron cargar las plantillas"
                text="Revisa la conexión e inténtalo de nuevo."
                action={
                  <Button
                    icon={<RefreshIcon size={14} />}
                    onClick={() => {
                      setLoadError(false);
                      load();
                    }}
                  >
                    Reintentar
                  </Button>
                }
              />
            </div>
          ) : (
            <div {...enter(1.6)} className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <Panel
                id="et-list"
                title="Correos al huésped"
                subtitle={`${EMAIL_CATALOG.length} automáticos · el mensaje del equipo se escribe desde la ficha del cliente`}
              >
                <ul className="-mx-2 flex flex-col">
                  {EMAIL_CATALOG.map((e) => {
                    const row = rowOf(e.kind);
                    const on = row?.enabled ?? true;
                    const sel = kind === e.kind;
                    return (
                      <li
                        key={e.kind}
                        className={`flex items-start gap-3 rounded-[16px] px-2 py-2.5 ${sel ? "bg-panel ring-1 ring-line-strong ring-inset" : ""}`}
                      >
                        <button type="button" aria-current={sel} onClick={() => setKind(e.kind)} className="min-w-0 flex-1 text-left">
                          <span className="flex flex-wrap items-center gap-1.5 text-[14px] font-semibold text-ink">
                            {e.name}
                            {!on && <Badge tone="warning">Apagado</Badge>}
                            {changed(row) && <Badge tone="info">Texto cambiado</Badge>}
                          </span>
                          <span className="mt-0.5 block text-[12.5px] text-ink-muted">{e.when}</span>
                          <span className="mt-0.5 block text-[12px] text-ink-subtle">{`Al huésped · reserva: ${e.state}`}</span>
                        </button>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={on}
                          aria-label={`${on ? "Apagar" : "Activar"} «${e.name}»`}
                          disabled={rows === null || !!busy}
                          onClick={() => toggle(e.kind)}
                          className={`relative mt-0.5 h-6 w-10 flex-none rounded-full transition-colors disabled:opacity-50 ${on ? "bg-ink" : "bg-ink/20"}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-paper transition-transform ${on ? "translate-x-4" : ""}`}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
              {rows === null ? (
                <Panel id="et-edit" title="Cargando…">
                  <p className="text-[13px] text-ink-muted">Trayendo las plantillas guardadas.</p>
                </Panel>
              ) : (
                <TemplateEditor
                  key={`${kind}-${rowOf(kind)?.updatedAt ?? ""}`}
                  kind={kind}
                  row={rowOf(kind)}
                  busy={busy === kind}
                  updated={rowOf(kind)?.updatedAt ? timeAgo(rowOf(kind)!.updatedAt!, now) : null}
                  onSave={(t) => save(kind, t, rowOf(kind)?.enabled ?? true, "Plantilla guardada")}
                />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

// Editor de un correo: sus textos (vacío = original), las variables que acepta y la vista previa con datos de ejemplo.
function TemplateEditor({
  kind,
  row,
  busy,
  updated,
  onSave,
}: {
  kind: EmailTemplateKind;
  row?: EmailTemplate;
  busy: boolean;
  updated: string | null;
  onSave: (t: EmailTexts) => Promise<Partial<Record<EmailTextKey, string>> | null>;
}) {
  const { c } = useSite();
  const meta = EMAIL_CATALOG.find((e) => e.kind === kind)!;
  const saved = textsOf(row);
  const [t, setT] = useState<EmailTexts>(saved);
  const [server, setServer] = useState<Partial<Record<EmailTextKey, string>>>({});
  const [focus, setFocus] = useState<EmailTextKey>("intro");
  const [theme, setTheme] = useState<"claro" | "oscuro">("claro");
  const refs = useRef<Partial<Record<EmailTextKey, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const local = invalidTemplate(kind, t);
  const dirty = KEYS.some((k) => t[k] !== saved[k]);
  const err = (k: EmailTextKey) => local[k] || server[k];

  const preview = useMemo(() => {
    const e = sampleEmail({ ...c, emailTexts: overridesOf([{ kind, ...t }]) }, kind);
    return { ...e, html: previewEmailTheme(e.html, theme === "oscuro") };
  }, [c, kind, t, theme]);

  // Agrega la variable donde está el cursor del último campo usado.
  const insert = (v: string) => {
    const el = refs.current[focus];
    const token = `{${v}}`;
    const cur = t[focus];
    const at = el?.selectionStart ?? cur.length;
    const end = el?.selectionEnd ?? at;
    setT({ ...t, [focus]: cur.slice(0, at) + token + cur.slice(end) });
    setServer({});
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + token.length, at + token.length);
    });
  };

  async function save(next: EmailTexts) {
    if (Object.keys(invalidTemplate(kind, next)).length) return;
    const fields = await onSave(next);
    if (fields) setServer(fields);
  }

  return (
    <Panel
      id="et-edit"
      title={meta.name}
      subtitle={`${meta.when}${updated ? ` · cambiado ${updated}` : ""}`}
      action={
        changed(row) ? (
          <Button size="sm" disabled={busy} onClick={() => save({ ...EMPTY_TEXTS })} className="flex-none">
            Volver al original
          </Button>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        <form
          className="flex min-w-0 flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save(t);
          }}
        >
          {KEYS.map((k) => {
            const long = k === "intro" || k === "closing";
            const props = {
              value: t[k],
              maxLength: TEXT_LIMITS[k],
              placeholder: "Texto original",
              onFocus: () => setFocus(k),
              onChange: (e: { target: { value: string } }) => {
                setT({ ...t, [k]: e.target.value });
                setServer({});
              },
              className: long ? `${adminInput} resize-y leading-relaxed` : adminInput,
            };
            return (
              <Field key={k} label={TEXT_LABELS[k].label} hint={TEXT_LABELS[k].hint} error={err(k) || undefined}>
                {(p) =>
                  long ? (
                    <textarea {...p} {...props} ref={(el) => void (refs.current[k] = el)} rows={k === "intro" ? 4 : 2} />
                  ) : (
                    <input {...p} {...props} ref={(el) => void (refs.current[k] = el)} type="text" />
                  )
                }
              </Field>
            );
          })}
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] font-semibold text-ink">Variables</p>
            <p className="text-[12px] text-ink-muted">{`Tócalas para agregarlas en «${TEXT_LABELS[focus].label}».`}</p>
            <ul className="flex flex-wrap gap-1.5">
              {meta.vars.map((v) => (
                <li key={v}>
                  <button
                    type="button"
                    title={VARIABLES[v]}
                    onClick={() => insert(v)}
                    className="rounded-full bg-panel px-2.5 py-1 font-mono text-[12px] text-ink ring-1 ring-line transition-colors ring-inset hover:bg-canvas"
                  >
                    {`{${v}}`}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {!dirty && !changed(row) && <p className="text-[12.5px] text-ink-muted">Este correo usa sus textos originales.</p>}
          {Object.keys(server).length > 0 && <FieldError>Revisa los campos marcados.</FieldError>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" loading={busy} disabled={!dirty || Object.keys(local).length > 0} icon={<CheckIcon size={14} />}>
              Guardar
            </Button>
            {dirty && (
              <Button
                onClick={() => {
                  setT(saved);
                  setServer({});
                }}
              >
                Descartar cambios
              </Button>
            )}
          </div>
        </form>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-ink">Vista previa</p>
            <Segmented
              label="Tema de la vista previa"
              size="sm"
              value={theme}
              onChange={setTheme}
              options={[
                { value: "claro", label: "Claro" },
                { value: "oscuro", label: "Oscuro" },
              ]}
            />
          </div>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-[14px] bg-panel px-3 py-2 text-[12.5px]">
            <dt className="text-ink-muted">Asunto</dt>
            <dd className="truncate font-semibold text-ink">{preview.subject}</dd>
            <dt className="text-ink-muted">Vista previa</dt>
            <dd className="truncate text-ink">{preview.preheader}</dd>
          </dl>
          <div className="overflow-hidden rounded-[16px] ring-1 ring-line ring-inset" style={{ background: theme === "oscuro" ? "#0B0F0C" : "#F5F1E4" }}>
            <iframe title={`Vista previa: ${meta.name}`} sandbox="allow-same-origin" srcDoc={preview.html} className="block h-[640px] w-full border-0" />
          </div>
          <p className="text-[12px] text-ink-subtle">Con datos de ejemplo: Laura Gómez, reserva ECR-7W9DX.</p>
        </div>
      </div>
    </Panel>
  );
}
