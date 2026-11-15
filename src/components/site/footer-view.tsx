import Link from "next/link";
import { dirHref, tel, wa } from "@/lib/format";
import type { SiteConfig, SiteTexts } from "@/lib/site";
import { ArrowUpIcon, CalendarIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/brand/icons";
import { Marca } from "@/components/brand/marca";
import { SoaringCondor } from "@/components/landing/soaring-condor";
import { FooterCabins } from "@/components/site/footer-cabins";

// Pie de página: una noche en el páramo, el cierre de la portada de día. Cielo con estrellas que titilan y un cóndor
// enorme planeando al fondo; invitación a reservar; datos de contacto; y el nombre gigante que se hunde detrás de las
// cordilleras y el Nevado nevado. Todo lo que se mueve respeta «reducir movimiento».

const heading = "mb-2 flex items-center gap-2 font-body text-[.78rem] font-extrabold uppercase tracking-[.12em] text-accent";
const row = "flex min-h-11 items-center lg:min-h-10";
// Subrayado que crece desde la izquierda al pasar el mouse o al enfocar.
const link =
  "w-fit bg-linear-to-r from-accent to-accent bg-[length:0%_2px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size,color] duration-300 hover:bg-[length:100%_2px] hover:text-card focus-visible:bg-[length:100%_2px]";

// Estrellas en posiciones fijas (pseudoaleatorias pero iguales en servidor y navegador).
const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: (i * 37.7) % 100,
  y: (i * 23.3) % 58,
  size: i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
  delay: (i * 0.73) % 4.5,
}));

const SOCIAL_ICONS = {
  Instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  ),
  Facebook: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h3l1-4h-4V7.5a1 1 0 0 1 1-1h2z" />
    </svg>
  ),
  TikTok: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.6 2.4 4.5 5 4.8" />
    </svg>
  ),
} as const;

// Cordilleras en capas, de lejos a cerca.
function Ranges({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1440 260" preserveAspectRatio="none" className={`pointer-events-none block w-full ${className}`}>
      <path d="M0 260V170l90-30 80 20 90-50 80 40 90-30 90 30 90-50 90 40 90-25 90 35 100-45 90 35 90-22 90 32 90-25 100 20v115z" className="fill-surface/70" />
      {/* El Nevado del Ruiz va en la ilustración de las cabañas (footer-cabins.tsx). */}
      <path
        d="M0 260v-55l120-30 90 20 110-35 110 40 110-30 110 35 110-25 100 30 120-25 120 25 110-32 120 27 110-20v75z"
        className="fill-[color-mix(in_srgb,var(--color-deep)_55%,var(--color-night))]"
      />
      <path d="M0 260v-30c120-15 240 10 380-4s260 10 400-2 280 14 420 2 180 6 240 2v32z" fill="#5b6b4d" />
    </svg>
  );
}

