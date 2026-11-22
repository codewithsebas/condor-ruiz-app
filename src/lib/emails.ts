// Correos transaccionales: HTML de 600 px con tablas, estilos inline y colores hex (funciona en Gmail, Outlook y Apple Mail).
// Todos (los automáticos de la reserva y el mensaje del equipo) se generan con funciones que reciben los datos.
import { fillVariables, type EmailOverrides, type EmailTemplateKind, type EmailTextKey } from "@/lib/email-templates";
import { cop, fmtDate, nightsBetween, plural } from "@/lib/format";
import { fmtTime, type SiteConfig } from "@/lib/site";

// `emailTexts`: los textos que el equipo cambió en el panel (Correos → plantillas); sin ellos, los originales.
type Cfg = SiteConfig & { emailTexts?: EmailOverrides };

// Los colores del panel (globals.css): fondo crema, tarjetas blancas, cajas arena, tinta negra y los cuatro pasteles de
// las tarjetas del dashboard. Hex fijos: los clientes de correo no leen variables CSS.
const X = {
  bg: "#F5F1E4", // fondo del panel
  card: "#FFFDF9", // tarjetas
  box: "#EFE9DD", // cajas de datos (las tarjetas arena del panel)
  ink: "#3A2817",
  muted: "#66615A",
  line: "#E2DACB",
  lineStrong: "#CEC5B3",
  brand: "#5B3A21", // botón principal y encabezado (nogal, como la barra lateral)
  cream: "#FBF6EC",
  hl: "#FFFDF9", // botón secundario: blanco con borde
};
// Pasteles del dashboard: el código de reserva y la etiqueta toman el de cada correo.
const ACCENTS = {
  yellow: { bg: "#D9A441", soft: "#F3E3BD" },
  green: { bg: "#7FAE84", soft: "#E3EFE4" },
  pink: { bg: "#D9937F", soft: "#F5DFD8" },
  blue: { bg: "#9FB8C4", soft: "#E3ECF0" },
};
type EmailAccent = keyof typeof ACCENTS;

// Plus Jakarta Sans es la letra del panel; donde el cliente de correo no carga fuentes web, Arial.
const FONT = "'Plus Jakarta Sans', Arial, Helvetica, sans-serif";
// El nombre, en la letra de los títulos del sitio (Bebas Neue si está, si no una condensada del sistema).
const WORDMARK = "'Bebas Neue', Impact, 'Arial Narrow', Arial, sans-serif";
const FONTS_URL = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap";
const DARK =
  ".em-body{background:#121110!important}.em-card{background:#272623!important}.em-text{color:#F3EFE6!important}.em-muted{color:#ABA59A!important}.em-box{background:#1D1C1A!important}.em-line{border-color:#3A3733!important}.em-btn1{background:#F3EFE6!important}.em-btn1 a{color:#171614!important}.em-btn2{background:#272623!important;border-color:#4A463F!important}.em-btn2 a{color:#F3EFE6!important}";

// Todo dato del huésped o del equipo se escapa antes de entrar al HTML.
const esc = (s: string | number) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

const h1 = (t: string) =>
  `<h1 class="em-text em-h1" style="margin:0 0 10px;font-family:${FONT};font-size:30px;line-height:36px;font-weight:700;letter-spacing:-1px;color:${X.ink}">${t}</h1>`;
const p = (t: string) => `<p class="em-text" style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:24px;color:${X.ink}">${t}</p>`;
const small = (t: string) => `<p class="em-muted" style="margin:0 0 10px;font-family:${FONT};font-size:13px;line-height:20px;color:${X.muted}">${t}</p>`;
const h2 = (t: string) =>
  `<h2 class="em-text" style="margin:28px 0 10px;font-family:${FONT};font-size:17px;line-height:22px;font-weight:700;letter-spacing:-0.3px;color:${X.ink}">${t}</h2>`;
// Etiqueta de estado en píldora, en el pastel suave del correo.
const pill = (t: string, accent: EmailAccent = "green") =>
  `<p style="margin:0 0 16px"><span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${ACCENTS[accent].soft};font-family:${FONT};font-size:12px;font-weight:700;color:${X.ink}">${t}</span></p>`;
const kv = (rows: [string, string][]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-box" style="background:${X.box};border-radius:18px">${rows
    .map(
      ([k, v], i) =>
        `<tr><td class="em-muted em-line" style="padding:12px 18px;font-family:${FONT};font-size:13px;line-height:18px;color:${X.muted};${i ? `border-top:1px solid ${X.line};` : ""}width:36%;vertical-align:top">${k}</td><td class="em-text em-line" style="padding:12px 18px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:${X.ink};${i ? `border-top:1px solid ${X.line};` : ""}">${v}</td></tr>`,
    )
    .join("")}</table>`;
// Montos alineados a la derecha; la última fila (lo pendiente) se destaca en grande, como las cifras del dashboard.
const amounts = (rows: [string, string, string?][]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-box" style="background:${X.box};border-radius:18px">${rows
    .map(([k, v, note], i) => {
      const last = i === rows.length - 1;
      const top = i ? `border-top:1px solid ${X.line};` : "";
      return `<tr><td class="em-text em-line" style="padding:13px 18px;font-family:${FONT};font-size:14px;line-height:20px;color:${X.ink};${top}${last ? "font-weight:700;" : ""}">${k}${note ? `<br><span class="em-muted" style="font-size:12px;line-height:18px;font-weight:400;color:${X.muted}">${note}</span>` : ""}</td><td align="right" class="em-text em-line" style="padding:13px 18px;font-family:${FONT};font-size:${last ? "26px" : "15px"};line-height:${last ? "30px" : "20px"};font-weight:700;letter-spacing:${last ? "-1px" : "0"};color:${X.ink};white-space:nowrap;vertical-align:top;${top}">${v}</td></tr>`;
    })
    .join("")}</table>`;
