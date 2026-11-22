"use client";

// Pagos en línea con Wompi para el huésped: los botones para pagar (en «Mi reserva» y en el enlace de pago), la página
// del enlace de pago (/pagar), el resultado al volver de la pasarela (/pagar/resultado) y el simulador de desarrollo.
// El valor de cada opción lo calcula el servidor; aquí solo se elige qué pagar.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/client/api";
import { parseExpiry, validCardNumber } from "@/lib/card";
import { cop, fmtDate } from "@/lib/format";
import type { OnlinePayInfo, OnlinePayOption, OnlinePayStatus } from "@/lib/types";
import { CheckIcon } from "@/components/ui/icons";
import { useSite } from "@/components/site/site-provider";

const OPTION_LABEL: Record<OnlinePayOption["kind"], string> = { deposit: "Pagar el abono", full: "Pagar el total", balance: "Pagar el saldo" };

type Access = { code: string; email?: string; k?: string };

// Botones para pagar en línea. Sin pagos en línea activos o sin nada por pagar, no muestra nada.
export function OnlinePayButtons({ access, info: given }: { access: Access; info?: OnlinePayInfo | null }) {
  const [loaded, setLoaded] = useState<OnlinePayInfo | null>(null);
  // Con `info` ya cargado (página del enlace de pago) no se vuelve a pedir.
  const info = given !== undefined ? given : loaded;
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (given !== undefined) return;
    let live = true;
    api.payments
      .info(access)
      .then((r) => live && r.status === 200 && r.data && setLoaded(r.data))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [access.code, access.email, access.k, given]); // eslint-disable-line react-hooks/exhaustive-deps

  const [chosen, setChosen] = useState<OnlinePayOption | null>(null);

  // Con Wompi solo se paga con tarjeta y la tarjeta se escribe aquí; sin el formulario disponible no se ofrece.
  if (!info?.provider || !info.options.length || (info.provider === "wompi" && !info.card)) return null;

  // Simulador de desarrollo: sin tarjeta, directo a su página.
  async function simulate(o: OnlinePayOption) {
    setBusy(o.kind);
    setError("");
    try {
      const r = await api.payments.start({ ...access, kind: o.kind });
      if (r.status === 200 && r.data && "url" in r.data) return window.location.assign(r.data.url);
      setError(r.status === 409 ? "Este pago ya no está pendiente. Actualiza la página." : "No pudimos abrir el pago. Inténtalo de nuevo.");
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    }
    setBusy(null);
  }

  if (chosen && info.card) return <CardForm access={access} option={chosen} card={info.card} sandbox={info.sandbox} onCancel={() => setChosen(null)} />;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {info.options.map((o, i) => (
          <button
            key={o.kind}
            type="button"
            disabled={!!busy}
            onClick={() => (info.card ? setChosen(o) : simulate(o))}
            className={`btn min-h-12 gap-2 px-5 ${i === info.options.length - 1 ? "btn-cta" : "btn-outline-light"} disabled:opacity-60`}
          >
            {busy === o.kind ? "Abriendo el pago…" : `${OPTION_LABEL[o.kind]} · ${cop(o.amount)}`}
          </button>
        ))}
      </div>
      <p className="text-[.82rem] font-semibold opacity-80">
        Pago en línea con tarjeta de crédito, procesado por Wompi.
        {info.sandbox ? " (Modo de pruebas: no se cobra dinero real.)" : ""}
        {info.provider === "simulado" ? " (Pago simulado de desarrollo.)" : ""}
      </p>
      {error && (
        <p role="alert" className="text-[.88rem] font-bold">
          {error}
        </p>
      )}
    </div>
  );
}

/* ───────────── Formulario de tarjeta ───────────── */

const groupDigits = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

type CardFields = { number: string; holder: string; expiry: string; cvc: string };

