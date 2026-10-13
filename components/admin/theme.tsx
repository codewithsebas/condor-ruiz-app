"use client";

// Contenido del sitio → Colores: paletas listas, ajuste color por color, aviso de contraste y vista previa en vivo.
import { useId, useState, type CSSProperties } from "react";
import { ArrowRightIcon, CheckIcon, LogoMark, MenuIcon, PaletteIcon, RefreshIcon, SparkleIcon } from "@/components/icons";
import { config } from "@/lib/config";
import type { SiteTexts } from "@/lib/site";
import { DEFAULT_THEME, THEME_GROUPS, THEME_PRESETS, mergeTheme, normalizeHex, presetOf, sameTheme, themeField, themeIssues, themeVars, type SiteTheme, type ThemeKey } from "@/lib/theme";
import { adminInput } from "./shared";
import { Button, Callout, Card, CardHeader } from "./ui";

// Estilo en línea con la paleta: aplica los colores solo dentro del contenedor (vistas previas del panel).
export const themeStyle = (t: SiteTheme) => themeVars(t) as CSSProperties;

export function ThemeEditor({ theme, saved, texts, onChange }: { theme: SiteTheme; saved: SiteTheme; texts: SiteTexts; onChange: (t: SiteTheme) => void }) {
  const set = (p: Partial<SiteTheme>) => onChange(mergeTheme({ ...theme, ...p }));
  const current = presetOf(theme);
  const issues = themeIssues(theme);

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
      <div className="flex min-w-0 flex-col gap-4">
        <Card aria-labelledby="th-presets" className="flex flex-col gap-4 p-4 sm:p-5">
          <CardHeader
            id="th-presets"
            icon={<PaletteIcon size={18} />}
            title="Paletas"
            subtitle="Combinaciones listas, con buen contraste. Elige una y ajusta los colores que quieras más abajo."
            actions={
              // Siempre visible (deshabilitado con los colores originales): así la cuadrícula no se mueve al elegir una paleta.
              <Button size="sm" variant="ghost" icon={<RefreshIcon size={14} />} disabled={sameTheme(theme, DEFAULT_THEME)} onClick={() => onChange({ ...DEFAULT_THEME })}>
                Colores originales
              </Button>
            }
          />
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-3">
            {THEME_PRESETS.map((p) => {
              const on = current?.id === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange({ ...p.theme })}
                    className={`flex h-full w-full flex-col gap-2.5 rounded-xl border p-2.5 text-left transition-[border-color,box-shadow] duration-150 ${on ? "border-focus ring-4 ring-focus/15" : "border-line hover:border-ink-subtle"}`}
                  >
                    <Swatches t={p.theme} />
                    <span className="flex flex-col gap-0.5 px-0.5">
                      <span className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                        {p.label}
                        {on && <CheckIcon size={14} className="text-success" />}
                        {sameTheme(p.theme, saved) && <span className="ml-auto rounded-full bg-canvas px-2 py-px text-[11px] font-bold text-ink-muted">Publicada</span>}
                      </span>
                      <span className="text-[12.5px] leading-snug text-ink-muted">{p.description}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {!current && <p className="text-[13px] text-ink-muted">Paleta personalizada: los colores ya no coinciden con ninguna de las paletas.</p>}
        </Card>

        <Card aria-labelledby="th-colors" className="flex flex-col gap-5 p-4 sm:p-5">
          <CardHeader id="th-colors" title="Color por color" subtitle="Haz clic en la muestra para elegir un color o escribe su código (#RRGGBB)." />
          {THEME_GROUPS.map((g) => (
            <fieldset key={g.label} className="flex min-w-0 flex-col gap-3">
              <legend className="mb-2 text-[12px] font-bold tracking-[.06em] text-ink-muted uppercase">{g.label}</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {g.fields.map((f) => (
                  <ColorField key={f.key} k={f.key} value={theme[f.key]} onChange={(v) => set({ [f.key]: v })} />
                ))}
              </div>
            </fieldset>
          ))}
        </Card>
      </div>

      {/* La vista previa acompaña al desplazarse solo si cabe entera en la ventana (con la barra de guardado debajo). */}
      <div className="flex min-w-0 flex-col gap-3 xl:[@media(min-height:860px)]:sticky xl:[@media(min-height:860px)]:top-4">
        {issues.length ? (
          <Callout tone="warning">
            <p className="font-semibold">Hay combinaciones difíciles de leer</p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {issues.map((x) => (
                <li key={`${x.fg}-${x.bg}`} className="flex flex-wrap items-center gap-x-2">
                  <span className="inline-flex flex-none" aria-hidden="true">
                    <span className="size-3.5 rounded-l-full ring-1 ring-black/10" style={{ background: theme[x.fg] }} />
                    <span className="size-3.5 rounded-r-full ring-1 ring-black/10" style={{ background: theme[x.bg] }} />
                  </span>
                  {`${x.label}: ${ratio(x.ratio)} (mínimo ${ratio(x.min)})`}
                </li>
              ))}
            </ul>
            <p className="mt-1.5">
              Aclara u oscurece «{themeField(issues[0].fg).label}» o «{themeField(issues[0].bg).label}» hasta que desaparezca el aviso.
            </p>
          </Callout>
        ) : (
          <Callout tone="success">
            Todos los textos se leen bien con estos colores.
          </Callout>
        )}
        <ThemePreview theme={theme} texts={texts} />
      </div>
    </div>
  );
}

const ratio = (n: number) => `${(Math.floor(n * 10) / 10).toLocaleString("es-CO")}:1`;

function Swatches({ t }: { t: SiteTheme }) {
  const keys: ThemeKey[] = ["bg", "surface", "card", "accent", "highlight"];
  return (
    <span aria-hidden="true" className="flex h-9 overflow-hidden rounded-lg ring-1 ring-black/10">
      {keys.map((k) => (
        <span key={k} className="flex-1" style={{ background: t[k] }} />
      ))}
    </span>
  );
}

// Muestra (selector nativo) + código. El código se puede escribir a medias: solo se aplica cuando es un color válido.
function ColorField({ k, value, onChange }: { k: ThemeKey; value: string; onChange: (v: string) => void }) {
  const f = themeField(k);
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setDraft(value);
  }
  const invalid = normalizeHex(draft) === null;
  const changed = value !== DEFAULT_THEME[k];

  return (
    <div className="flex min-w-0 gap-3 rounded-xl border border-line p-3">
      <label className="relative size-11 flex-none cursor-pointer overflow-hidden rounded-lg ring-1 ring-black/15 focus-within:ring-2 focus-within:ring-focus" style={{ background: value }}>
        <span className="sr-only">{`Elegir color: ${f.label}`}</span>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" />
      </label>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={id} className="text-[13px] font-semibold text-ink">
            {f.label}
          </label>
          {changed && (
            <button type="button" onClick={() => onChange(DEFAULT_THEME[k])} className="rounded-sm text-[12px] font-semibold text-ink-muted underline-offset-2 hover:text-ink hover:underline">
              Original<span className="sr-only">: {f.label}</span>
            </button>
          )}
        </div>
        <input
          id={id}
          type="text"
          spellCheck={false}
          autoComplete="off"
          maxLength={7}
          value={draft.toUpperCase()}
          aria-invalid={invalid || undefined}
          aria-describedby={`${id}-hint`}
          onChange={(e) => {
            setDraft(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex && e.target.value.replace("#", "").length === 6) onChange(hex);
          }}
          onBlur={() => {
            // Al salir del campo se aplica también el formato corto (#ABC); si no es un color, vuelve el anterior.
            const hex = normalizeHex(draft);
            if (hex && hex !== value) onChange(hex);
            else setDraft(value);
          }}
          className={`${adminInput} font-mono text-[13px] uppercase`}
        />
        <p id={`${id}-hint`} className="text-[12px] leading-snug text-ink-muted">
          {f.hint}
        </p>
      </div>
    </div>
  );
}