const list = (items: string[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${items
    .map(
      (t) =>
        `<tr><td width="22" valign="top" class="em-text" style="padding:4px 0;font-family:${FONT};font-size:14px;line-height:22px;color:${X.ink}">&#8226;</td><td class="em-text" style="padding:4px 0;font-family:${FONT};font-size:15px;line-height:22px;color:${X.ink}">${t}</td></tr>`,
    )
    .join("")}</table>`;
// Botones en píldora: negro el principal; blanco con borde el secundario (como en el panel).
const btn = (label: string, href: string, bg: string, fg: string) => {
  const secondary = bg === X.hl;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 6px"><tr><td align="center" bgcolor="${bg}" class="${secondary ? "em-btn2" : "em-btn1"}" style="border-radius:999px;background:${bg};${secondary ? `border:1px solid ${X.lineStrong};` : ""}"><a href="${href}" target="_blank" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:15px;font-weight:700;line-height:20px;color:${fg};text-decoration:none;border-radius:999px">${label}</a></td></tr></table>`;
};
// Un botón con enlace vacío no se dibuja (sin el sitio público publicado no hay «Mi reserva» ni «Reservar»).
const btns = (items: [string, string, string, string][]) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${items
    .filter((b) => b[1])
    .map((b) => `<td class="em-col" style="padding:0 10px 0 0">${btn(...b)}</td>`)
    .join("")}</tr></table>`;
// Mapa de la dirección (imagen de Geoapify, con mapas de OpenStreetMap, incrustada en el correo): al tocarlo abre la ruta
// en Google Maps. La atribución que piden Geoapify y OpenStreetMap ya viene dentro de la imagen. Sin imagen, nada.
const mapBlock = (c: Cfg, src: string | undefined, href: string) =>
  src
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 2px"><tr><td class="em-box" style="background:${X.box};border-radius:18px;padding:0;overflow:hidden"><a href="${href}" target="_blank" style="display:block;text-decoration:none"><img src="${src}" width="536" alt="Mapa de ${esc(c.address)}: toca para ver cómo llegar" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:18px"></a></td></tr></table>`
    : "";
// Línea del texto plano solo si hay enlace.
const linkLine = (label: string, url: string) => (url ? `${label}: ${url}\n` : "");
// Código de reserva en una tarjeta pastel, como las del dashboard: el pastel dice en qué va la reserva.
const codeBox = (code: string, status: string, accent: EmailAccent = "green") =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px"><tr><td style="background:${ACCENTS[accent].bg};border-radius:22px;padding:20px 22px"><p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${X.ink}">Código de reserva</p><p style="margin:6px 0 0;font-family:${FONT};font-size:36px;line-height:40px;font-weight:700;letter-spacing:-1px;color:${X.ink}">${code}</p>${
    status
      ? `<p style="margin:10px 0 0"><span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${X.card};font-family:${FONT};font-size:12px;font-weight:700;color:${X.ink}">${status}</span></p>`
      : ""
  }</td></tr></table>`;

function emailLayout(c: Cfg, { title, preheader, body }: { title: string; preheader: string; body: string }) {
  const phones = c.phones.join(" · ");
  const darkRules = (prefix: string) =>
    DARK.split("}")
      .filter(Boolean)
      .map((r) => prefix + r + "}")
      .join("");
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${title}</title>
<link href="${FONTS_URL}" rel="stylesheet">
<style>@media (max-width:620px){.em-container{width:100%!important}.em-pad{padding:24px 20px!important}.em-col{display:block!important;width:100%!important}.em-h1{font-size:26px!important;line-height:31px!important}}
@media (prefers-color-scheme:dark){${DARK}}
${darkRules("[data-ogsc] ")}
${darkRules(".dm ")}</style></head>
<body class="em-body" style="margin:0;padding:0;background:${X.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${preheader}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="em-body" style="background:${X.bg}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="em-container" style="width:600px;max-width:600px">
<tr><td class="em-pad" style="background:${X.brand};border-radius:28px;padding:18px 24px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right:14px"><img src="{{logoUrl}}" width="56" height="56" alt="${c.name}" style="display:block;border:0;width:56px;height:56px;border-radius:50%"></td><td style="font-family:${FONT};color:${X.cream}"><span style="display:block;font-family:${WORDMARK};font-size:26px;line-height:28px;font-weight:normal;letter-spacing:1px;color:${X.cream}">El Cóndor del Ruiz</span><span style="display:block;margin-top:2px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#BFD3C3">Cabañas · Murillo, Tolima</span></td></tr></table></td></tr>
<tr><td style="height:12px;line-height:12px;font-size:0">&nbsp;</td></tr>
<tr><td class="em-card em-pad" style="background:${X.card};border-radius:28px;padding:34px 32px">${body}</td></tr>
<tr><td class="em-pad" align="center" style="padding:24px 32px 8px;font-family:${FONT};font-size:12px;line-height:19px">
<p class="em-text" style="margin:0 0 4px;font-weight:700;color:${X.ink}">${c.name}</p><p class="em-muted" style="margin:0 0 4px;color:${X.muted}">${c.address}</p><p class="em-muted" style="margin:0 0 4px;color:${X.muted}">Tel. ${phones} · WhatsApp +${c.whatsapp}${c.rnt ? ` · RNT ${c.rnt}` : ""}</p>
<p class="em-muted" style="margin:10px 0 0;color:${X.muted}">Ley 679 de 2001: rechazamos la explotación y el abuso sexual de niños, niñas y adolescentes. Recibes este correo por tu reserva con nosotros.</p></td></tr>
</table></td></tr></table></body></html>`;
}

const footText = (c: Cfg) =>
  "\n\n—\n" +
  `${c.name}\n${c.address}\nTel. ${c.phones.join(" · ")} · WhatsApp +${c.whatsapp}${c.rnt ? `\nRNT ${c.rnt}` : ""}\nLey 679 de 2001: rechazamos la explotación y el abuso sexual de niños, niñas y adolescentes.`;

// Vista previa en un tema fijo, sin depender del tema del dispositivo de quien la mira.
export const previewEmailTheme = (html: string, dark: boolean) => {
  const fixed = html.replace(`@media (prefers-color-scheme:dark){${DARK}}`, "");
  return dark ? fixed.replace('<html lang="es"', '<html class="dm" lang="es"') : fixed;
};

export type RenderedEmail = { subject: string; preheader: string; html: string; text: string };

const finish = (c: Cfg, logoUrl: string, e: Omit<RenderedEmail, "html"> & { body: string }): RenderedEmail => ({
  subject: e.subject,
  preheader: e.preheader,
  text: e.text,
  html: emailLayout(c, { title: esc(e.subject), preheader: esc(e.preheader), body: e.body }).replace("{{logoUrl}}", logoUrl),
});

/* ───────────── Reserva confirmada (automático, al aprobarse el abono) ───────────── */

type ConfirmedEmailData = {
  nombre: string;
  codigo: string;
  cabana: string;
  checkIn: string; // AAAA-MM-DD
  checkOut: string;
  adultos: number;
  ninos: number;
  mascota: boolean;
  total: number;
  pagado: number;
  decoraciones?: { name: string; price: number }[];
  miReservaUrl: string; // vacío: sin el sitio público
  comoLlegarUrl: string;
  mapaUrl?: string; // imagen del mapa (cid:…); sin ella, el correo no lleva mapa
  whatsappUrl: string;
  logoUrl: string;
};

