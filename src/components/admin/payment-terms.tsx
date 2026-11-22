"use client";

// Condiciones de pago (solo administradores), como tablero: el abono para confirmar (en % del total) con su control y su
// reparto en pesos; lo que ve el huésped en «Mi reserva»; los datos para pagar; el abono y el saldo de cada cabaña con
// estos valores; y cómo va el cobro de abonos en los últimos 90 días. El abono lo usan las cotizaciones del sitio y del
// panel; las reservas que ya existen conservan el de su cotización.
import { useRef, useState } from "react";
import { AlertIcon, CheckIcon, ClockIcon, InfoIcon, QrIcon, TrashIcon, UploadIcon, WalletIcon } from "@/components/ui/icons";
import { api } from "@/lib/client/api";
import { isFromBooking } from "@/lib/booking";
import { addDays, cop, plural } from "@/lib/format";
import { PAYMENT_QR_SLOT, TEXT_LIMITS } from "@/lib/site";
import { resizeImage } from "@/lib/client/image-resize";
import { useAdmin } from "@/components/admin/context";
import { MODULES } from "@/components/admin/routes";
import { adminInput } from "@/components/admin/shared";
import { Panel, money } from "@/components/admin/board";
import { Button, Callout, Field, FieldError, RangeSlider, SaveBar, Stepper, enter } from "@/components/admin/ui";

// Valores frecuentes para elegir con un toque.
const QUICK = [20, 30, 50, 100];
// Reserva de ejemplo para mostrar qué significa el porcentaje.
const SAMPLE = 400_000;
// Las dos partes del total: abono y saldo (colores validados para daltonismo, siempre con su leyenda y valores).
const ABONO = "var(--color-chart-a)";
const SALDO = "var(--color-chart-b)";