function CardForm({
  access,
  option,
  card,
  sandbox,
  onCancel,
}: {
  access: Access;
  option: OnlinePayOption;
  card: NonNullable<OnlinePayInfo["card"]>;
  sandbox: boolean;
  onCancel: () => void;
}) {
  const [f, setF] = useState<CardFields>({ number: "", holder: "", expiry: "", cvc: "" });
  const [installments, setInstallments] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [errs, setErrs] = useState<Partial<Record<keyof CardFields | "accepted", string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof CardFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v =
      k === "number"
        ? groupDigits(e.target.value)
        : k === "expiry"
          ? formatExpiry(e.target.value)
          : k === "cvc"
            ? e.target.value.replace(/\D/g, "").slice(0, 4)
            : e.target.value;
    setF((p) => ({ ...p, [k]: v }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const exp = parseExpiry(f.expiry);
    const holder = f.holder.trim().replace(/\s+/g, " ");
    const next: typeof errs = {};
    if (!validCardNumber(f.number)) next.number = "Revisa el número de la tarjeta.";
    if (holder.length < 5) next.holder = "Escribe el nombre como aparece en la tarjeta.";
    if (!exp) next.expiry = "Escribe una fecha vigente (MM/AA).";
    if (!/^\d{3,4}$/.test(f.cvc)) next.cvc = "3 o 4 dígitos.";
    if (!accepted) next.accepted = "Debes aceptar para pagar.";
    setErrs(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError("");
    try {
      // La tarjeta va directo a Wompi (llave pública); a este sitio solo llega el token.
      const t = await fetch(card.tokensUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${card.publicKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ number: f.number.replace(/\D/g, ""), cvc: f.cvc, exp_month: exp!.month, exp_year: exp!.year, card_holder: holder }),
      });
      const token = ((await t.json().catch(() => null)) as { data?: { id?: string } } | null)?.data?.id;
      if (!t.ok || !token) {
        setError("Wompi no aceptó los datos de la tarjeta. Revísalos e inténtalo de nuevo.");
        return setBusy(false);
      }
      const r = await api.payments.start({ ...access, kind: option.kind, card: { token, installments }, accepted: true });
      if (r.status === 200 && r.data && "url" in r.data) return window.location.assign(r.data.url);
      setError(
        r.status === 409
          ? "Este pago ya no está pendiente. Actualiza la página."
          : r.status === 422
            ? "La tarjeta fue rechazada. Revisa los datos o usa otra tarjeta."
            : "No pudimos procesar el pago. Inténtalo de nuevo.",
      );
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    }
    setBusy(false);
  }

  const field = (k: keyof CardFields, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`cc-${k}`} className="field-label">
        {label}
      </label>
      <input
        id={`cc-${k}`}
        value={f[k]}
        onChange={set(k)}
        aria-invalid={!!errs[k]}
        aria-describedby={`cc-${k}-e`}
        className="field-input"
        disabled={busy}
        {...props}
      />
      <p id={`cc-${k}-e`} aria-live="polite" className="field-error min-h-[1em]">
        {errs[k]}
      </p>
    </div>
  );

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-3 rounded-md bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[1.05rem] font-extrabold">{`${OPTION_LABEL[option.kind]} con tarjeta de crédito`}</h3>
        <span className="display text-[1.4rem] leading-none">{cop(option.amount)}</span>
      </div>
      {sandbox && <p className="text-[.82rem] font-semibold opacity-80">Modo de pruebas: no se cobra dinero real. Usa la tarjeta 4242 4242 4242 4242.</p>}
      {field("number", "Número de la tarjeta", { inputMode: "numeric", autoComplete: "cc-number", placeholder: "0000 0000 0000 0000" })}
      {field("holder", "Nombre en la tarjeta", { autoComplete: "cc-name", autoCapitalize: "characters", maxLength: 64 })}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {field("expiry", "Vence", { inputMode: "numeric", autoComplete: "cc-exp", placeholder: "MM/AA" })}
        {field("cvc", "CVC", { inputMode: "numeric", autoComplete: "cc-csc", placeholder: "123" })}
        <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
          <label htmlFor="cc-installments" className="field-label">
            Cuotas
          </label>
          <select id="cc-installments" value={installments} onChange={(e) => setInstallments(Number(e.target.value))} disabled={busy} className="field-input">
            {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "1 cuota" : `${n} cuotas`}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-start gap-2.5 text-[.88rem] font-semibold">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} disabled={busy} className="mt-1 size-4 shrink-0" />
        <span>
          Acepto el{" "}
          <a href={card.termsUrl} target="_blank" rel="noopener noreferrer" className="underline">
            reglamento de Wompi
          </a>{" "}
          y autorizo el{" "}
          <a href={card.privacyUrl} target="_blank" rel="noopener noreferrer" className="underline">
            tratamiento de mis datos personales
          </a>
          .
        </span>
      </label>
      {errs.accepted && <p className="field-error">{errs.accepted}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="btn btn-cta min-h-12 px-5 disabled:opacity-60">
          {busy ? "Procesando el pago…" : `Pagar ${cop(option.amount)}`}
        </button>
        <button type="button" disabled={busy} onClick={onCancel} className="btn btn-outline-light min-h-12 px-5">
          Volver
        </button>
      </div>
      <p className="text-[.8rem] font-semibold opacity-75">Los datos de tu tarjeta van directo a Wompi: este sitio no los recibe ni los guarda.</p>
      {error && (
        <p role="alert" className="text-[.88rem] font-bold">
          {error}
        </p>
      )}
    </form>
  );
}

