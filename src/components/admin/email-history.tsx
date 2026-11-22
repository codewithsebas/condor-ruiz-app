"use client";

// Enviados (Correos): los correos de la bandeja de salida, automáticos y del equipo, con su estado. Arriba, la franja de
// resumen (lo enviado en 30 días, lo que espera y lo que no salió); abajo, la lista con filtros por estado y por correo,
// búsqueda por destinatario, código o asunto, y «Reintentar» en los que no salieron. Los datos son los del panel (los
// últimos 300 correos).
import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertIcon, ClockIcon, MailIcon, RefreshIcon, SendIcon } from "@/components/ui/icons";
import { Combobox } from "@/components/ui/combobox";
import { api } from "@/lib/client/api";
import { plural, timeAgo } from "@/lib/format";
import type { EmailRecord } from "@/lib/types";
import { useAdmin } from "@/components/admin/context";
import { Panel, SummaryStrip } from "@/components/admin/board";
import { ListSearch } from "@/components/admin/list-table";
import { paths } from "@/components/admin/routes";
import { EMAIL_KIND, EMAIL_STATUS, norm } from "@/components/admin/shared";
import { Badge, Button, EmptyState, Segmented } from "@/components/admin/ui";

const PAGE = 40;
const DAY = 864e5;
type StatusFilter = "todos" | "sent" | "waiting" | "failed";
const waiting = (e: EmailRecord) => e.status === "pending" || e.status === "sending";
const matches: Record<StatusFilter, (e: EmailRecord) => boolean> = {
  todos: () => true,
  sent: (e) => e.status === "sent",
  waiting,
  failed: (e) => e.status === "failed",
};
const titleOf = (e: EmailRecord) => EMAIL_KIND[e.kind] ?? (e.subject || "Mensaje del equipo");