export function reservationConfirmedEmail(c: Cfg, d: ConfirmedEmailData): RenderedEmail {
  const first = d.nombre.trim().split(/\s+/)[0] || d.nombre;
  const nights = plural(nightsBetween(d.checkIn, d.checkOut), "noche", "noches");
  const guests = `${plural(d.adultos, "adulto", "adultos")}${d.ninos ? ` · ${plural(d.ninos, "niño", "niños")}` : ""}`;
  const saldo = Math.max(0, d.total - d.pagado);
  const llegada = `${fmtDate(d.checkIn, true)}`;
  const salida = `${fmtDate(d.checkOut, true)}`;
  const checkInWindow = `de ${fmtTime(c.checkInStart)} a ${fmtTime(c.checkInEnd)}`;
  const balanceNote = "Puedes pagarlo por transferencia antes de llegar o en recepción el día del check-in.";
  const full = saldo === 0;
  const arrival = [
    "Presenta el <strong>documento de identidad físico</strong> de cada huésped.",
    `El check-in es ${checkInWindow.replace(/\.$/, "")}. Si vas a llegar más tarde, avísanos por WhatsApp.`,
    "Trae ropa abrigada: Murillo está a casi 3.000 metros de altura y las noches son frías.",
    ...(d.mascota ? ["Tu mascota es bienvenida, sin costo adicional."] : []),
    `Dirección: ${esc(c.address)}. El Nevado del Ruiz queda a aproximadamente 1 hora en carro.`,
  ];
  const T = custom(c, "reservation_confirmed", d, { total: d.total, pagado: d.pagado, saldo });
  const intro = full
    ? "Recibimos tu pago total y tu reserva quedó confirmada. No tienes saldo pendiente: solo queda disfrutar tu estadía en El Cóndor del Ruiz. Aquí tienes lo esencial para tu llegada."
    : "Recibimos tu abono y tu reserva quedó confirmada. Aquí tienes lo esencial para tu llegada.";
  const closing = "El abono no es reembolsable. Los cambios de fecha se solicitan con al menos 5 días de anticipación.";
  const body =
    pill("&#10003;&nbsp; Reserva confirmada", "green") +
    (T.titleHtml ?? h1(`¡Te esperamos, ${esc(first)}!`)) +
    (T.introHtml ?? p(intro)) +
    codeBox(esc(d.codigo), "Confirmada", "green") +
    h2("Tu estadía") +
    kv([
      ["Cabaña", esc(d.cabana)],
      ["Llegada", `${llegada}<br><span style="font-weight:normal">Check-in ${checkInWindow}</span>`],
      ["Salida", `${salida}<br><span style="font-weight:normal">Check-out hasta las ${c.checkOut}</span>`],
      ["Estadía", `${nights} · ${guests}`],
      ...decoRow(d),
    ]) +
    h2("Pagos") +
    amounts([
      ["Valor total", cop(d.total)],
      [full ? "Pagado" : "Abono pagado", `&#10003; ${cop(d.pagado)}`],
      ["Saldo pendiente", cop(saldo), saldo ? balanceNote : "No tienes saldo pendiente."],
    ]) +
    h2("Para tu llegada") +
    list(arrival) +
    mapBlock(c, d.mapaUrl, d.comoLlegarUrl) +
    btns([
      ["Ver mi reserva", d.miReservaUrl, X.hl, X.ink],
      ["Cómo llegar", d.comoLlegarUrl, X.brand, X.cream],
    ]) +
    small(
      `Adjuntamos <strong>reserva-${esc(d.codigo)}.ics</strong> para que la agregues a tu calendario. ¿Dudas? <a href="${d.whatsappUrl}" class="em-text" style="color:${X.ink};font-weight:bold;text-decoration:underline">Escríbenos por WhatsApp</a>.`,
    ) +
    (T.closingHtml ?? small(closing));
  const text =
    `${T.open(`¡Te esperamos, ${first}!`, intro) ?? `¡Te esperamos, ${first}! Tu reserva está confirmada.`}\n\n` +
    `Código: ${d.codigo} (confirmada)\nCabaña: ${d.cabana}\nLlegada: ${llegada} · check-in ${checkInWindow}\nSalida: ${salida} · check-out hasta las ${c.checkOut}\nEstadía: ${nights} · ${guests}\n\n` +
    `PAGOS\nValor total: ${cop(d.total)}\n${full ? "Pagado" : "Abono pagado"}: ${cop(d.pagado)}\nSaldo pendiente: ${cop(saldo)}${saldo ? `\n${balanceNote}` : ""}\n\n` +
    `PARA TU LLEGADA\n- Presenta el documento de identidad físico de cada huésped.\n- Check-in ${checkInWindow.replace(/\.$/, "")}. Si llegas más tarde, avísanos por WhatsApp.\n- Trae ropa abrigada: las noches son frías.\n${d.mascota ? "- Tu mascota es bienvenida, sin costo adicional.\n" : ""}- Dirección: ${c.address}\n\n` +
    `${linkLine("Ver mi reserva", d.miReservaUrl)}Cómo llegar: ${d.comoLlegarUrl}\nWhatsApp: ${d.whatsappUrl}\nAdjunto: reserva-${d.codigo}.ics\n\n${T.closing ?? closing}` +
    footText(c);
  return finish(c, d.logoUrl, {
    subject: T.subject ?? `Reserva confirmada ${d.codigo} · ${fmtDate(d.checkIn)}`,
    preheader:
      T.preheader ??
      (full ? `Te esperamos el ${llegada}. Tu estadía está pagada.` : `Te esperamos el ${llegada}. Abono recibido; saldo pendiente ${cop(saldo)}.`),
    body,
    text,
  });
}

/* ───────────── Mensaje del equipo (desde la ficha del cliente) ───────────── */

type TeamMessageData = { nombre: string; asunto: string; mensaje: string; codigo?: string | null; whatsappUrl: string; logoUrl: string };

export function teamMessageEmail(c: Cfg, d: TeamMessageData): RenderedEmail {
  const first = d.nombre.trim().split(/\s+/)[0] || d.nombre;
  const paragraphs = d.mensaje
    .trim()
    .split(/\n{2,}/)
    .map((para) => p(esc(para).replace(/\n/g, "<br>")))
    .join("");
  const body =
    p(`Hola ${esc(first)},`) +
    paragraphs +
    p(`Un saludo,<br><strong>Equipo de ${esc(c.name)}</strong>`) +
    (d.codigo ? small(`Referencia: reserva <strong>${esc(d.codigo)}</strong>`) : "") +
    btn("Escribir por WhatsApp", d.whatsappUrl, X.hl, X.ink) +
    small("Puedes responder a este correo o escribirnos por WhatsApp.");
  const text =
    `Hola ${first},\n\n${d.mensaje.trim()}\n\nUn saludo,\nEquipo de ${c.name}${d.codigo ? `\n\nReferencia: reserva ${d.codigo}` : ""}\n\nWhatsApp: ${d.whatsappUrl}` +
    footText(c);
  return finish(c, d.logoUrl, { subject: d.asunto.trim(), preheader: d.mensaje.trim().slice(0, 90), body, text });
}