/* ───────────── /pagar: enlace de pago ───────────── */

export function PayPage() {
  const params = useSearchParams();
  const { cabinName } = useSite();
  const code = (params.get("code") ?? "").toUpperCase();
  const k = params.get("k") ?? "";
  const [info, setInfo] = useState<OnlinePayInfo | null | undefined>(undefined);
  const complete = !!code && !!k;

  useEffect(() => {
    if (!complete) return;
    api.payments
      .info({ code, k })
      .then((r) => setInfo(r.status === 200 && r.data ? r.data : null))
      .catch(() => setInfo(null));
  }, [code, k, complete]);

  if (complete && info === undefined) return <Card title="Cargando tu reserva…" />;
  if (!complete || !info)
    return (
      <Card title="Enlace de pago no válido">
        <p className="font-semibold">Revisa que el enlace esté completo o pide uno nuevo por WhatsApp.</p>
      </Card>
    );
  const due = Math.max(0, info.total - info.paid);
  return (
    <Card eyebrow={`Reserva ${info.code}`} title={`Hola, ${info.guestFirstName}`}>
      <dl className="flex flex-col rounded-md bg-card-muted px-4 py-1.5">
        {[
          { k: info.cabins.length > 1 ? "Cabañas" : "Cabaña", v: info.cabins.map(cabinName).join(", ") },
          { k: "Fechas", v: `${fmtDate(info.checkIn)} → ${fmtDate(info.checkOut)}` },
          { k: "Valor total", v: cop(info.total) },
          { k: "Pagado", v: cop(info.paid) },
          { k: "Por pagar", v: cop(due), strong: true },
        ].map((x, i) => (
          <div key={x.k} className={`flex items-baseline justify-between gap-4 py-2.5 ${i ? "border-t-2 border-dotted border-on-light/15" : ""}`}>
            <dt className={x.strong ? "font-extrabold" : "font-semibold"}>{x.k}</dt>
            <dd className={`text-right ${x.strong ? "display text-[1.6rem] leading-none" : "font-bold"}`}>{x.v}</dd>
          </div>
        ))}
      </dl>
      {!info.provider ? (
        <p className="font-semibold">Los pagos en línea no están disponibles en este momento. Escríbenos por WhatsApp para pagar por transferencia.</p>
      ) : info.options.length ? (
        <OnlinePayButtons access={{ code: info.code, k }} info={info} />
      ) : (
        <p className="flex items-center gap-2 font-bold">
          <CheckIcon size={16} />
          No tienes nada pendiente por pagar.
        </p>
      )}
    </Card>
  );
}

/* ───────────── /pagar/resultado: vuelta de la pasarela ───────────── */

