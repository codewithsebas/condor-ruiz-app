"use client";

// Configuración de este navegador, como tablero: arriba una tarjeta oscura con el estado actual (apariencia, sonido,
// tiempo real y calendario), cada uno un atajo a su sección; a la izquierda, el índice de secciones (fijo al bajar); a la
// derecha, cada sección en su tarjeta.
import type { ReactNode } from "react";
import { BellIcon, CalendarIcon, ExternalLinkIcon, LogoutIcon, MoonIcon, RefreshIcon, VolumeIcon, VolumeOffIcon } from "@/components/ui/icons";
import { api } from "@/lib/client/api";
import { isMockApi } from "@/lib/config";
import { useAdmin } from "@/components/admin/context";
import { Combobox } from "@/components/ui/combobox";
import { LIVE_LABEL, LiveDot, SOUND_GROUPS, previewSound, useSound } from "@/components/admin/notifications";
import { PREF, usePref, writePref } from "@/components/admin/prefs";
import { PushSettingsCard } from "@/components/admin/push";
import { THEME_OPTIONS, ThemeSwitch, useThemePref } from "@/components/admin/appearance";
import { Panel } from "@/components/admin/board";
import { Button, Callout, Field, Switch, buttonClass, enter } from "@/components/admin/ui";
import { CALENDAR_VIEWS } from "@/components/admin/calendar/shared";

const SECTIONS = [
  { id: "sec-theme", label: "Apariencia", icon: <MoonIcon size={15} /> },
  { id: "sec-sound", label: "Sonido", icon: <VolumeIcon size={15} /> },
  { id: "sec-push", label: "Notificaciones", icon: <BellIcon size={15} /> },
  { id: "sec-live", label: "Tiempo real", icon: <RefreshIcon size={15} /> },
  { id: "sec-cal", label: "Calendario", icon: <CalendarIcon size={15} /> },
  { id: "sec-session", label: "Sesión", icon: <LogoutIcon size={15} /> },
];