/* ───────────── Datos comunes de la reserva ───────────── */

type StayData = {
  nombre: string;
  codigo: string;
  cabana: string;
  checkIn: string; // AAAA-MM-DD
  checkOut: string;
  adultos: number;
  ninos: number;
  logoUrl: string;
  decoraciones?: { name: string; price: number }[]; // decoraciones con costo (incluidas en el total)
};

// «Pétalos y velas ($80.000), Globos ($50.000)»: fila de la estadía; vacío sin decoraciones.
const decoOf = (d: { decoraciones?: { name: string; price: number }[] }) => (d.decoraciones ?? []).map((x) => `${x.name} (${cop(x.price)})`).join(", ");
const decoRow = (d: { decoraciones?: { name: string; price: number }[] }): [string, string][] => (decoOf(d) ? [["Decoración", esc(decoOf(d))]] : []);

const firstName = (nombre: string) => nombre.trim().split(/\s+/)[0] || nombre;

// Textos cambiados en el panel para este correo, con las variables ya reemplazadas (undefined: el texto original).
// `html`: el mismo texto listo para el correo (escapado; una línea en blanco separa párrafos).
function custom(c: Cfg, kind: EmailTemplateKind, d: StayData, money: Partial<Record<"total" | "pagado" | "saldo" | "abono", number>> = {}) {
  const o = c.emailTexts?.[kind] ?? {};
  const values: Record<string, string> = {
    nombre: firstName(d.nombre),
    nombre_completo: d.nombre.trim(),
    codigo: d.codigo,
    cabana: d.cabana,
    llegada: fmtDate(d.checkIn, true),
    salida: fmtDate(d.checkOut, true),
    noches: plural(nightsBetween(d.checkIn, d.checkOut), "noche", "noches"),
    ...Object.fromEntries(Object.entries(money).map(([k, v]) => [k, cop(v ?? 0)])),
  };
  const get = (k: EmailTextKey) => (o[k]?.trim() ? fillVariables(o[k]!.trim(), values) : undefined);
  const t = { subject: get("subject"), preheader: get("preheader"), title: get("title"), intro: get("intro"), closing: get("closing") };
  return {
    ...t,
    titleHtml: t.title === undefined ? undefined : h1(esc(t.title)),
    introHtml: t.intro === undefined ? undefined : paragraphs(t.intro, p),
    closingHtml: t.closing === undefined ? undefined : paragraphs(t.closing, small),
    // Apertura del texto plano: el título y la entrada cambiados (los que falten, los originales).
    open: (title: string, intro: string) => (t.title === undefined && t.intro === undefined ? undefined : `${t.title ?? title}\n\n${t.intro ?? intro}`),
  };
}
const paragraphs = (text: string, wrap: (t: string) => string) =>
  text
    .split(/\n{2,}/)
    .map((x) => wrap(esc(x).replace(/\n/g, "<br>")))
    .join("");
const guestsOf = (d: StayData) => `${plural(d.adultos, "adulto", "adultos")}${d.ninos ? ` · ${plural(d.ninos, "niño", "niños")}` : ""}`;
const stayOf = (d: StayData) => `${fmtDate(d.checkIn, true)} → ${fmtDate(d.checkOut, true)}`;
// Los datos de pago se editan en el panel (Contenido → Pagos); mientras sigan con el marcador no se muestran.
const payInfo = (c: Cfg) => (c.datosPagoAbono.trim().startsWith("{") ? "" : c.datosPagoAbono.trim());

/* ───────────── Reserva recibida (automático, al crearse; sin abono no aparta las fechas) ───────────── */

type ReceivedEmailData = StayData & {
  mascota: boolean;
  total: number;
  abono: number;
  plazo: string; // ISO: fin del día de llegada (si no llega el abono, ahí vence)
  miReservaUrl: string; // vacío: sin el sitio público
  pagarUrl?: string; // enlace de pago en línea (Wompi); vacío o sin él: no se ofrece
  whatsappUrl: string;
};

export function reservationReceivedEmail(c: Cfg, d: ReceivedEmailData): RenderedEmail {
  const first = firstName(d.nombre);
  const nights = plural(nightsBetween(d.checkIn, d.checkOut), "noche", "noches");
  const datos = payInfo(c);
  const llave = c.llavePago.trim();
  // QR: solo una URL absoluta (la de Storage); una ruta relativa no carga en el correo.
  const qr = /^https:\/\//.test(c.qrPago) ? c.qrPago : "";
  const payHtml =
    datos || llave || qr
      ? (datos ? p(esc(datos).replace(/\n/g, "<br>")) : "") +
        (llave ? p(`<strong>Llave Bre-B:</strong> <span style="font-family:monospace;font-size:16px">${esc(llave)}</span>`) : "") +
        (qr
          ? `<p style="margin:0 0 14px"><img src="${esc(qr)}" width="180" height="180" alt="Código QR para pagar" style="display:block;border:0;width:180px;height:180px;border-radius:12px;background:#fff"></p>` +
            small("Escanea el QR desde la app de tu banco.")
          : "") +
        small(`Cuando transfieras, envíanos el comprobante por WhatsApp${d.miReservaUrl ? " o súbelo en «Mi reserva»" : ""}.`)
      : p(`Escríbenos por WhatsApp y te enviamos los datos para transferir el abono.`);
  const T = custom(c, "reservation_received", d, { total: d.total, abono: d.abono });
  const closing = "Si no recibimos el abono antes de tu día de llegada, la reserva vence. El abono no es reembolsable.";
  const body =
    pill("Reserva recibida", "yellow") +
    (T.titleHtml ?? h1(`¡Gracias, ${esc(first)}!`)) +
    (T.introHtml ??
      p(
        `Recibimos tu reserva. <strong>Tus fechas se aseguran cuando recibamos el abono</strong>: mientras tanto siguen disponibles y, si alguien las paga antes, te movemos a las próximas fechas libres con el mismo valor y te avisamos.`,
      )) +
    codeBox(esc(d.codigo), "Pendiente de abono", "yellow") +
    h2("Tu estadía") +
    kv([
      ["Cabaña", esc(d.cabana)],
      ["Fechas", `${esc(stayOf(d))}<br><span style="font-weight:normal">${nights}</span>`],
      ["Huéspedes", `${guestsOf(d)}${d.mascota ? " · con mascota" : ""}`],
      ...decoRow(d),
    ]) +
    h2("Para confirmar") +
    amounts([
      ["Valor total", cop(d.total)],
      ["Saldo al llegar", cop(Math.max(0, d.total - d.abono))],
      ["Abono para confirmar", cop(d.abono), "Asegura tus fechas"],
    ]) +
    h2("Cómo pagar el abono") +
    (d.pagarUrl ? p("Paga en línea con tarjeta de crédito, o por transferencia:") + btns([["Pagar en línea", d.pagarUrl, X.hl, X.ink]]) : "") +
    payHtml +
    btns([
      ["Ver mi reserva", d.miReservaUrl, X.hl, X.ink],
      ["Escribir por WhatsApp", d.whatsappUrl, X.brand, X.cream],
    ]) +
    (T.closingHtml ?? small(closing));
  const text =
    `${T.open(`¡Gracias, ${first}!`, "Recibimos tu reserva.") ?? `¡Gracias, ${first}! Recibimos tu reserva.`}\n\n` +
    `Código: ${d.codigo} (pendiente de abono)\nCabaña: ${d.cabana}\nFechas: ${stayOf(d)} · ${nights}\nHuéspedes: ${guestsOf(d)}${d.mascota ? " · con mascota" : ""}\n\n` +
    `${decoOf(d) ? `Decoración: ${decoOf(d)}\n\n` : ""}PARA CONFIRMAR\nValor total: ${cop(d.total)}\nAbono: ${cop(d.abono)} (asegura tus fechas)\nSaldo al llegar: ${cop(Math.max(0, d.total - d.abono))}\n\n` +
    `CÓMO PAGAR EL ABONO\n${[datos, llave && `Llave Bre-B: ${llave}`].filter(Boolean).join("\n") || "Escríbenos por WhatsApp y te enviamos los datos para transferir."}\n\n` +
    `${linkLine("Pagar en línea", d.pagarUrl ?? "")}${linkLine("Ver mi reserva", d.miReservaUrl)}WhatsApp: ${d.whatsappUrl}\n\n${T.closing ?? "Tus fechas se aseguran cuando recibamos el abono. Si alguien las paga antes, te movemos a las próximas libres con el mismo valor."}` +
    footText(c);
  return finish(c, d.logoUrl, {
    subject: T.subject ?? `Recibimos tu reserva ${d.codigo} · paga el abono para confirmarla`,
    preheader: T.preheader ?? `Paga el abono de ${cop(d.abono)} para asegurar tus fechas.`,
    body,
    text,
  });
}

