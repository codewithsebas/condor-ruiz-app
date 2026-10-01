import Link from "next/link";
import { dirHref, tel, wa } from "@/lib/format";
import { getSite } from "@/lib/server/site";
import { LogoMark } from "./icons";

const heading = "mb-1.5 font-body text-[.78rem] font-extrabold uppercase tracking-[.1em] text-accent";
const row = "flex min-h-11 items-center";

export async function SiteFooter() {
  const { c, texts } = await getSite();
  const social = [
    ["Instagram", texts.social.instagram],
    ["Facebook", texts.social.facebook],
    ["TikTok", texts.social.tiktok],
  ].filter(([, url]) => url);
  return (
    <footer className="gutter-1360 flex flex-col gap-10 overflow-hidden bg-footer pt-14 pb-[110px] text-on-dark">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-8">
        <div className="flex flex-col items-start gap-3.5">
          <span className="grid size-[68px] place-items-center rounded-full border-2 border-on-dark">
            <LogoMark size={50} />
          </span>
          <p className="max-w-[28ch] text-on-dark-muted">{c.tagline}</p>
          {c.rnt && <p className="text-[.85rem] font-bold">RNT {c.rnt}</p>}
          {social.length > 0 && (
            <ul aria-label="Redes sociales" className="flex flex-wrap gap-x-4 gap-y-1">
              {social.map(([name, url]) => (
                <li key={name}>
                  <a href={url} target="_blank" rel="noopener" className={`${row} font-bold underline`}>
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className={heading}>Dirección y horarios</h2>
          <span>{c.address}</span>
          <span>Check-in: {c.checkIn}</span>
          <span>Check-out: {c.checkOut}</span>
          <a href={dirHref()} target="_blank" rel="noopener" className={`${row} font-bold underline`}>
            Cómo llegar
          </a>
        </div>
        <div className="flex flex-col gap-0.5">
          <h2 className={heading}>Teléfonos</h2>
          {c.phones.map((p) => (
            <a key={p} href={tel(p)} className={`${row} font-semibold`}>
              {p}
            </a>
          ))}
          <a href={wa(c.whatsapp)} target="_blank" rel="noopener" className={`${row} font-bold underline`}>
            WhatsApp
          </a>
        </div>
        <nav aria-label="Enlaces legales" className="flex flex-col gap-0.5">
          <h2 className={heading}>Reservas</h2>
          <Link href="/reservar" className={`${row} font-semibold`}>Reservar</Link>
          <Link href="/mi-reserva" className={`${row} font-semibold`}>Consultar mi reserva</Link>
          <Link href="/politicas" className={`${row} font-semibold`}>Políticas de reserva</Link>
          <Link href="/privacidad" className={`${row} font-semibold`}>Política de privacidad</Link>
        </nav>
      </div>
      <p aria-hidden="true" className="display whitespace-nowrap text-[clamp(3rem,13vw,12rem)] leading-[.8] text-accent">
        El Cóndor del Ruiz
      </p>
      <div className="flex flex-col gap-2.5 border-t-2 border-dotted border-on-dark/25 pt-5 text-[.82rem] text-on-dark-muted">
        <p className="max-w-[90ch]">
          En cumplimiento de la Ley 679 de 2001, {c.name} rechaza la explotación, la pornografía, el turismo sexual y cualquier forma de abuso sexual contra niños, niñas y adolescentes. Denuncia al 141 del ICBF o en la línea 123.
        </p>
        <p>
          © {new Date().getFullYear()} {c.name}
          {c.rnt && ` · RNT ${c.rnt}`}
        </p>
      </div>
    </footer>
  );
}