export function SettingsView() {
  const { live, logout, ask } = useAdmin();
  const [sound, setSound] = useSound();
  const [theme] = useThemePref();
  const muted = usePref(PREF.mutedSounds, "").split(",").filter(Boolean);
  const calendarView = usePref(PREF.calendarView, "auto");
  const ringing = sound ? SOUND_GROUPS.filter((g) => !muted.includes(g.id)).length : 0;

  const toggleGroup = (id: string, on: boolean) => writePref(PREF.mutedSounds, (on ? muted.filter((x) => x !== id) : [...muted, id]).join(","));
  const test = () => void previewSound();
  const reset = () =>
    ask({
      title: "Restablecer datos de prueba",
      text: "Se borran las reservas simuladas y se cargan las de demostración.",
      okLabel: "Restablecer",
      done: "Datos de prueba restablecidos",
      run: () => api.admin.reset(),
    });

  const status: { id: string; label: string; value: ReactNode; hint: string }[] = [
    {
      id: "sec-theme",
      label: "Apariencia",
      value: THEME_OPTIONS.find((o) => o.value === theme)?.label ?? "Claro",
      hint: THEME_OPTIONS.find((o) => o.value === theme)?.hint ?? "",
    },
    {
      id: "sec-sound",
      label: "Sonido",
      value: sound ? "Activado" : "Silenciado",
      hint: sound ? `${ringing} de ${SOUND_GROUPS.length} avisos suenan` : "ningún aviso suena",
    },
    {
      id: "sec-live",
      label: "Tiempo real",
      value: (
        <span className="inline-flex items-center gap-2">
          <LiveDot status={live} />
          {live === "live" ? "En vivo" : live === "connecting" ? "Conectando" : "Sin conexión"}
        </span>
      ),
      hint: live === "live" ? "los cambios llegan solos" : "recarga para reconectar",
    },
    {
      id: "sec-cal",
      label: "Calendario",
      value: calendarView === "auto" ? "Automática" : (CALENDAR_VIEWS.find((v) => v.value === calendarView)?.label ?? "Automática"),
      hint: "vista al abrirlo",
    },
  ];

  return (
    <>
      <header {...enter(0)} className="min-w-0">
        <p className="text-[13px] font-medium text-ink-muted">Preferencias de este navegador: no cambian lo que ve el resto del equipo</p>
        <h1 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-[-0.025em] text-ink">Configuración</h1>
      </header>

      {/* Estado actual: cada cifra lleva a su sección. */}
      <section
        {...enter(1)}
        aria-label="Estado de este navegador"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-[color-mix(in_srgb,var(--color-ink)_82%,var(--color-paper))] lg:grid-cols-4"
      >
        {status.map((x) => (
          <a
            key={x.id}
            href={`#${x.id}`}
            className="flex min-w-0 flex-col gap-1.5 bg-ink p-5 text-paper transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_88%,var(--color-paper))]"
          >
            <span className="text-[12px] text-paper/60">{x.label}</span>
            <span className="truncate text-[20px] leading-tight font-semibold tracking-[-0.02em]">{x.value}</span>
            <span className="truncate text-[12px] text-paper/50">{x.hint}</span>
          </a>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Índice de secciones, fijo al bajar. */}
        <nav {...enter(1.6)} aria-label="Secciones de la configuración" className="hidden lg:block">
          <ul className="sticky top-28 flex flex-col gap-1 rounded-[22px] bg-paper p-2 ring-1 ring-line ring-inset">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-panel"
                >
                  <span aria-hidden="true" className="text-ink-muted">
                    {s.icon}
                  </span>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-4 [&>*]:scroll-mt-28">
          <div {...enter(2)} id="sec-theme">
            <Panel
              id="st-theme-t"
              title="Apariencia"
              subtitle="Claro, oscuro o el mismo modo del sistema de este dispositivo. También se cambia desde el encabezado."
            >
              <div className="max-w-[420px]">
                <ThemeSwitch />
              </div>
            </Panel>
          </div>

          <div {...enter(2.5)} id="sec-sound">
            <Panel
              id="st-sound-t"
              title="Sonido de notificaciones"
              subtitle="Suena cuando llega un aviso nuevo con el panel abierto."
              action={
                <Button size="sm" icon={<VolumeIcon size={14} />} onClick={test}>
                  Probar sonido
                </Button>
              }
            >
              <div className="flex items-center gap-3 rounded-[16px] bg-panel p-4 ring-1 ring-line ring-inset">
                <span
                  aria-hidden="true"
                  className={`grid size-10 flex-none place-items-center rounded-full ${sound ? "bg-ink text-paper" : "bg-paper text-ink-muted ring-1 ring-line"}`}
                >
                  {sound ? <VolumeIcon size={17} /> : <VolumeOffIcon size={17} />}
                </span>
                <div className="min-w-0 flex-1">
                  <Switch
                    checked={sound}
                    onChange={setSound}
                    label="Reproducir sonido"
                    description="Puedes silenciarlo también desde la campana de notificaciones."
                  />
                </div>
              </div>
              {/* Cada tipo de aviso en su propia tarjeta, con su interruptor. */}
              <fieldset disabled={!sound} className="flex min-w-0 flex-col gap-3 disabled:opacity-55">
                <legend className="mb-2 text-[13px] font-semibold text-ink">{`Qué avisos suenan · ${ringing} de ${SOUND_GROUPS.length}`}</legend>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  {SOUND_GROUPS.map((g) => (
                    <div key={g.id} className="rounded-[16px] p-4 ring-1 ring-line ring-inset">
                      <Switch
                        checked={sound && !muted.includes(g.id)}
                        disabled={!sound}
                        onChange={(v) => toggleGroup(g.id, v)}
                        label={g.label}
                        description={g.description}
                      />
                    </div>
                  ))}
                </div>
              </fieldset>
              <Callout>
                Los navegadores solo permiten reproducir sonido después de que interactúas con la página (un clic o una tecla). Si abres el panel y no tocas
                nada, el primer aviso llegará sin sonido.
              </Callout>
            </Panel>
          </div>

          <div {...enter(3)} id="sec-push">
            <PushSettingsCard />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div {...enter(3.5)} id="sec-live">
              <Panel id="st-live-t" title="Tiempo real" subtitle="Reservas, comprobantes y bloqueos se actualizan sin recargar la página.">
                <p className="flex items-center gap-2.5 rounded-full bg-panel px-4 py-2.5 text-[13px] font-medium text-ink ring-1 ring-line ring-inset">
                  <LiveDot status={live} />
                  {LIVE_LABEL[live]}
                </p>
                {live === "offline" && (
                  <Callout tone="warning">
                    Se perdió la conexión en vivo. Recarga la página para reconectar; mientras tanto, los datos se actualizan al hacer cambios.
                  </Callout>
                )}
              </Panel>
            </div>

            <div {...enter(4)} id="sec-cal">
              <Panel id="st-cal-t" title="Calendario" subtitle="Vista con la que se abre el calendario en este navegador.">
                <Field label="Vista predeterminada" hint="«Automática» elige según el ancho: la semana en el celular y la tableta, y el mes en el computador.">
                  {(p) => (
                    <Combobox
                      id={p.id}
                      describedBy={p["aria-describedby"]}
                      value={calendarView}
                      onChange={(v) => writePref(PREF.calendarView, v)}
                      options={[{ value: "auto", label: "Automática según la pantalla" }, ...CALENDAR_VIEWS.map((v) => ({ value: v.value, label: v.label }))]}
                    />
                  )}
                </Field>
              </Panel>
            </div>
          </div>

          <div {...enter(4.5)} id="sec-session">
            <Panel id="st-session-t" title="Sesión" subtitle="El sitio público y la salida del panel en este navegador.">
              <div className="flex flex-wrap gap-2">
                <a href="/" target="_blank" rel="noopener" className={buttonClass()}>
                  <ExternalLinkIcon size={15} />
                  Ver sitio web
                </a>
                {isMockApi && (
                  <Button icon={<RefreshIcon size={15} />} onClick={reset}>
                    Restablecer datos de prueba
                  </Button>
                )}
                <Button variant="danger" icon={<LogoutIcon size={15} />} onClick={logout} className="sm:ml-auto">
                  Cerrar sesión
                </Button>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