/* ───────────── Reserva cancelada o vencida (automático, al huésped) ───────────── */

type EndedEmailData = StayData & { vencida: boolean; pagado: number; reservarUrl: string; whatsappUrl: string }; // reservarUrl vacío: sin el sitio público

export function reservationEndedEmail(c: Cfg, d: EndedEmailData): RenderedEmail {
  const first = firstName(d.nombre);
  const what = d.vencida
    ? `tu reserva ${d.codigo} para la ${d.cabana} (${stayOf(d)}) venció porque no recibimos el abono antes del día de llegada.`
    : `has cancelado tu reserva ${d.codigo} en El Cóndor del Ruiz para la ${d.cabana} (${stayOf(d)}). Las fechas quedaron libres.`;
  // El abono solo se menciona si se pagó: sin pago no hay nada que retener.
  const next = d.vencida
    ? d.reservarUrl
      ? "Si todavía quieres venir, puedes reservar de nuevo: te mostramos la disponibilidad actual."
      : "Si todavía quieres venir, escríbenos por WhatsApp y te contamos la disponibilidad actual."
    : `${d.pagado ? "Según nuestras políticas, el abono no es reembolsable. " : ""}Si no fuiste tú o crees que es un error, escríbenos.`;
  const T = custom(c, d.vencida ? "reservation_expired" : "reservation_cancelled", d, { pagado: d.pagado });
  const title = d.vencida ? "Tu reserva venció" : "Cancelaste tu reserva";
  const intro = `Hola ${first}, ${what}`;
  const body =
    pill(d.vencida ? "Reserva vencida" : "Reserva cancelada", "pink") +
    (T.titleHtml ?? h1(title)) +
    (T.introHtml ?? p(esc(intro))) +
    (T.closingHtml ?? (d.vencida ? p(next) : small(next))) +
    btns([
      ["Reservar de nuevo", d.reservarUrl, X.brand, X.cream],
      ["Escribir por WhatsApp", d.whatsappUrl, X.hl, X.ink],
    ]);
  const text = `${T.open(title, intro) ?? intro}\n\n${T.closing ?? next}\n\n${linkLine("Reservar", d.reservarUrl)}WhatsApp: ${d.whatsappUrl}` + footText(c);
  return finish(c, d.logoUrl, {
    subject: T.subject ?? (d.vencida ? `Tu reserva ${d.codigo} venció` : `Cancelaste tu reserva ${d.codigo} en El Cóndor del Ruiz`),
    preheader: T.preheader ?? (d.vencida ? "No recibimos el abono a tiempo y liberamos las fechas." : `Has cancelado tu reserva del ${fmtDate(d.checkIn)}.`),
    body,
    text,
  });
}

/* ───────────── Pago total recibido (automático, al completar el saldo de una reserva ya confirmada) ───────────── */

type BalancePaidEmailData = StayData & {
  total: number;
  pagado: number;
  enEstadia: boolean; // pagó ya hospedado: las indicaciones de llegada sobran
  comoLlegarUrl: string;
  mapaUrl?: string; // imagen del mapa (cid:…); sin ella, el correo no lleva mapa
  miReservaUrl: string; // vacío: sin el sitio público
  whatsappUrl: string;
};