export function EmailHistory() {
  const { data, now, reload, toast, onAuthError } = useAdmin();
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [busy, setBusy] = useState<string | null>(null);
  const emails = data.emails;
  const names = useMemo(() => new Map(data.reservations.map((r) => [r.code, r.guest.fullName])), [data.reservations]);

  const sent30 = emails.filter((e) => e.status === "sent" && e.sentAt && now - Date.parse(e.sentAt) < 30 * DAY).length;
  const failed30 = emails.filter((e) => e.status === "failed" && now - Date.parse(e.createdAt) < 30 * DAY).length;
  const queued = emails.filter(waiting).length;
  const failed = emails.filter((e) => e.status === "failed").length;
  const rate = sent30 + failed30 ? Math.round((sent30 / (sent30 + failed30)) * 100) : null;
  const last = emails.filter((e) => e.sentAt).sort((a, b) => (a.sentAt! < b.sentAt! ? 1 : -1))[0];

  const kinds = [...new Set(emails.map((e) => e.kind))];
  const needle = norm(q.trim());
  const list = emails.filter(
    (e) =>
      matches[status](e) &&
      (!kind || e.kind === kind) &&
      (!needle || norm(`${e.to} ${e.reservationCode ?? ""} ${names.get(e.reservationCode ?? "") ?? ""} ${titleOf(e)}`).includes(needle)),
  );
  const filtered = status !== "todos" || !!kind || !!needle;

  const retry = async (id: string) => {
    setBusy(id);
    try {
      const r = await api.admin.retryEmail(id);
      if (r.status === 401 || r.status === 403) return onAuthError();
      const e = r.data as EmailRecord | null;
      if (r.status !== 200 || !e) throw 0;
      toast(e.status === "sent" ? "Correo enviado" : `No se pudo enviar: ${e.lastError}`, e.status === "sent" ? "ok" : "error");
      await reload();
    } catch {
      toast("No se pudo reintentar el envío", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="@container flex flex-col gap-4">
      <SummaryStrip
        label="Resumen de los correos"
        cells={[
          {
            label: "Enviados",
            value: sent30,
            hint: rate === null ? "En los últimos 30 días" : `${rate} % de los que salieron en 30 días`,
            icon: <SendIcon size={16} />,
            meter: rate ?? undefined,
          },
          { label: "En cola", value: queued, hint: queued ? "Salen solos en unos minutos" : "Nada pendiente", icon: <ClockIcon size={16} /> },
          { label: "No enviados", value: failed, hint: failed ? "Reintenta desde la lista" : "Ninguno con error", icon: <AlertIcon size={16} /> },
          {
            label: "Último envío",
            value: last ? timeAgo(last.sentAt!, now) : "—",
            hint: last ? titleOf(last) : "Aún no sale ninguno",
            icon: <MailIcon size={16} />,
          },
        ]}
      />

      <Panel
        id="eh-list"
        title="Correos enviados"
        subtitle="Los automáticos y los mensajes del equipo, del más reciente al más antiguo."
        action={<span className="flex-none text-[12.5px] text-ink-muted tabular-nums">{plural(list.length, "correo", "correos")}</span>}
      >
        <div className="flex flex-col gap-2.5 @xl:flex-row @xl:flex-wrap @xl:items-center">
          <ListSearch
            id="eh-q"
            label="Buscar correos"
            value={q}
            onChange={(v) => {
              setQ(v);
              setShown(PAGE);
            }}
            placeholder="Correo, código o huésped"
            className="@xl:min-w-[240px] @xl:flex-1 @6xl:max-w-[320px]"
          />
          <Combobox
            id="eh-kind"
            value={kind}
            onChange={(v) => {
              setKind(v);
              setShown(PAGE);
            }}
            className="@xl:w-[220px]"
            options={[
              { value: "", label: "Todos los correos" },
              ...kinds.map((k) => ({ value: k, label: EMAIL_KIND[k] ?? "Mensaje del equipo" })).sort((a, b) => a.label.localeCompare(b.label)),
            ]}
          />
          <Segmented
            size="sm"
            label="Estado del correo"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setShown(PAGE);
            }}
            className="@6xl:ml-auto"
            options={[
              { value: "todos", label: "Todos" },
              { value: "sent", label: "Enviados" },
              { value: "waiting", label: "En cola", count: queued || undefined },
              { value: "failed", label: "No enviados", count: failed || undefined },
            ]}
          />
        </div>

        {list.length === 0 ? (
          <EmptyState
            compact
            icon={<MailIcon size={18} />}
            title={filtered ? "Ningún correo coincide" : "Aún no hay correos"}
            text={filtered ? "Prueba con otro filtro o búsqueda." : "Aquí aparecen los correos al huésped en cuanto salen."}
          />
        ) : (
          <ul className="-mx-1 flex flex-col divide-y divide-line">
            {list.slice(0, shown).map((e) => {
              const st = EMAIL_STATUS[e.status];
              const guest = e.reservationCode ? names.get(e.reservationCode) : undefined;
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 py-3">
                  <div className="min-w-0 flex-1 basis-60">
                    <p className="flex flex-wrap items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                      <span className="min-w-0 break-words">{titleOf(e)}</span>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[12px] text-ink-muted">
                      <span className="break-all">{e.to}</span>
                      {e.reservationCode && (
                        <>
                          <span aria-hidden="true">·</span>
                          <Link href={paths.reserva(e.reservationCode)} className="font-medium text-ink underline-offset-2 hover:underline">
                            {guest ? `${guest} · ${e.reservationCode}` : e.reservationCode}
                          </Link>
                        </>
                      )}
                    </p>
                    {e.status === "failed" && e.lastError && <p className="mt-0.5 text-[12px] text-error">{e.lastError}</p>}
                  </div>
                  <div className="flex flex-none items-center gap-3">
                    <span className="text-[12px] text-ink-muted tabular-nums">
                      {e.sentAt ? `enviado ${timeAgo(e.sentAt, now)}` : `${timeAgo(e.createdAt, now)} · ${plural(e.attempts, "intento", "intentos")}`}
                    </span>
                    {(e.status === "failed" || e.status === "pending") && (
                      <Button size="sm" icon={<RefreshIcon size={14} />} loading={busy === e.id} disabled={!!busy && busy !== e.id} onClick={() => retry(e.id)}>
                        Reintentar
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {list.length > shown && (
          <Button className="self-center" onClick={() => setShown((n) => n + PAGE)}>
            {`Ver ${Math.min(PAGE, list.length - shown)} más`}
          </Button>
        )}
      </Panel>
    </div>
  );
}