export function PaymentTermsView() {
  const { data, setData, toast, onAuthError } = useAdmin();
  const saved = { depositPct: data.site.settings.depositPct, instructions: data.site.texts.payment.instructions, key: data.site.texts.payment.key };
  const [f, setF] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = f.depositPct !== saved.depositPct || f.instructions.trim() !== saved.instructions.trim() || f.key.trim() !== saved.key.trim();
  const setPct = (v: number) => setF((x) => ({ ...x, depositPct: Math.min(100, Math.max(1, Math.round(v))) }));

  async function save() {
    if (busy) return;
    setBusy(true);
    setErrors({});
    try {
      const r = await api.admin.savePaymentTerms({ depositPct: f.depositPct, instructions: f.instructions.trim(), key: f.key.trim() });
      if (r.status === 401 || r.status === 403) return onAuthError();
      if (r.status !== 200 || !r.data) {
        const fields = (r.data as { fields?: Record<string, string> } | null)?.fields;
        if (fields) setErrors(fields);
        else toast("No se pudieron guardar las condiciones de pago", "error");
        return;
      }
      const site = r.data;
      setData((d) => ({ ...d, site }));
      setF({ depositPct: site.settings.depositPct, instructions: site.texts.payment.instructions, key: site.texts.payment.key });
      toast("Condiciones de pago guardadas");
    } catch {
      toast("Error de conexión. Inténtalo de nuevo.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header {...enter(0)} className="min-w-0">
        <p className="text-[13px] font-medium text-ink-muted">Cuánto paga el huésped para confirmar su reserva y cómo te paga</p>
        <h1 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-[-0.025em] text-ink">{MODULES.condiciones.label}</h1>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div {...enter(1)} className="flex min-w-0 flex-col gap-4 xl:col-span-7">
          <DepositPanel pct={f.depositPct} savedPct={saved.depositPct} onChange={setPct} error={errors.depositPct} />
        </div>
        <div {...enter(1.6)} className="min-w-0 xl:col-span-5">
          <GuestPreview pct={f.depositPct} instructions={f.instructions.trim()} payKey={f.key.trim()} qr={data.site.photos[PAYMENT_QR_SLOT]} />
        </div>

        <div {...enter(2.2)} className="min-w-0 xl:col-span-7">
          <Panel
            id="pt-instructions"
            title="Datos para pagar"
            subtitle="Cuenta, llave y QR donde el huésped paga el abono y el saldo. Los ve en «Mi reserva» y en el correo de reserva recibida."
            action={<WalletIcon size={17} className="text-ink-muted" />}
          >
            <Field
              label="Instrucciones de pago"
              error={errors.instructions}
              hint={`Banco, tipo y número de cuenta, titular, o llave de Bre-B / Nequi. Se muestran tal cual las escribas. ${f.instructions.length}/${TEXT_LIMITS.instructions}`}
            >
              {(p) => (
                <textarea
                  {...p}
                  rows={6}
                  maxLength={TEXT_LIMITS.instructions}
                  value={f.instructions}
                  onChange={(e) => setF((x) => ({ ...x, instructions: e.target.value }))}
                  placeholder="Bancolombia · Ahorros 000-000000-00 · a nombre de …"
                  className={`${adminInput} resize-y leading-relaxed`}
                />
              )}
            </Field>
            {/* Uso del límite de caracteres. */}
            <span aria-hidden="true" className="block h-1 overflow-hidden rounded-full bg-panel">
              <span
                className="block h-full rounded-full bg-ink transition-[width] duration-300"
                style={{ width: `${Math.min(100, (f.instructions.length / TEXT_LIMITS.instructions) * 100)}%` }}
              />
            </span>
            <Field
              label="Llave Bre-B (opcional)"
              error={errors.key}
              hint="Celular, correo, documento o llave alfanumérica. El huésped la ve con un botón para copiarla."
              className="mt-2"
            >
              {(p) => (
                <input
                  {...p}
                  type="text"
                  autoComplete="off"
                  maxLength={TEXT_LIMITS.paymentKey}
                  value={f.key}
                  onChange={(e) => setF((x) => ({ ...x, key: e.target.value }))}
                  placeholder="@condordelruiz · 3001234567"
                  className={adminInput}
                />
              )}
            </Field>
            <PaymentQr />
            {!f.instructions.trim() && !f.key.trim() && !data.site.photos[PAYMENT_QR_SLOT] && (
              <Callout tone="warning">Aún no hay datos para pagar: el huésped solo verá que debe escribir por WhatsApp o pagar en recepción.</Callout>
            )}
          </Panel>
        </div>
        <div {...enter(2.8)} className="min-w-0 xl:col-span-5">
          <Collection />
        </div>

        <div {...enter(3.4)} className="min-w-0 xl:col-span-12">
          <ByCabin pct={f.depositPct} />
        </div>
      </div>

      <SaveBar
        dirty={dirty}
        onDiscard={() => {
          setF(saved);
          setErrors({});
        }}
        onSave={save}
        saveLabel={busy ? "Guardando…" : "Guardar cambios"}
      />
    </>
  );
}

/* ───────────── Abono ───────────── */

// El porcentaje en grande con su deslizador, los valores frecuentes, el número exacto y el reparto de una reserva de ejemplo.
function DepositPanel({ pct, savedPct, onChange, error }: { pct: number; savedPct: number; onChange: (v: number) => void; error?: string }) {
  const deposit = Math.round((SAMPLE * pct) / 100);
  return (
    <>
      <Panel
        id="pt-deposit"
        title="Abono para confirmar"
        subtitle="Porcentaje del total que el huésped paga para que su reserva quede confirmada. El resto es el saldo."
      >
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <p aria-hidden="true" className="text-[64px] leading-none font-semibold tracking-[-0.05em] text-ink tabular-nums">
            {pct}
            <span className="text-[28px] text-ink-muted"> %</span>
          </p>
          <div role="group" aria-label="Valores frecuentes" className="flex flex-wrap gap-1.5">
            {QUICK.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={pct === v}
                onClick={() => onChange(v)}
                className={`h-8 rounded-full px-3.5 text-[12.5px] font-medium transition-colors ${pct === v ? "bg-ink text-paper" : "bg-panel text-ink-muted hover:bg-line hover:text-ink"}`}
              >
                {v === 100 ? "Total" : `${v} %`}
              </button>
            ))}
          </div>
        </div>

        {/* Deslizador y número exacto: los dos cambian el mismo valor. La pista queda a la altura del campo de al lado
            (alineados por abajo) y su escala cuelga debajo, por eso el espacio extra bajo la fila. */}
        <div className="grid grid-cols-1 items-end gap-x-6 gap-y-7 pb-4 sm:grid-cols-[minmax(0,1fr)_170px]">
          <RangeSlider
            value={pct}
            onChange={onChange}
            min={1}
            max={100}
            label="Porcentaje del abono"
            valueText={`${pct} %`}
            color={ABONO}
            ticks={[1, 25, 50, 75, 100]}
            tickLabel={(v) => `${v} %`}
            saved={savedPct}
            savedLabel={(v) => `Guardado: ${v} %`}
          />
          <Field label="Exacto" error={error}>
            {(p) => <Stepper id={p.id} describedBy={p["aria-describedby"]} value={pct} onChange={onChange} min={1} max={100} unit="%" />}
          </Field>
        </div>

        {/* Reparto de la reserva de ejemplo: barra alta en dos partes con su porcentaje adentro, y la leyenda con los pesos. */}
        <div className="flex flex-col gap-2.5 rounded-[16px] bg-panel p-4 ring-1 ring-line ring-inset">
          <p className="text-[12px] font-medium text-ink-muted">{`En una reserva de ${cop(SAMPLE)}`}</p>
          <div role="img" aria-label={`Abono ${cop(deposit)} (${pct} %), saldo ${cop(SAMPLE - deposit)} (${100 - pct} %)`} className="flex h-7 gap-[2px]">
            <span
              className="flex h-full items-center rounded-[4px] px-2 text-[11.5px] font-semibold text-white transition-[width] duration-300"
              style={{ width: `${pct}%`, background: ABONO }}
            >
              {pct >= 12 ? `${pct} %` : ""}
            </span>
            {pct < 100 && (
              <span className="flex h-full flex-1 items-center rounded-[4px] px-2 text-[11.5px] font-semibold text-white" style={{ background: SALDO }}>
                {100 - pct >= 12 ? `${100 - pct} %` : ""}
              </span>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { k: "Abono para confirmar", v: cop(deposit), dot: ABONO },
              { k: "Saldo", v: cop(SAMPLE - deposit), dot: SALDO },
              { k: "Total", v: cop(SAMPLE), dot: "" },
            ].map((x) => (
              <div key={x.k} className="min-w-0">
                <dt className="flex items-center gap-1.5 text-[12px] text-ink-muted">
                  {x.dot && <span aria-hidden="true" className="size-2 rounded-full" style={{ background: x.dot }} />}
                  {x.k}
                </dt>
                <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">{x.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="flex items-start gap-2 text-[12.5px] text-ink-muted">
          <InfoIcon size={14} className="mt-0.5 flex-none" />
          Aplica a las reservas nuevas y a las que se reprogramen. Las que ya existen conservan el abono con el que se cotizaron.
        </p>
      </Panel>
      {pct !== savedPct && (
        <Callout tone="warning">
          {`Si el texto de las políticas del sitio menciona el ${savedPct} %, recuerda actualizarlo: el sitio mostrará ${pct} % en la cotización y en «Mi reserva».`}
        </Callout>
      )}
    </>
  );
}

/* ───────────── Vista del huésped ───────────── */

// Tarjeta oscura con una maqueta de «Mi reserva» mientras la reserva espera el abono.
function GuestPreview({ pct, instructions, payKey, qr }: { pct: number; instructions: string; payKey: string; qr?: string }) {
  const deposit = Math.round((SAMPLE * pct) / 100);
  return (
    <section aria-labelledby="pt-preview" className="flex h-full flex-col gap-5 rounded-[22px] bg-ink p-6 text-paper">
      <div>
        <h2 id="pt-preview" className="text-[13px] font-medium text-paper/70">
          Así lo ve el huésped
        </h2>
        <p className="mt-1 text-[12px] text-paper/50">En «Mi reserva», mientras su reserva espera el abono.</p>
      </div>
      <div className="flex flex-1 flex-col gap-3 rounded-[18px] bg-paper p-4 text-ink">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold text-ink-muted">Mi reserva</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow px-2.5 py-0.5 text-[11.5px] font-semibold text-ink">
            <ClockIcon size={12} />
            Esperando el abono
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[13px]">
          <span className="text-ink-muted">Valor total</span>
          <span className="font-semibold tabular-nums">{cop(SAMPLE)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[13px]">
          <span className="font-semibold">{`Abono para confirmar (${pct} %)`}</span>
          <span className="text-[16px] font-semibold tabular-nums">{cop(deposit)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[13px]">
          <span className="text-ink-muted">Saldo antes de llegar</span>
          <span className="tabular-nums">{cop(SAMPLE - deposit)}</span>
        </div>
        <div className="h-px bg-line" aria-hidden="true" />
        {instructions || payKey || qr ? (
          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-[12.5px] leading-relaxed">
              {instructions && (
                <p className="whitespace-pre-wrap">
                  <span className="font-semibold">Paga por transferencia: </span>
                  {instructions}
                </p>
              )}
              {payKey && (
                <p>
                  <span className="font-semibold">Llave Bre-B: </span>
                  <span className="break-all">{payKey}</span>
                </p>
              )}
            </div>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element -- QR subido por el negocio, con su tamaño original
              <img src={qr} alt="QR para pagar" className="size-20 flex-none rounded-[10px] bg-paper object-contain ring-1 ring-line" />
            )}
          </div>
        ) : (
          <p className="flex items-start gap-2 text-[12.5px] text-ink-muted">
            <AlertIcon size={14} className="mt-0.5 flex-none" />
            Sin datos para pagar: se le pide escribir por WhatsApp.
          </p>
        )}
      </div>
      <p className="flex items-start gap-2 text-[12px] text-paper/60">
        <CheckIcon size={14} className="mt-0.5 flex-none" />
        Cuando recibas un pago, regístralo en la ficha de la reserva: abono, total u otro valor, en efectivo o por transferencia.
      </p>
    </section>
  );
}

/* ───────────── QR para pagar ───────────── */

const QR_ERRORS: Record<number, string> = {
  413: "La imagen pesa demasiado (máximo 5 MB).",
  415: "Formato no compatible. Usa JPG, PNG o WebP.",
  501: "La subida de imágenes no está disponible en modo simulado.",
};

// Imagen del QR del banco (Bre-B, Bancolombia, Nequi…). Se publica al subirla, sin esperar a «Guardar cambios».
function PaymentQr() {
  const { data, setData, ask, toast, onAuthError } = useAdmin();
  const qr = data.site.photos[PAYMENT_QR_SLOT];
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("Elige una imagen JPG, PNG o WebP.");
    setBusy(true);
    try {
      // Sin recorte: el QR se sube completo, a un tamaño que se lee bien en pantalla y en el correo.
      const blob = await resizeImage(file, { maxSide: 1000 });
      const r = await api.admin.uploadPhoto(PAYMENT_QR_SLOT, blob, `qr.${blob.type === "image/webp" ? "webp" : "jpg"}`);
      if (r.status === 401 || r.status === 403) return onAuthError();
      if (r.status !== 200 || !r.data) return setError(QR_ERRORS[r.status] ?? "No se pudo subir el QR. Inténtalo de nuevo.");
      const photos = r.data;
      setData((d) => ({ ...d, site: { ...d.site, photos } }));
      toast("QR para pagar publicado");
    } catch {
      setError("No se pudo leer la imagen. Prueba con otra en JPG, PNG o WebP.");
    } finally {
      setBusy(false);
    }
  }

  const remove = () =>
    ask({
      title: "Quitar el QR",
      text: "El huésped dejará de ver el QR en «Mi reserva» y en los correos. Los demás datos para pagar se conservan.",
      okLabel: "Quitar QR",
      danger: true,
      done: "QR quitado",
      run: async () => {
        const r = await api.admin.deletePhoto(PAYMENT_QR_SLOT);
        if (r.status === 200 && r.data) {
          const photos = r.data;
          setData((d) => ({ ...d, site: { ...d.site, photos } }));
        }
        return r;
      },
    });

  return (
    <div className="mt-2 flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-ink">QR para pagar (opcional)</span>
      <div className="flex items-center gap-4 rounded-[18px] border border-line p-3">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element -- QR subido por el negocio, con su tamaño original
          <img src={qr} alt="QR para pagar" className="size-24 flex-none rounded-[12px] bg-paper object-contain ring-1 ring-line" />
        ) : (
          <span aria-hidden="true" className="grid size-24 flex-none place-items-center rounded-[12px] bg-panel text-ink-subtle ring-1 ring-line">
            <QrIcon size={28} />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-[12.5px] text-ink-muted">
            {qr ? "El huésped lo ve en «Mi reserva» y en el correo de reserva recibida." : "Sube la imagen del QR de tu banco o de Bre-B. JPG, PNG o WebP."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" loading={busy} icon={<UploadIcon size={14} />} onClick={() => input.current?.click()}>
              {qr ? "Cambiar QR" : "Subir QR"}
            </Button>
            {qr && (
              <Button size="sm" variant="danger-ghost" icon={<TrashIcon size={14} />} onClick={remove}>
                Quitar
              </Button>
            )}
          </div>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

/* ───────────── Cobro de abonos ───────────── */

// Cómo va el cobro de abonos en los últimos 90 días (reservas propias: sin Booking ni importadas).
function Collection() {
  const { data, today } = useAdmin();
  const since = addDays(today, -90);
  const own = data.reservations.filter((r) => r.createdAt.slice(0, 10) >= since && r.source !== "import" && !isFromBooking(r));
  const paid = own.filter((r) => r.depositPaidAt);
  const expired = own.filter((r) => r.status === "expired").length;
  const waiting = data.reservations.filter((r) => r.status === "pending_deposit");
  const rate = own.length ? Math.round((paid.length / own.length) * 100) : 0;
  const hours = paid
    .map((r) => (Date.parse(r.depositPaidAt!) - Date.parse(r.createdAt)) / 36e5)
    .filter((h) => h >= 0)
    .sort((a, b) => a - b);
  const median = hours.length ? hours[Math.floor(hours.length / 2)] : null;
  const avgDeposit = paid.length ? Math.round(paid.reduce((s, r) => s + r.quote.deposit, 0) / paid.length) : 0;
  const waitingValue = waiting.reduce((s, r) => s + r.quote.deposit, 0);
  const C = 2 * Math.PI * 42;
  return (
    <Panel id="pt-collect" title="Cómo va el cobro de abonos" subtitle="Reservas propias de los últimos 90 días">
      {own.length ? (
        <div className="flex items-center gap-5">
          <div className="relative size-[104px] flex-none">
            <svg viewBox="0 0 100 100" aria-hidden="true" className="size-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="9" style={{ stroke: "color-mix(in srgb, var(--color-chart-a) 16%, transparent)" }} />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - rate / 100)}
                style={{ stroke: ABONO }}
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-[20px] font-semibold tracking-[-0.03em] text-ink">{`${rate} %`}</span>
          </div>
          <p className="text-[13px] text-ink-muted">
            <strong className="font-semibold text-ink">{`${paid.length} de ${own.length}`}</strong> reservas pagaron su abono.
            {expired > 0 && ` ${expired} ${expired === 1 ? "venció" : "vencieron"} sin pagar.`}
          </p>
        </div>
      ) : (
        <p className="text-[13px] text-ink-muted">Aún no hay reservas propias en los últimos 90 días.</p>
      )}
      <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
        {[
          {
            k: "Tiempo para pagar",
            v: median === null ? "—" : median < 1 ? "menos de 1 h" : median < 48 ? `${Math.round(median)} h` : `${Math.round(median / 24)} días`,
            h: "mediana desde que reservan",
          },
          { k: "Abono promedio", v: avgDeposit ? money(avgDeposit) : "—", h: "de las que pagaron" },
          { k: "Esperando abono hoy", v: String(waiting.length), h: plural(waiting.length, "reserva retenida", "reservas retenidas") },
          { k: "Abonos por recibir", v: money(waitingValue), h: "si todas pagan" },
        ].map((x) => (
          <div key={x.k} className="min-w-0">
            <dt className="truncate text-[12px] text-ink-muted">{x.k}</dt>
            <dd className="mt-0.5 text-[17px] font-semibold tracking-[-0.02em] text-ink">{x.v}</dd>
            <dd className="truncate text-[11.5px] text-ink-subtle">{x.h}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

/* ───────────── Por cabaña ───────────── */

// Con el porcentaje elegido: abono y saldo de una noche en pareja y de una estadía de dos noches, por cabaña.
function ByCabin({ pct }: { pct: number }) {
  const { data } = useAdmin();
  const cabins = data.cabinTypes.filter((c) => c.activa).sort((a, b) => a.sort - b.sort);
  if (!cabins.length) return null;
  const split = (total: number) => ({ deposit: Math.round((total * pct) / 100), balance: total - Math.round((total * pct) / 100) });
  return (
    <Panel id="pt-cabins" title="Con este abono, en cada cabaña" subtitle="Precio base en pareja (sin temporadas ni personas adicionales)">
      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-y border-line text-[11.5px] text-ink-muted">
              <th scope="col" className="py-2 pl-5 font-medium">
                Cabaña
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                1 noche
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-2 rounded-full" style={{ background: ABONO }} />
                  Abono
                </span>
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-2 rounded-full" style={{ background: SALDO }} />
                  Saldo
                </span>
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                2 noches
              </th>
              <th scope="col" className="py-2 pr-5 text-right font-medium">
                Abono (2 noches)
              </th>
            </tr>
          </thead>
          <tbody>
            {cabins.map((c) => {
              const one = split(c.precioPareja);
              const two = split(c.precioPareja * 2);
              return (
                <tr key={c.id} className="border-b border-line last:border-b-0 hover:bg-panel/70">
                  <th scope="row" className="py-3 pl-5 font-medium text-ink">
                    {c.nombre}
                    <span className="block text-[11.5px] font-normal text-ink-muted">{plural(c.units, "unidad", "unidades")}</span>
                  </th>
                  <td className="py-3 text-right text-ink-muted tabular-nums">{cop(c.precioPareja)}</td>
                  <td className="py-3 text-right font-semibold text-ink tabular-nums">{cop(one.deposit)}</td>
                  <td className="py-3 text-right text-ink tabular-nums">{cop(one.balance)}</td>
                  <td className="py-3 text-right text-ink-muted tabular-nums">{cop(c.precioPareja * 2)}</td>
                  <td className="py-3 pr-5 text-right font-semibold text-ink tabular-nums">{cop(two.deposit)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