export function balancePaidEmail(c: Cfg, d: BalancePaidEmailData): RenderedEmail {
  const first = firstName(d.nombre);
  const nights = plural(nightsBetween(d.checkIn, d.checkOut), "noche", "noches");
  const T = custom(c, "balance_paid", d, { total: d.total, pagado: d.pagado });
  const intro = "Recibimos el pago de tu saldo: ya hiciste tu pago total. No tienes nada pendiente, solo queda disfrutar tu estadía en El Cóndor del Ruiz.";
  const body =
    pill("&#10003;&nbsp; Pago total recibido", "green") +
    (T.titleHtml ?? h1(`¡Todo listo, ${esc(first)}!`)) +
    (T.introHtml ??
      p(
        "Recibimos el pago de tu saldo: <strong>ya hiciste tu pago total</strong>. No tienes nada pendiente, solo queda disfrutar tu estadía en El Cóndor del Ruiz.",
      )) +
    codeBox(esc(d.codigo), "Pago total", "green") +
    h2("Tu estadía") +
    kv([
      ["Cabaña", esc(d.cabana)],
      ["Fechas", `${esc(stayOf(d))}<br><span style="font-weight:normal">${nights}</span>`],
      ["Huéspedes", guestsOf(d)],
    ]) +
    h2("Pagos") +
    amounts([
      ["Valor total", cop(d.total)],
      ["Pagado", `&#10003; ${cop(d.pagado)}`],
      ["Saldo pendiente", cop(0), "No tienes saldo pendiente."],
    ]) +
    (d.enEstadia
      ? ""
      : h2("Para tu llegada") +
        list([
          "Presenta el <strong>documento de identidad físico</strong> de cada huésped.",
          `El check-in es de ${fmtTime(c.checkInStart)} a ${fmtTime(c.checkInEnd)}.`,
          "Trae ropa abrigada: las noches en Murillo son frías.",
        ]) +
        mapBlock(c, d.mapaUrl, d.comoLlegarUrl) +
        btns([
          ["Cómo llegar", d.comoLlegarUrl, X.brand, X.cream],
          ["Ver mi reserva", d.miReservaUrl, X.hl, X.ink],
        ])) +
    small(`¿Dudas? <a href="${d.whatsappUrl}" class="em-text" style="color:${X.ink};font-weight:bold;text-decoration:underline">Escríbenos por WhatsApp</a>.`) +
    (T.closingHtml ?? "");
  const text =
    `${T.open(`¡Todo listo, ${first}!`, intro) ?? `¡Todo listo, ${first}! ${intro}`}\n\n` +
    `Código: ${d.codigo}\nCabaña: ${d.cabana}\nFechas: ${stayOf(d)} · ${nights}\n\nPAGOS\nValor total: ${cop(d.total)}\nPagado: ${cop(d.pagado)}\nSaldo pendiente: ${cop(0)}\n\n` +
    `${d.enEstadia ? "" : `Cómo llegar: ${d.comoLlegarUrl}\n${linkLine("Ver mi reserva", d.miReservaUrl)}`}WhatsApp: ${d.whatsappUrl}${T.closing ? `\n\n${T.closing}` : ""}` +
    footText(c);
  return finish(c, d.logoUrl, {
    subject: T.subject ?? `Ya hiciste tu pago total · ${d.codigo}`,
    preheader: T.preheader ?? "Recibimos tu saldo. Disfruta tu estadía en El Cóndor del Ruiz.",
    body,
    text,
  });
}

/* ───────────── Reserva reprogramada (automático, al cambiar las fechas) ───────────── */

type RescheduledEmailData = StayData & {
  checkInAnterior: string;
  checkOutAnterior: string;
  mascota: boolean;
  total: number;
  pagado: number;
  abono: number; // para la que sigue sin abono
  plazo: string; // ISO: fin del día de llegada (si no llega el abono, ahí vence)
  miReservaUrl: string; // vacío: sin el sitio público
  whatsappUrl: string;
  movida?: boolean; // sin abono: otra reserva pagó sus fechas y se corrió a las próximas libres
};

export function reservationRescheduledEmail(c: Cfg, d: RescheduledEmailData): RenderedEmail {
  const first = firstName(d.nombre);
  const nights = plural(nightsBetween(d.checkIn, d.checkOut), "noche", "noches");
  const saldo = Math.max(0, d.total - d.pagado);
  const antes = stayOf({ ...d, checkIn: d.checkInAnterior, checkOut: d.checkOutAnterior });
  const ahora = stayOf(d);
  // El mensaje cambia según lo pagado: nada todavía, el abono (o parte) o todo.
  const estado = !d.pagado ? "sin_abono" : saldo ? "abono" : "total";
  const message = {
    sin_abono: d.movida
      ? `Otra persona pagó primero tus fechas anteriores, así que te movimos a las próximas fechas libres con el mismo valor. Paga el abono de ${cop(d.abono)} para asegurarlas.`
      : `Para confirmar tu reserva y asegurar las fechas, paga el abono de ${cop(d.abono)}.`,
    abono: `Lo que ya abonaste (${cop(d.pagado)}) se mantiene para las nuevas fechas. Te queda un saldo de ${cop(saldo)}, que puedes pagar por transferencia antes de llegar o en recepción.`,
    total: "Ya hiciste tu pago total, así que no tienes saldo pendiente. Solo queda disfrutar tu estadía en El Cóndor del Ruiz en las nuevas fechas.",
  }[estado];
  const status = { sin_abono: "Pendiente de abono", abono: "Reprogramada · abono pagado", total: "Reprogramada · pago total" }[estado];
  const rows: [string, string, string?][] =
    estado === "sin_abono"
      ? [
          ["Valor total", cop(d.total)],
          ["Saldo al llegar", cop(Math.max(0, d.total - d.abono))],
          ["Abono para confirmar", cop(d.abono), "Asegura tus fechas"],
        ]
      : [
          ["Valor total", cop(d.total)],
          [estado === "total" ? "Pagado" : "Abono pagado", `&#10003; ${cop(d.pagado)}`],
          ["Saldo pendiente", cop(saldo), saldo ? "Por transferencia antes de llegar o en recepción." : "No tienes saldo pendiente."],
        ];
  const T = custom(c, d.movida ? "reservation_moved" : "reservation_rescheduled", d, { total: d.total, pagado: d.pagado, saldo, abono: d.abono });
  const intro = `${d.movida ? "Movimos" : "Reprogramamos"} tu reserva para el ${ahora}. ${message}`;
  const closing = "Con menos de 5 días (120 horas) antes de la llegada ya no se permiten nuevos cambios.";
  const body =
    pill(d.movida ? "Cambiamos tus fechas" : "Reserva reprogramada", "blue") +
    (T.titleHtml ?? h1(`Nuevas fechas, ${esc(first)}`)) +
    (T.introHtml ?? p(`${d.movida ? "Movimos" : "Reprogramamos"} tu reserva para el <strong>${esc(ahora)}</strong>. ${esc(message)}`)) +
    codeBox(esc(d.codigo), status, "blue") +
    h2("Tu estadía") +
    kv([
      ["Cabaña", esc(d.cabana)],
      ["Antes", `<span style="font-weight:normal;text-decoration:line-through">${esc(antes)}</span>`],
      ["Ahora", `${esc(ahora)}<br><span style="font-weight:normal">${nights}</span>`],
      ["Huéspedes", `${guestsOf(d)}${d.mascota ? " · con mascota" : ""}`],
    ]) +
    h2("Pagos") +
    amounts(rows) +
    btns([
      ["Ver mi reserva", d.miReservaUrl, X.hl, X.ink],
      ["Escribir por WhatsApp", d.whatsappUrl, X.brand, X.cream],
    ]) +
    small(`Adjuntamos <strong>reserva-${esc(d.codigo)}.ics</strong> con las nuevas fechas para tu calendario.`) +
    (T.closingHtml ?? small(closing));
  const text =
    `${T.open(`Nuevas fechas, ${first}.`, intro) ?? `Nuevas fechas, ${first}. ${d.movida ? "Movimos" : "Reprogramamos"} tu reserva para el ${ahora}.\n\n${message}`}\n\n` +
    `Código: ${d.codigo} (${status.toLowerCase()})\nCabaña: ${d.cabana}\nAntes: ${antes}\nAhora: ${ahora} · ${nights}\nHuéspedes: ${guestsOf(d)}${d.mascota ? " · con mascota" : ""}\n\n` +
    `PAGOS\n${rows.map(([k, v]) => `${k}: ${v.replace("&#10003; ", "")}`).join("\n")}\n\n` +
    `${linkLine("Ver mi reserva", d.miReservaUrl)}WhatsApp: ${d.whatsappUrl}\nAdjunto: reserva-${d.codigo}.ics\n\n${T.closing ?? closing}` +
    footText(c);
  const preheaderEnd = { sin_abono: `Abono pendiente: ${cop(d.abono)}.`, abono: `Saldo pendiente: ${cop(saldo)}.`, total: "Tu estadía está pagada." }[estado];
  return finish(c, d.logoUrl, {
    subject: T.subject ?? `Tu reserva ${d.codigo} cambió de fecha · ${fmtDate(d.checkIn)}`,
    preheader: T.preheader ?? `Nuevas fechas: ${ahora}. ${preheaderEnd}`,
    body,
    text,
  });
}