// Miniatura del sitio con la paleta aplicada solo aquí: menú, portada, una cabaña y el pie de página.
export function ThemePreview({ theme, texts }: { theme: SiteTheme; texts: SiteTexts }) {
  return (
    <section aria-labelledby="th-prev" className="flex flex-col gap-2">
      <h3 id="th-prev" className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted">
        <CheckIcon size={14} />
        Vista previa
      </h3>
      <div aria-hidden="true" style={themeStyle(theme)} className="overflow-hidden rounded-xl bg-bg text-on-dark shadow-panel transition-colors duration-200">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2">
            <LogoMark size={26} />
            <span className="display text-[1.15rem] leading-none">{config.name}</span>
          </span>
          <span className="btn-icon btn-card size-8">
            <MenuIcon size={14} />
          </span>
        </div>

        <div className="mx-3 flex flex-col gap-3 rounded-lg bg-surface p-4">
          <p className="display text-[2.1rem] leading-[.9]">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{texts.hero.title || "Título"}</span>
              {texts.hero.badge && <span className="rounded-sm bg-card px-1.5 py-1 font-body text-[.55rem] leading-tight font-semibold tracking-normal text-on-light normal-case">{texts.hero.badge}</span>}
            </span>
            {texts.hero.highlight && <span className="block text-accent">{texts.hero.highlight}</span>}
          </p>
          <p className="line-clamp-2 text-[.78rem] text-on-dark-muted">{texts.hero.description}</p>
          <span className="btn btn-cta min-h-9 gap-2 self-start py-1 pr-1 pl-3.5 text-[.72rem] font-bold">
            Reservar ahora
            <span className="grid size-7 place-items-center rounded-full bg-card text-on-light">
              <ArrowRightIcon size={13} />
            </span>
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2.5 bg-[linear-gradient(to_bottom,var(--color-bg),var(--color-deep)_45%)] px-3 pt-2 pb-4">
          <p className="flex -rotate-2 items-center gap-1.5 px-1 font-script text-[1.15rem]">
            <SparkleIcon size={14} />
            Elige la tuya
          </p>
          <p className="display px-1 text-[1.5rem] leading-none">
            Nuestras cabañas <span className="text-accent">tipo chalet</span>
          </p>
          <div className="flex flex-col gap-2 rounded-lg bg-card p-2.5 text-on-light">
            <div className="relative h-16 rounded-md bg-card-muted">
              <span className="absolute top-2 left-2 rounded-full bg-highlight px-2 py-0.5 text-[.6rem] font-extrabold text-on-light">Más reservada</span>
            </div>
            <div className="flex items-end justify-between gap-2 px-0.5">
              <div className="flex flex-col gap-1">
                <span className="display text-[1.25rem] leading-none">Chalet Premium</span>
                <span className="flex gap-1">
                  <span className="rounded-full bg-card-muted px-2 py-0.5 text-[.58rem] font-semibold">Jacuzzi</span>
                  <span className="rounded-full bg-card-muted px-2 py-0.5 text-[.58rem] font-semibold">Vista al nevado</span>
                </span>
              </div>
              <span className="btn btn-cta min-h-8 px-3 text-[.66rem]">Reservar</span>
            </div>
          </div>
        </div>

        <div className="bg-night px-4 py-2.5 text-[.62rem] text-on-dark-muted">{`© ${config.name} · Murillo, Tolima`}</div>
      </div>
    </section>
  );
}