// Sin leer datos: lo pinta footer.tsx con lo publicado y la vista previa del panel con el borrador.
export function SiteFooterView({ c, texts }: { c: SiteConfig; texts: SiteTexts; tall?: boolean }) {
  const social = (
    [
      ["Instagram", texts.social.instagram],
      ["Facebook", texts.social.facebook],
      ["TikTok", texts.social.tiktok],
    ] as const
  ).filter(([, url]) => url);

  return (
    // Continuación de la página: empieza exactamente en el verde general (sin corte con la sección anterior) y se
    // oscurece de a poco — bg → deep → night — como el atardecer en la montaña. Encima, capas muy tenues: un
    // resplandor sobre el horizonte y estrellas que aparecen a medida que oscurece.
    <footer
      data-zone="redes"
      className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[linear-gradient(to_bottom,var(--color-bg),var(--color-deep)_clamp(140px,16vw,300px),color-mix(in_srgb,var(--color-deep)_55%,var(--color-night))_70%,var(--color-night))] text-on-dark"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_72%_28%,rgb(127_174_132/0.12),transparent_55%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[64%] [mask-image:linear-gradient(to_bottom,transparent,black_38%)]"
      >
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-card motion-safe:animate-star"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, opacity: 0.7, animationDelay: `${-s.delay}s` }}
          />
        ))}
      </div>
      <SoaringCondor
        id="condor-pie"
        className="absolute top-[4%] right-[4%] -z-10 w-[clamp(240px,38vw,620px)]"
        opacity={0.09}
        depth={0}
        offset={0.3}
        slow={1.9}
      />

      <div className="relative flex flex-1 flex-col justify-center gutter-1360 pt-[clamp(20px,4vh,72px)]">
        {/* Invitación final */}
        <div className="reveal-on-scroll flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-b-2 border-dotted border-on-dark/20 pb-[clamp(16px,3.4vh,44px)]">
          <p className="display max-w-[16ch] text-[clamp(2.2rem,min(5vw,9vh),5.2rem)] leading-[.9] lg:max-w-none">
            ¿Listo para despertar <span className="text-accent">frente al nevado?</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/reservar" className="btn btn-highlight min-h-14 px-7 font-bold transition-transform hover:-translate-y-0.5 lg:min-h-12">
              Reservar ahora
            </Link>
            <a
              href={wa(c.whatsapp, "Hola, quiero reservar una cabaña.")}
              target="_blank"
              rel="noopener"
              className="btn btn-outline-dark min-h-14 gap-2 px-6 font-bold transition-colors hover:bg-on-dark hover:text-on-light lg:min-h-12"
            >
              <WhatsAppIcon size={18} />
              Escríbenos
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-[clamp(16px,3.4vh,44px)] lg:grid-cols-4 lg:gap-x-10">
          <div className="col-span-2 flex flex-col items-start gap-4 sm:col-span-1 lg:gap-2.5">
            <Marca parte="logo" width={150} className="bg-on-dark" />
            <p className="max-w-[28ch] text-on-dark-muted">{c.tagline}</p>
            {c.rnt && <p className="text-[.85rem] font-bold">RNT {c.rnt}</p>}
            {social.length > 0 && (
              <ul aria-label="Redes sociales" className="flex flex-wrap gap-2">
                {social.map(([name, url]) => (
                  <li key={name}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener"
                      aria-label={name}
                      title={name}
                      className="grid size-11 place-items-center rounded-full border-2 border-on-dark/30 transition-[background-color,border-color,color,transform] duration-300 hover:-translate-y-0.5 hover:border-card hover:bg-card hover:text-on-light lg:size-10"
                    >
                      {SOCIAL_ICONS[name]}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
            <h2 className={heading}>
              <PinIcon size={15} />
              Dirección y horarios
            </h2>
            <span>{c.address}</span>
            <span className="text-on-dark-muted">Check-in: {c.checkIn}</span>
            <span className="text-on-dark-muted">Check-out: {c.checkOut}</span>
            <a href={dirHref()} target="_blank" rel="noopener" className={`${row} font-bold`}>
              <span className={link}>Cómo llegar →</span>
            </a>
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className={heading}>
              <PhoneIcon size={15} />
              Teléfonos
            </h2>
            {c.phones.map((p) => (
              <a key={p} href={tel(p)} className={`${row} font-semibold tabular-nums`}>
                <span className={link}>{p}</span>
              </a>
            ))}
            <a href={wa(c.whatsapp)} target="_blank" rel="noopener" className={`${row} gap-2 font-bold`}>
              <WhatsAppIcon size={16} />
              <span className={link}>WhatsApp</span>
            </a>
          </div>
          <nav aria-label="Enlaces de reservas" className="flex flex-col gap-0.5">
            <h2 className={heading}>
              <CalendarIcon size={15} />
              Reservas
            </h2>
            {[
              ["/reservar", "Reservar"],
              ["/mi-reserva", "Consultar mi reserva"],
              ["/politicas", "Políticas de reserva"],
              ["/privacidad", "Política de privacidad"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className={`${row} font-semibold`}>
                <span className={link}>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* El nombre se hunde detrás de las cordilleras y, delante, las cuatro cabañas en fila sobre el prado; un cóndor
          pequeño cruza el cielo. El pie mide al menos lo mismo que la pantalla (en computador, todo a la vista): la ilustración tiene un
          alto acotado y el espacio que sobra se lo lleva la parte de arriba; en celular el pie crece con su contenido. */}
      <div aria-hidden="true" className="relative flex flex-none flex-col">
        {/* El nombre, entero y en color sólido (como la invitación de arriba), por encima de la ilustración. */}
        <p className="display reveal-on-scroll flex-none gutter-1360 pt-[.1em] text-[clamp(2.6rem,min(8vw,12vh),8.5rem)] leading-[.86] whitespace-nowrap">
          El Cóndor <span className="text-accent">del Ruiz</span>
        </p>
        {/* Cabañas y Nevado: ocupan el alto que deje libre la pantalla. */}
        <div className="relative mt-[clamp(4px,1vh,12px)] h-[clamp(130px,22vh,250px)]">
          <Ranges className="absolute inset-x-0 bottom-0 h-[48%]" />
          <FooterCabins className="absolute bottom-0 left-1/2 h-full w-auto max-w-full -translate-x-1/2" />
        </div>
        <SoaringCondor
          id="condor-cordillera"
          className="absolute top-[38%] right-[6%] w-[clamp(40px,6vw,96px)]"
          opacity={0.6}
          depth={0}
          offset={0.7}
          slow={1.3}
        />
      </div>

      {/* Franja final: el prado verde de la ilustración, con textos claros. */}
      <div
        className="relative flex-none bg-[#5b6b4d]"
        style={{
          // Matas de pasto repartidas en el verde (briznas curvas en dos tonos), sobre una sombra que oscurece hacia abajo.
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='48'%3E%3Cg fill='%2346563b'%3E%3Cpath d='M10 40q1-6 2-11q1 5 1.5 11zM13 40q1.5-7 4-12q-1 6-2 12zM8 40q-1-5-3-9q2 4 4.5 9z'/%3E%3Cpath d='M58 20q1-5 2-9q1 4 1.5 9zM61 20q1.5-6 3.5-10q-1 5-1.5 10z'/%3E%3Cpath d='M78 44q1-4 1.5-7q1 3 1.2 7z'/%3E%3C/g%3E%3Cg fill='%236d8059'%3E%3Cpath d='M30 28q1-5 1.8-9q.9 4 1.3 9zM33 28q1.2-5 3-8q-.8 4-1.2 8z'/%3E%3Cpath d='M46 46q.8-4 1.5-7q.8 3 1 7z'/%3E%3Cpath d='M84 16q.8-4 1.4-6q.7 3 .9 6z'/%3E%3C/g%3E%3Ccircle cx='70' cy='34' r='1.2' fill='%23f3e7a1' opacity='.8'/%3E%3C/svg%3E"), linear-gradient(to bottom, transparent, rgb(0 0 0 / 0.18))`,
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 gutter-1360 pt-3 pb-[88px] text-[.85rem] text-[#e4e8d6] sm:items-center sm:pb-[clamp(12px,2.4vh,24px)]">
          <div className="flex max-w-[110ch] flex-col gap-1.5">
            <p>
              {c.name} rechaza la explotación y el abuso sexual de niños, niñas y adolescentes (Ley 679 de 2001). Denuncia al 141 del ICBF o a la línea 123.
            </p>
            <p>
              © {new Date().getFullYear()} {c.name}
              {c.rnt && ` · RNT ${c.rnt}`} · Desarrollado en Murillo por <strong className="font-bold text-[#fbf6ec]">Joab Giraldo</strong>
            </p>
          </div>
          <a href="#" className="group flex min-h-11 items-center gap-2 font-bold text-[#fbf6ec] transition-colors hover:text-[#ffd27f] sm:mr-20">
            Volver arriba
            <span className="grid size-9 place-items-center rounded-full border-2 border-current transition-transform duration-300 group-hover:-translate-y-1">
              <ArrowUpIcon size={15} />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