/* ───────────── Recordatorio de llegada (automático, 2 días antes) ───────────── */

type ReminderEmailData = StayData & { saldo: number; comoLlegarUrl: string; mapaUrl?: string; miReservaUrl: string; whatsappUrl: string };

export function arrivalReminderEmail(c: Cfg, d: ReminderEmailData): RenderedEmail {
  const first = firstName(d.nombre);
  const checkInWindow = `de ${fmtTime(c.checkInStart)} a ${fmtTime(c.checkInEnd)}`;
  const T = custom(c, "arrival_reminder", d, { saldo: d.saldo });
  const intro = `El ${fmtDate(d.checkIn, true)} te esperamos en la ${d.cabana}. Te dejamos lo esencial para tu llegada.`;
  const body =
    pill("Faltan 2 días", "blue") +
    (T.titleHtml ?? h1(`¡Ya casi, ${esc(first)}!`)) +
    (T.introHtml ?? p(`El <strong>${esc(fmtDate(d.checkIn, true))}</strong> te esperamos en la ${esc(d.cabana)}. Te dejamos lo esencial para tu llegada.`)) +
    codeBox(esc(d.codigo), "Confirmada", "blue") +
    h2("Tu llegada") +
    kv([
      ["Check-in", checkInWindow],
      ["Check-out", `${esc(fmtDate(d.checkOut, true))}, hasta las ${c.checkOut}`],
      ["Saldo pendiente", d.saldo ? `${cop(d.saldo)} · por transferencia antes de llegar o en recepción` : "Ninguno: tu estadía está pagada"],
    ]) +
    h2("Para tu llegada") +
    list([
      "Presenta el <strong>documento de identidad físico</strong> de cada huésped.",
      "Trae ropa abrigada: las noches en Murillo son frías.",
      `Dirección: ${esc(c.address)}.`,
      "Si vas a llegar fuera del horario de check-in, avísanos por WhatsApp.",
    ]) +
    mapBlock(c, d.mapaUrl, d.comoLlegarUrl) +
    btns([
      ["Cómo llegar", d.comoLlegarUrl, X.brand, X.cream],
      ["Ver mi reserva", d.miReservaUrl, X.hl, X.ink],
    ]) +
    small(`¿Dudas? <a href="${d.whatsappUrl}" class="em-text" style="color:${X.ink};font-weight:bold;text-decoration:underline">Escríbenos por WhatsApp</a>.`) +
    (T.closingHtml ?? "");
  const text =
    `${T.open(`¡Ya casi, ${first}!`, intro) ?? `¡Ya casi, ${first}! El ${fmtDate(d.checkIn, true)} te esperamos en la ${d.cabana}.`}\n\n` +
    `Reserva: ${d.codigo}\nCheck-in: ${checkInWindow}\nCheck-out: ${fmtDate(d.checkOut, true)}, hasta las ${c.checkOut}\nSaldo pendiente: ${d.saldo ? cop(d.saldo) : "ninguno"}\n\n` +
    `PARA TU LLEGADA\n- Documento de identidad físico de cada huésped.\n- Ropa abrigada: las noches son frías.\n- Dirección: ${c.address}\n\n` +
    `Cómo llegar: ${d.comoLlegarUrl}\n${linkLine("Ver mi reserva", d.miReservaUrl)}WhatsApp: ${d.whatsappUrl}${T.closing ? `\n\n${T.closing}` : ""}` +
    footText(c);
  return finish(c, d.logoUrl, {
    subject: T.subject ?? `Faltan 2 días para tu llegada · ${d.codigo}`,
    preheader: T.preheader ?? `Check-in ${checkInWindow}. Recuerda tu documento físico.`,
    body,
    text,
  });
}

/* ───────────── Vista previa (/correos) ───────────── */

type EmailTemplate = { name: string; to: string; subject: string; preheader: string; vars: string; html: string; text: string; sent: "auto" | "panel" };

const SAMPLE = { checkIn: "2026-10-03", checkOut: "2026-10-04" };
// El mapa de las vistas previas: el mismo de los correos, servido por el servidor (sin la clave de Geoapify a la vista).
const MAP_PREVIEW = "/correo/mapa.png";

// Un correo con datos de ejemplo, para el editor de plantillas del panel (con los textos que se están escribiendo en
// `c.emailTexts`). El logo y el mapa, servidos por el sitio.
export function sampleEmail(c: Cfg, kind: EmailTemplateKind): RenderedEmail {
  const stay = { nombre: "Laura Gómez", codigo: "ECR-7W9DX", cabana: "Cabaña Doble", ...SAMPLE, adultos: 2, ninos: 0, logoUrl: "/correo/logo.png" };
  const links = { miReservaUrl: "#", whatsappUrl: "#" };
  const moved = {
    ...stay,
    ...links,
    checkInAnterior: "2026-09-26",
    checkOutAnterior: "2026-09-27",
    mascota: false,
    total: 470000,
    abono: 141000,
    plazo: "2026-09-29T15:00:00Z",
  };
  switch (kind) {
    case "reservation_received":
      return reservationReceivedEmail(c, { ...stay, ...links, mascota: false, total: 470000, abono: 141000, plazo: "2026-09-29T15:00:00Z" });
    case "reservation_confirmed":
      return reservationConfirmedEmail(c, { ...stay, ...links, mascota: false, total: 470000, pagado: 141000, comoLlegarUrl: "#", mapaUrl: MAP_PREVIEW });
    case "balance_paid":
      return balancePaidEmail(c, { ...stay, ...links, total: 470000, pagado: 470000, enEstadia: false, comoLlegarUrl: "#", mapaUrl: MAP_PREVIEW });
    case "reservation_rescheduled":
      return reservationRescheduledEmail(c, { ...moved, pagado: 141000 });
    case "reservation_moved":
      return reservationRescheduledEmail(c, { ...moved, pagado: 0, movida: true });
    case "reservation_cancelled":
      return reservationEndedEmail(c, { ...stay, vencida: false, pagado: 141000, reservarUrl: "#", whatsappUrl: "#" });
    case "reservation_expired":
      return reservationEndedEmail(c, { ...stay, vencida: true, pagado: 0, reservarUrl: "#", whatsappUrl: "#" });
    case "arrival_reminder":
      return arrivalReminderEmail(c, { ...stay, ...links, saldo: 329000, comoLlegarUrl: "#", mapaUrl: MAP_PREVIEW });
  }
}

