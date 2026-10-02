"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Brand } from "@/components/brand";
import { useSite } from "@/components/site-provider";
import { CondorSilhouette, EyeIcon, EyeOffIcon } from "@/components/icons";
import { api } from "@/lib/api";
import { config, isMockApi } from "@/lib/config";
import { adminInput } from "./shared";
import { Button, Callout, Field } from "./ui";

/* ───────────── Pantalla de carga ───────────── */

// Mientras se valida la sesión y se cargan los datos: el cóndor de la portada planea sobre la cordillera.
export function PanelLoader({ label = "Preparando tu panel…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="admin-dark relative grid min-h-dvh place-items-center overflow-hidden bg-bg px-6 text-on-dark">
      <svg aria-hidden="true" viewBox="0 0 1200 220" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-[26vh] w-full fill-surface">
        <path d="M0 220V150l140-62 92 40 128-90 108 82 92-42 140 72 118-92 112 64 120-52 150 82v68z" />
      </svg>
      <div className="relative flex flex-col items-center gap-7 motion-safe:animate-fade-in">
        <CondorSilhouette className="h-auto w-[clamp(150px,30vw,200px)] fill-on-dark/90 motion-safe:animate-glide" />
        <p className="flex flex-col items-center leading-none">
          <span className="text-[.72rem] font-extrabold tracking-[.32em] uppercase">Cabañas</span>
          <span className="display mt-1.5 text-[clamp(2rem,6vw,2.6rem)] tracking-[.03em]">{config.name.replace(/^Cabañas\s+/i, "")}</span>
        </p>
        <span aria-hidden="true" className="relative h-[3px] w-44 overflow-hidden rounded-full bg-on-dark/15">
          <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-highlight motion-safe:animate-loader-bar" />
        </span>
        <span className="text-[13px] font-medium text-on-dark/70">{label}</span>
      </div>
    </div>
  );
}

/* ───────────── Ingreso ───────────── */

const LOGIN_ERRORS: Record<number, string> = {
  401: "Credenciales no válidas.",
  403: "Esta cuenta no tiene acceso al panel.",
  503: "El servidor no está configurado. Revisa las variables de entorno de Supabase.",
};

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [lg, setLg] = useState({ email: "", password: "", error: "", loading: false });
  const [show, setShow] = useState(false);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!lg.email || !lg.password) return setLg({ ...lg, error: "Escribe tu correo y tu contraseña." });
    setLg({ ...lg, loading: true, error: "" });
    try {
      const r = await api.admin.login({ email: lg.email, password: lg.password });
      if (r.status !== 200) return setLg({ ...lg, loading: false, error: LOGIN_ERRORS[r.status] ?? "No se pudo iniciar sesión." });
      setLg({ ...lg, loading: false, password: "" });
      onSuccess();
    } catch {
      setLg({ ...lg, loading: false, error: "Error de conexión. Inténtalo de nuevo." });
    }
  }
  const missing = (v: string) => (lg.error && !v ? ({ "aria-invalid": true } as const) : {});
  // La foto y el título de la portada del sitio (Contenido del sitio → Portada): si cambian allá, cambian aquí.
  const { photos, texts } = useSite();
  const photo = photos["hero-main"];
  return (
    <main className="admin-dark relative grid min-h-dvh bg-bg text-on-dark lg:grid-cols-[minmax(0,1.2fr)_minmax(460px,1fr)]">
      {/* Foto: arriba en el celular, mitad izquierda en pantallas anchas. */}
      <div aria-hidden="true" className="relative h-[38vh] min-h-[240px] overflow-hidden bg-surface lg:sticky lg:top-0 lg:h-dvh">
        {photo ? (
          <Image src={photo} alt="" fill preload sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover motion-safe:animate-photo-settle" />
        ) : (
          <>
            <svg viewBox="0 0 1200 220" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-1/2 w-full fill-bg/70">
              <path d="M0 220V150l140-62 92 40 128-90 108 82 92-42 140 72 118-92 112 64 120-52 150 82v68z" />
            </svg>
            <CondorSilhouette className="absolute top-[28%] left-1/2 h-auto w-[min(38%,260px)] -translate-x-1/2 fill-on-dark/25 motion-safe:animate-glide" />
          </>
        )}
        {/* Velos para leer la marca y el título sobre cualquier foto; en el celular la foto se funde con el fondo. */}
        <span className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/45 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-bg via-bg/55 to-transparent lg:h-1/2 lg:from-black/70 lg:via-black/25" />
        <span className="absolute top-5 left-5 flex items-center gap-3 sm:top-7 sm:left-8">
          <Brand circle={44} mark={32} wordSize="1.35rem" eyebrowSize=".62rem" />
        </span>
        <p className="display absolute right-8 bottom-10 left-8 hidden text-[clamp(3rem,5.2vw,5.6rem)] leading-[.9] tracking-[.005em] text-balance lg:block">
          {texts.hero.title} {texts.hero.highlight && <span className="text-accent">{texts.hero.highlight}</span>}
          {texts.hero.badge && <span className="mt-4 block font-body text-[15px] leading-snug font-semibold tracking-normal text-on-dark/85 normal-case">{texts.hero.badge}</span>}
        </p>
      </div>

      <div className="relative z-1 -mt-20 flex flex-col items-center justify-center gap-6 overflow-hidden px-4 pb-10 lg:mt-0 lg:px-12 lg:py-12">
        {/* La cordillera de la pantalla de carga, al pie del lado del formulario. */}
        <svg aria-hidden="true" viewBox="0 0 1200 220" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[24vh] w-full fill-surface lg:block">
          <path d="M0 220V150l140-62 92 40 128-90 108 82 92-42 140 72 118-92 112 64 120-52 150 82v68z" />
        </svg>
        <form noValidate onSubmit={onSubmit} aria-labelledby="lg-title" className="admin-surface relative flex w-full max-w-[400px] flex-col gap-5 rounded-2xl bg-panel p-6 text-ink shadow-overlay motion-safe:animate-pop-in sm:p-8">
          <div>
            <h1 id="lg-title" className="text-[22px] leading-tight font-extrabold tracking-[-0.01em]">
              Panel de reservas
            </h1>
            <p className="mt-1 text-[14px] text-ink-muted">{isMockApi ? "Modo simulado: entra con cualquier correo y contraseña." : "Ingresa con tu cuenta de administración."}</p>
          </div>
          <Field label="Correo">
            {(p) => <input {...p} {...missing(lg.email)} type="email" autoComplete="username" inputMode="email" value={lg.email} onChange={(e) => setLg({ ...lg, email: e.target.value })} className={adminInput} />}
          </Field>
          <Field label="Contraseña">
            {(p) => (
              <div className="relative">
                <input {...p} {...missing(lg.password)} type={show ? "text" : "password"} autoComplete="current-password" value={lg.password} onChange={(e) => setLg({ ...lg, password: e.target.value })} className={`${adminInput} pr-12`} />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={show}
                  className="btn-icon absolute top-1/2 right-1 size-9 -translate-y-1/2 text-ink-muted transition-colors hover:bg-ink/6 hover:text-ink"
                >
                  {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            )}
          </Field>
          {lg.error && (
            <Callout tone="error" role="alert">
              {lg.error}
            </Callout>
          )}
          <Button type="submit" variant="primary" size="lg" loading={lg.loading}>
            {lg.loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
        <Link href="/" className="relative rounded-sm text-[13.5px] font-semibold text-on-dark/75 transition-colors hover:text-on-dark">
          ← Volver al sitio
        </Link>
      </div>
    </main>
  );
}