const RESULT: Record<OnlinePayStatus["status"], { title: string; text: string; tone: "ok" | "wait" | "bad" }> = {
  initiated: { title: "Estamos esperando tu pago", text: "Si ya pagaste, en unos segundos lo verás aquí.", tone: "wait" },
  pending: { title: "Tu pago está en proceso", text: "La entidad financiera aún no lo confirma. Te avisamos por correo cuando se apruebe.", tone: "wait" },
  approved: { title: "¡Pago recibido!", text: "Ya quedó registrado en tu reserva. Te enviamos la confirmación por correo.", tone: "ok" },
  declined: { title: "El pago no se aprobó", text: "No se hizo ningún cobro. Puedes intentarlo de nuevo con otro medio de pago.", tone: "bad" },
  error: { title: "No se pudo completar el pago", text: "No se hizo ningún cobro. Inténtalo de nuevo o escríbenos por WhatsApp.", tone: "bad" },
  unapplied: {
    title: "Recibimos tu pago",
    text: "Nuestro equipo lo está revisando para aplicarlo a tu reserva y te contactará muy pronto.",
    tone: "wait",
  },
};

export function PayResult() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? "";
  const id = params.get("id") ?? "";
  const [s, setS] = useState<OnlinePayStatus | null | undefined>(undefined);

  const load = useCallback(
    () =>
      api.payments
        .status({ ref, ...(id && { id }) })
        .then((r) => setS(r.status === 200 && r.data ? r.data : null))
        .catch(() => setS(null)),
    [ref, id],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Mientras está en proceso, se vuelve a consultar (hasta unos dos minutos).
  const waiting = s?.status === "initiated" || s?.status === "pending";
  useEffect(() => {
    if (!waiting) return;
    let n = 0;
    const t = setInterval(() => {
      if (++n > 40) return clearInterval(t);
      load();
    }, 3000);
    return () => clearInterval(t);
  }, [waiting, load]);

  if (s === undefined) return <Card title="Consultando tu pago…" />;
  if (!s)
    return (
      <Card title="No encontramos ese pago">
        <p className="font-semibold">Si pagaste, escríbenos por WhatsApp con el comprobante y lo revisamos.</p>
      </Card>
    );
  const r = RESULT[s.status];
  return (
    <Card t={r.tone} eyebrow={`Reserva ${s.code} · ${cop(s.amount)}`} title={r.title}>
      <p className="font-semibold">{r.text}</p>
      {s.detail && <p className="text-[.9rem] font-semibold opacity-80">{s.detail}</p>}
      <Link href={`/mi-reserva?code=${encodeURIComponent(s.code)}`} className="btn btn-outline-light min-h-12 self-start px-5">
        Ver mi reserva
      </Link>
    </Card>
  );
}

/* ───────────── /pagar/simulado: solo desarrollo ───────────── */

export function PaySimulator() {
  const params = useSearchParams();
  const router = useRouter();
  const ref = params.get("ref") ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function finish(result: "approved" | "declined") {
    setBusy(true);
    const r = await api.payments.simulate({ ref, result }).catch(() => null);
    if (r?.status === 200) return router.push(`/pagar/resultado?ref=${encodeURIComponent(ref)}`);
    setError("El simulador no está disponible.");
    setBusy(false);
  }
  return (
    <Card eyebrow="Pago simulado · solo desarrollo" title="¿Qué pasa con este pago?">
      <p className="font-semibold">{`Referencia ${ref}. No se cobra nada: el resultado pasa por las mismas funciones que un pago de Wompi.`}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => finish("approved")} className="btn btn-cta min-h-12 px-5">
          Aprobar
        </button>
        <button type="button" disabled={busy} onClick={() => finish("declined")} className="btn btn-outline-light min-h-12 px-5">
          Rechazar
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </Card>
  );
}

/* ───────────── Pieza ───────────── */

const tone = {
  wait: "bg-[color-mix(in_srgb,var(--color-highlight)_26%,var(--color-card))]",
  ok: "bg-[color-mix(in_srgb,var(--color-accent)_30%,var(--color-card))]",
  bad: "bg-[color-mix(in_srgb,var(--color-status-cancelled)_34%,var(--color-card))]",
  plain: "bg-card",
};

function Card({ t = "plain", eyebrow, title, children }: { t?: keyof typeof tone; eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <section aria-labelledby="pay-card" className={`flex flex-col gap-3.5 rounded-lg p-[clamp(20px,3.5vw,32px)] text-on-light ${tone[t]}`}>
      {eyebrow && <span className="text-[.74rem] font-extrabold tracking-[.08em] uppercase">{eyebrow}</span>}
      <h2 id="pay-card" className="display text-[clamp(1.4rem,3vw,1.7rem)] leading-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}