export function emailTemplates(c: Cfg): EmailTemplate[] {
  const preview = (logo: string) => {
    const confirmed = reservationConfirmedEmail(c, {
      nombre: "Laura Gómez",
      codigo: "ECR-7W9DX",
      cabana: "Cabaña Doble",
      ...SAMPLE,
      adultos: 2,
      ninos: 0,
      mascota: true,
      total: 470000,
      pagado: 141000,
      miReservaUrl: "#",
      comoLlegarUrl: "#",
      mapaUrl: MAP_PREVIEW,
      whatsappUrl: "#",
      logoUrl: logo,
    });
    const team = teamMessageEmail(c, {
      nombre: "Laura Gómez",
      asunto: "Tu llegada el sábado",
      codigo: "ECR-7W9DX",
      whatsappUrl: "#",
      logoUrl: logo,
      mensaje:
        "Te escribimos para confirmar tu hora de llegada.\n\nSi necesitas indicaciones para llegar desde Murillo, cuéntanos y te enviamos la ubicación exacta.",
    });
    const stay = { nombre: "Laura Gómez", codigo: "ECR-7W9DX", cabana: "Cabaña Doble", ...SAMPLE, adultos: 2, ninos: 0, logoUrl: logo };
    const received = reservationReceivedEmail(c, {
      ...stay,
      mascota: true,
      total: 470000,
      abono: 141000,
      plazo: "2026-09-29T15:00:00Z",
      miReservaUrl: "#",
      whatsappUrl: "#",
    });
    const cancelled = reservationEndedEmail(c, { ...stay, vencida: false, pagado: 141000, reservarUrl: "#", whatsappUrl: "#" });
    const expired = reservationEndedEmail(c, { ...stay, vencida: true, pagado: 0, reservarUrl: "#", whatsappUrl: "#" });
    const balancePaid = balancePaidEmail(c, {
      ...stay,
      total: 470000,
      pagado: 470000,
      enEstadia: false,
      comoLlegarUrl: "#",
      mapaUrl: MAP_PREVIEW,
      miReservaUrl: "#",
      whatsappUrl: "#",
    });
    const moved = {
      ...stay,
      checkInAnterior: "2026-09-26",
      checkOutAnterior: "2026-09-27",
      mascota: true,
      total: 470000,
      abono: 141000,
      plazo: "2026-09-29T15:00:00Z",
      miReservaUrl: "#",
      whatsappUrl: "#",
    };
    const movedDeposit = reservationRescheduledEmail(c, { ...moved, pagado: 141000 });
    const movedFull = reservationRescheduledEmail(c, { ...moved, pagado: 470000 });
    const movedPending = reservationRescheduledEmail(c, { ...moved, pagado: 0 });
    const bumped = reservationRescheduledEmail(c, { ...moved, pagado: 0, movida: true });
    const reminder = arrivalReminderEmail(c, { ...stay, saldo: 329000, comoLlegarUrl: "#", mapaUrl: MAP_PREVIEW, miReservaUrl: "#", whatsappUrl: "#" });
    return { confirmed, team, received, cancelled, expired, reminder, balancePaid, movedDeposit, movedFull, movedPending, bumped };
  };
  const { confirmed, team, received, cancelled, expired, reminder, balancePaid, movedDeposit, movedFull, movedPending, bumped } = preview("{{logoUrl}}");
  const auto = (name: string, to: string, e: RenderedEmail, vars: string): EmailTemplate => ({ name, to, sent: "auto", vars, ...e });
  return [
    auto(
      "Reserva recibida",
      "Huésped",
      received,
      "Se envía al crearse la reserva (web o panel): abono para asegurar las fechas y datos de pago (Contenido → Pagos).",
    ),
    {
      name: "Reserva confirmada",
      to: "Huésped",
      sent: "auto",
      subject: confirmed.subject,
      preheader: confirmed.preheader,
      html: confirmed.html,
      text: confirmed.text,
      vars: "Se envía una sola vez cuando el equipo registra el abono o el pago total de una reserva pendiente. Adjunta el .ics de la estadía.",
    },
    {
      name: "Mensaje del equipo",
      to: "Cliente",
      sent: "panel",
      subject: team.subject,
      preheader: team.preheader,
      html: team.html,
      text: team.text,
      vars: "Se envía desde la ficha del cliente (botón «Correo») con el asunto y el mensaje que escribe el equipo.",
    },
    auto("Recordatorio 2 días antes", "Huésped", reminder, "Se envía a las 9:00 dos días antes de la llegada a las reservas confirmadas."),
    auto("Reserva cancelada", "Huésped", cancelled, "Se envía cuando el equipo cancela la reserva."),
    auto("Reserva vencida", "Huésped", expired, "Se envía cuando llega el día de llegada sin abono."),
    auto("Pago total recibido", "Huésped", balancePaid, "Se envía cuando el equipo registra el pago que completa el saldo de una reserva ya confirmada."),
    auto(
      "Reprogramada · con abono",
      "Huésped",
      movedDeposit,
      "Se envía al cambiar las fechas con el abono pagado y saldo pendiente. Adjunta el .ics con las nuevas fechas.",
    ),
    auto("Reprogramada · pago total", "Huésped", movedFull, "Se envía al cambiar las fechas con todo pagado. Adjunta el .ics con las nuevas fechas."),
    auto(
      "Reprogramada · sin abono",
      "Huésped",
      movedPending,
      "Se envía al cambiar las fechas de una reserva que aún no tiene abono. Adjunta el .ics con las nuevas fechas.",
    ),
    auto(
      "Fechas movidas · sin abono",
      "Huésped",
      bumped,
      "Se envía cuando otra reserva paga primero las fechas de una que no tenía abono y esta se corre a las próximas libres, con el mismo valor.",
    ),
  ];
}
