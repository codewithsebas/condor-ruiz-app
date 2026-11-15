import { personRatesText } from "@/lib/booking";
import { BookingProvider, BookingWidget, CabinReserveButton } from "@/components/landing/booking";
import { CenteredAnchors } from "@/components/landing/centered-anchors";
import { CopyButton } from "@/components/landing/copy-button";
import { ExperienceGallery } from "@/components/landing/experience-gallery";
import { HeroParallax, RotatingWords } from "@/components/landing/hero-motion";
import { Horizon } from "@/components/landing/horizon";
import { LandingHeader } from "@/components/landing/landing-header";
import { PoliciesAccordion } from "@/components/landing/policies-accordion";
import { Section, SectionHeader } from "@/components/landing/section";
import { SoaringCondor } from "@/components/landing/soaring-condor";
import { PhotoLightbox } from "@/components/landing/photo-lightbox";
import { PhotoSlot } from "@/components/site/photo-slot";
import { ServiceCard } from "@/components/site/service-card";
import { SiteFooterView } from "@/components/site/footer-view";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  DottedPath,
  LoginIcon,
  LogoMark,
  LogoutIcon,
  MountainIcon,
  PawTrail,
  PhoneIcon,
  PinIcon,
  SparkleIcon,
  WhatsAppFabIcon,
  WhatsAppIcon,
} from "@/components/brand/icons";
import { config, type Cabin } from "@/lib/config";
import { lines, type SiteConfig, type SiteService, type SiteTexts } from "@/lib/site";
import { EXPERIENCES } from "@/lib/content";
import { cop, dirHref, tel, wa } from "@/lib/format";

// La página de inicio, sin leer datos: la pinta app/page.tsx con lo publicado y app/vista-previa con el borrador del panel.
// Cada zona editable lleva data-zone (lib/site-preview.ts): la vista previa la usa para ir a ella y para abrir su editor.

// Todas las fotos del sitio para la galería, en el orden en que aparecen en la portada (sin repetir ni marcadores vacíos).
function galleryOf(photos: Record<string, string>, cabins: Cabin[]): string[] {
  const all = [
    ...["hero-main", "hero-thumb-1", "hero-thumb-2", "hero-thumb-3", "hero-thumb-4"].map((id) => photos[id]),
    ...cabins.flatMap((c) => c.photos),
    ...EXPERIENCES.map((e) => photos[`exp-${e.id}`]),
    photos.contact,
  ];
  return [...new Set(all.filter(Boolean))];
}

// Waze (trazo simple, mismo estilo de los demás íconos).
function WazeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17.2c-1.8-.2-3.4-.9-4.4-2.2 1.4-.7 2-1.9 2-3.5a7.5 7.5 0 0 1 15 0c0 3.4-3 5.5-6 6h-3.4" />
      <circle cx="8.6" cy="19" r="1.6" />
      <circle cx="15.6" cy="19" r="1.6" />
      <path d="M9.5 10h.01M14.5 10h.01M10 13c1 .8 3 .8 4 0" />
    </svg>
  );
}

// Cabaña tipo A (techo hasta el suelo, fachada de vidrio triangular y baranda del balcón) frente a un solo nevado.
function HeroCabinArt() {
  return (
    <svg aria-hidden="true" width="76" height="56" viewBox="0 0 76 56" className="flex-none">
      {/* Nevado y su cumbre */}
      <path d="M4 54 L46 6 L76 54 Z" className="fill-accent" />
      <path d="M46 6 L51.6 15 L49.4 14 L47.4 16.8 L45.4 14.3 L43 16.6 L40.8 14.1 L38.1 15 Z" className="fill-card" />
      {/* Cabaña: techo, marco oscuro y vidrio */}
      <path d="M9 54 L29 13 L49 54 Z" className="fill-highlight" />
      <path d="M16 54 L29 27.5 L42 54 Z" className="fill-bg" />
      <path d="M16 54 L29 27.5 L42 54" fill="none" strokeWidth="1.6" strokeLinejoin="round" className="stroke-card/60" />
      <path d="M29 32 V54 M22 46 H36" fill="none" strokeWidth="1" className="stroke-card/35" />
      {/* Baranda del balcón */}
      <path d="M12 47.5 H46" fill="none" strokeWidth="2.4" strokeLinecap="round" className="stroke-card" />
      <path d="M16 48 V53 M22 48 V53 M29 48 V53 M36 48 V53 M42 48 V53" fill="none" strokeWidth="1.2" className="stroke-card/80" />
      <path d="M0 53 H76 V56 H0 Z" className="fill-card" />
    </svg>
  );
}

export function LandingView({
  cabins,
  site,
  photos,
  texts,
  services: allServices,
}: {
  cabins: Cabin[];
  site: SiteConfig;
  photos: Record<string, string>;
  texts: SiteTexts;
  services: SiteService[];
}) {
  const services = allServices.filter((s) => s.visible);
  // La frase resaltada del título y las que la reemplazan una tras otra (Contenido del sitio → Portada).
  const phrases = [texts.hero.highlight, ...lines(texts.hero.words)].filter(Boolean);
  return (
    // --header-h: alto del encabezado de la portada; la portada ocupa el resto de la primera pantalla.
    <div id="top" className="@container relative overflow-x-clip [--header-h:82px]">
      <LandingHeader />
      <CenteredAnchors />

      <main>
        <BookingProvider cabins={cabins}>
          {/* Portada */}
          {/* Portada viva: el cóndor llega y planea en círculos, el título sube palabra por palabra y su segunda línea
              alterna frases; la foto respira (zoom lento) y, con mouse, todo se desplaza un poco en profundidad.
              Ocupa toda la primera pantalla junto con el encabezado (como mínimo: si el contenido no cabe, crece). El título,
              los espacios y las miniaturas también dependen del alto de la ventana, para que quepan en pantallas bajas. */}
          <HeroParallax data-zone="hero" aria-label="Presentación" className="gutter-1360 relative flex min-h-[calc(100svh-var(--header-h))] flex-wrap-reverse gap-4 pb-4">
            <SoaringCondor id="condor-portada" arrive className="absolute top-8 left-[40%] z-3 w-[clamp(160px,26cqi,380px)]" opacity={0.24} />
            <div className="relative flex min-w-0 flex-[1_1_560px] flex-col justify-between gap-[clamp(20px,4svh,40px)] overflow-hidden rounded-lg bg-surface px-[calc(24px_+_1.5cqi)] py-[min(calc(24px_+_1.5cqi),5svh)]">
              <DottedPath d="M10 210 C 90 170, 20 90, 120 70 S 250 80, 240 8" width={260} height={220} className="-right-5 bottom-[120px] stroke-on-dark/45 motion-safe:[&_path]:animate-dash-march" />
              <h1 className="display relative text-[clamp(4rem,min(7.8cqi,calc(16svh-30px)),6.6rem)] leading-[.9] tracking-[.005em]">
                <span className="flex flex-wrap items-center gap-x-[.3em] gap-y-[.15em]">
                  <span>
                    {texts.hero.title.split(" ").map((w, i, all) => (
                      <span key={i} className="inline-block motion-safe:animate-rise" style={{ animationDelay: `${120 + i * 110}ms` }}>
                        {w}
                        {i < all.length - 1 && " "}
                      </span>
                    ))}
                  </span>
                  <span className="relative inline-flex items-end gap-1.5 font-body text-base leading-[1.3] font-semibold tracking-normal normal-case motion-safe:animate-pop-in [animation-delay:600ms]">
                    <SparkleIcon className="absolute -top-[18px] left-11 motion-safe:animate-twinkle" />
                    <HeroCabinArt />
                    {texts.hero.badge && <span className="max-w-[19ch] rounded-sm bg-card px-3 py-2 text-[.78rem] text-on-light">{texts.hero.badge}</span>}
                  </span>
                </span>
                {texts.hero.highlight && (
                  <span className="block text-accent pt-4">
                    {/* Los lectores de pantalla leen siempre la frase del panel; las que se alternan son decorativas. */}
                    <span className="sr-only">{texts.hero.highlight}</span>
                    <span aria-hidden="true">
                      <RotatingWords phrases={phrases} delay={420} />
                    </span>
                  </span>
                )}
              </h1>
              <div className="relative flex flex-wrap items-center justify-between gap-6 motion-safe:animate-rise [animation-delay:700ms]">
                <p className="max-w-[47ch] text-pretty text-on-dark-muted">{texts.hero.description}</p>
                <a href="#reserva" className="group btn btn-cta min-h-14 gap-3.5 py-1.5 pr-1.5 pl-[26px] font-bold whitespace-nowrap">
                  Reservar ahora
                  <span className="grid size-11 place-items-center rounded-full bg-card text-on-light transition-transform duration-300 group-hover:scale-110">
                    <ArrowRightIcon className="motion-safe:animate-nudge" />
                  </span>
                </a>
              </div>
              <div className="relative grid grid-cols-4 gap-3">
                {["hero-thumb-1", "hero-thumb-2", "hero-thumb-3", "hero-thumb-4"].map((id, i) => (
                  <div
                    key={id}
                    style={{ animationDelay: `${850 + i * 110}ms` }}
                    className="relative aspect-[1/1.1] max-h-[12svh] w-full overflow-hidden rounded-md bg-bg transition-transform duration-500 hover:-translate-y-1 motion-safe:animate-rise [&_img]:transition-transform [&_img]:duration-700 hover:[&_img]:scale-110"
                  >
                    <PhotoSlot id={id} src={photos[id]} sizes="(min-width: 1088px) 200px, 25vw" eager zoom />
                  </div>
                ))}
              </div>
            </div>
            {/* Alto mínimo solo para cuando va encima del texto (pantallas angostas): al lado, se estira al alto de la portada. */}
            <div className="relative min-h-[clamp(320px,min(46cqi,60svh),700px)] min-w-0 flex-[1_1_480px] overflow-hidden rounded-lg bg-surface">
              <div className="absolute inset-0 transition-[translate] duration-1000 ease-out motion-safe:animate-ken-burns" style={{ translate: "calc(var(--hx, 0) * 14px) calc(var(--hy, 0) * 10px)" }}>
                <PhotoSlot id="hero-main" src={photos["hero-main"]} sizes="(min-width: 1392px) 720px, (min-width: 1088px) 50vw, 100vw" preload zoom />
              </div>
              {/* Otro cóndor, lejos, sobre el cielo de la foto. */}
              <SoaringCondor id="condor-lejano" className="absolute top-[9%] right-[22%] z-2 w-[clamp(54px,6cqi,92px)]" opacity={0.55} depth={0.5} offset={0.45} slow={1.6} />
            </div>
          </HeroParallax>

          <BookingWidget />

          {/* Recorrido de la página (sistema de components/landing/section.tsx):
              Portada → Reserva → Cabañas (valle) → Servicios (crema) → Experiencias → Ubicación (valle)
              → Antes de venir → Contacto → pie de página (noche). */}
          <div aria-hidden="true" className="gutter-1360 pt-6">
            <PawTrail variant="a" className="ml-auto" />
          </div>

          {/* Cabañas */}
          {/* Pantalla completa: la foto de cada cabaña y los textos se ajustan al alto de la ventana para que la sección
              quepa en una pantalla (como mínimo; con muchas cabañas o textos largos, crece). */}
          <Section id="cabanas" data-zone="cabanas" tone="deep" labelledBy="cabanas-title" fit>
            <DottedPath d="M-10 150 C 60 140, 30 60, 110 60 S 190 20, 170 0" width={200} height={160} className="-top-14 left-0 stroke-on-dark/30" />
            <SectionHeader
              id="cabanas-title"
              fit
              kicker="Elige la tuya"
              title="Nuestras cabañas"
              accent="tipo chalet"
              subtitle="Cabañas tipo chalet con vista al Nevado del Ruiz. Compara y elige la que mejor se ajusta a tu grupo: el precio se calcula al instante con tus fechas."
            >
              <a href="#servicios" className="group btn btn-surface min-h-11 px-[20px] text-[.92rem] font-bold">
                Todas las cabañas incluyen
                <ArrowDownIcon className="transition-transform duration-300 group-hover:translate-y-0.5" />
              </a>
            </SectionHeader>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
              {/* Cada tarjeta aparece al llegar con el scroll (la de al lado, un instante después); al pasar el mouse se
                  eleva y su foto se acerca despacio. */}
              {cabins.map((c, i) => {
                return (
                  <article key={c.id} className={`reveal-on-scroll reveal-tall group flex flex-col gap-[clamp(10px,2svh,16px)] rounded-lg bg-card p-3 text-on-light transition duration-250 hover:-translate-y-1.5 hover:shadow-card ${i % 2 ? "[--reveal-after:64px]" : ""}`}>
                    <div className="relative aspect-4/3 max-h-[26svh] w-full overflow-hidden rounded-md bg-card-muted">
                      <div className="absolute inset-0 transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]">
                        <PhotoSlot src={c.photos[0]} alt={c.full} placeholder={`Foto real: ${c.full.toLowerCase()}`} sizes="(min-width: 1392px) 660px, (min-width: 888px) 50vw, 100vw" zoom />
                      </div>
                      {c.badge && <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-highlight px-3.5 py-[7px] text-[.8rem] font-extrabold text-on-light">{c.badge}</span>}
                    </div>
                    <div className="flex flex-col gap-[clamp(8px,1.6svh,12px)] px-2 pb-2">
                      <h3 className="display text-[clamp(1.9rem,4.6svh,2.4rem)] leading-none">{c.full}</h3>
                      {c.description && <p className="max-w-[60ch] text-[.95rem] text-pretty">{c.description}</p>}
                      {c.features.length > 0 && (
                        <ul aria-label={`Características de ${c.full}`} className="flex flex-wrap gap-1.5">
                          {c.features.map((f) => (
                            <li key={f} className="rounded-full bg-card-muted px-3 py-1 text-[.82rem] font-semibold">
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <dl className="grid grid-cols-[auto_auto] gap-x-[18px] gap-y-1.5 text-[.92rem]">
                          <dt className="font-medium">{c.tiers ? `Noche para ${c.fromGuests ?? 2}` : "Noche en pareja"}</dt>
                          <dd className="text-[1.1rem] font-extrabold">{cop(c.couple)}</dd>
                          {c.tiers ? (
                            <>
                              <dt className="font-medium">Por personas</dt>
                              <dd className="max-w-[26ch] font-bold">{personRatesText(c.tiers)}</dd>
                            </>
                          ) : (
                            <>
                              <dt className="font-medium">Persona adicional</dt>
                              <dd className="font-bold">{cop(c.extra)}</dd>
                            </>
                          )}
                          <dt className="font-medium">Capacidad</dt>
                          <dd className="font-bold">Máximo {c.max} personas</dd>
                        </dl>
                        <CabinReserveButton cabin={c.id} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </Section>
        </BookingProvider>

        {/* Servicios: la única sección clara; las tarjetas oscuras resaltan sobre el crema. */}
        <Section id="servicios" data-zone="servicios" tone="light" labelledBy="servicios-title">
          <SectionHeader id="servicios-title" tone="light" kicker="Incluido en tu estadía" title="Servicios" accent="incluidos" subtitle="Lo que encuentras al llegar. Lo marcado como adicional se cotiza aparte." />
          {/* Servicios del panel (Contenido del sitio → Servicios); cada tarjeta aparece al llegar con el scroll. */}
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] sm:gap-3.5">
            {services.map((s, i) => (
              <li key={s.id} className="reveal-on-scroll text-on-dark">
                <ServiceCard s={s} index={i} />
              </li>
            ))}
          </ul>
        </Section>

        {/* Experiencias: composición abierta, la galería a todo el ancho del contenido. */}
        <Section id="experiencias" data-zone="experiencias" labelledBy="experiencias-title" fit>
          <SectionHeader id="experiencias-title" fit kicker="Lo que te espera" title="Alta montaña" accent="frente al nevado" subtitle="Naturaleza de alta montaña alrededor de tu cabaña: el nevado, la cascada, las aves y el fuego de la noche." />
          <ExperienceGallery items={EXPERIENCES.map((e) => ({ ...e, src: photos[`exp-${e.id}`] }))} />
        </Section>

        {/* Horizonte: la cordillera y el nevado entre niebla, antes de bajar al valle de «Así se llega». */}
        <Horizon />

        {/* Ubicación */}
        <Section id="ubicacion" data-zone="ubicacion" tone="deep" labelledBy="ubicacion-title" fit>
          <SectionHeader id="ubicacion-title" fit kicker="Así se llega" title="En Murillo" accent="el pueblo más alto del Tolima" breakTitle subtitle="Abre la ruta en Google Maps o Waze desde donde estés, o copia la dirección para compartirla." />
          <div className="flex flex-wrap gap-4">
            {/* Mapa con etiquetas flotantes */}
            <div className="reveal-on-scroll relative min-h-[320px] min-w-0 flex-[1.4_1_480px] overflow-hidden rounded-lg bg-surface ring-1 ring-on-dark/10 sm:min-h-[clamp(320px,50svh,460px)]">
              <iframe
                title={`Mapa de ubicación de ${config.name}`}
                src={`https://maps.google.com/maps?q=${config.lat},${config.lng}&z=15&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 size-full border-0"
              />
              <span className="pointer-events-none absolute top-4 left-4 flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-[.85rem] font-extrabold text-on-light shadow-card">
                <span className="relative grid size-2.5 place-items-center">
                  <span className="absolute inset-0 rounded-full bg-error motion-safe:animate-ping" />
                  <span className="size-2.5 rounded-full bg-error" />
                </span>
                Murillo, Tolima
              </span>
              <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-bg/85 px-3 py-1.5 text-[.75rem] font-bold tracking-wide text-card tabular-nums backdrop-blur">
                {Math.abs(config.lat).toFixed(4)}° {config.lat >= 0 ? "N" : "S"} · {Math.abs(config.lng).toFixed(4)}° {config.lng >= 0 ? "E" : "O"}
              </span>
            </div>

            {/* Tarjeta de ruta: la ilustración se dibuja al llegar con el scroll y un punto recorre el camino. */}
            <div className="reveal-on-scroll flex min-w-0 flex-[1_1_360px] flex-col gap-[clamp(12px,2.4svh,20px)] overflow-hidden rounded-lg bg-card text-on-light">
              {/* En pantallas bajas la ilustración se recorta por arriba (cielo) para que la sección quepa. */}
              <svg viewBox="0 0 400 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true" className="block aspect-[400/170] max-h-[20svh] w-full">
                <rect width="400" height="170" className="fill-card-muted" />
                <path d="M0 170V112l48-30 34 18 46-46 40 34 30-18 52 50 38-36 46 32 30-22 36 30v46z" className="fill-accent/35" />
                <path d="M228 170 282 64q8-10 18-12h16q10 2 18 12l52 106z" className="fill-accent/60" />
                <path d="M282 64q8-10 18-12h16q10 2 18 12l-8 8-8-7-8 9-8-8-8 8-8-7-8 6z" className="fill-card" />
                <path d="M0 170v-28c50-12 110 8 170-4s130 6 230-6v38z" className="fill-bg" />
                <defs>
                  <mask id="ruta-mascara">
                    <path d="M34 148C90 150 96 112 148 116s70 26 110-6 54-40 86-36" fill="none" stroke="white" strokeWidth="10" pathLength={1} className="draw-on-scroll" />
                  </mask>
                </defs>
                <path id="ruta" d="M34 148C90 150 96 112 148 116s70 26 110-6 54-40 86-36" fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 9" mask="url(#ruta-mascara)" className="stroke-highlight" />
                <circle r="6" className="fill-highlight motion-reduce:hidden">
                  <animateMotion dur="5s" repeatCount="indefinite" rotate="auto" keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="linear">
                    <mpath href="#ruta" />
                  </animateMotion>
                </circle>
                <g transform="translate(34 148)">
                  <circle r="9" className="fill-bg" />
                  <circle r="3.5" className="fill-card" />
                </g>
                <text x="18" y="132" className="fill-on-light font-body text-[12px] font-extrabold">Tú</text>
                <g transform="translate(344 74)">
                  <path d="M0 0c-9-11-14-17-14-24a14 14 0 0 1 28 0c0 7-5 13-14 24z" className="fill-bg" />
                  <circle cy="-24" r="5" className="fill-card" />
                </g>
              </svg>
              <div className="flex flex-1 flex-col gap-[clamp(12px,2.4svh,20px)] px-7 pb-[clamp(18px,3.5svh,28px)]">
                <div className="flex items-start gap-3.5">
                  <span aria-hidden="true" className="grid size-12 flex-none place-items-center rounded-full bg-cta text-cta-text">
                    <PinIcon size={22} stroke={2} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[.8rem] font-extrabold uppercase tracking-[.1em]">Dirección</h3>
                    <p className="mt-1 text-[1.1rem] font-bold">{config.address}</p>
                  </div>
                </div>
                {texts.location.note && (
                  <p className="flex items-center gap-2.5 rounded-md bg-card-muted px-[18px] py-3.5 font-semibold">
                    <MountainIcon size={22} />
                    {texts.location.note}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap gap-2.5">
                  <a href={dirHref()} target="_blank" rel="noopener" className="group btn btn-cta min-h-[52px] gap-2.5 px-6">
                    <PinIcon size={18} />
                    Google Maps
                    <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
                  </a>
                  <a href={`https://waze.com/ul?ll=${config.lat},${config.lng}&navigate=yes`} target="_blank" rel="noopener" className="btn btn-outline-light min-h-[52px] gap-2 px-5 font-bold hover:bg-card-muted">
                    <WazeIcon />
                    Waze
                  </a>
                  <CopyButton text={config.address} label="Copiar dirección" className="btn min-h-[52px] gap-2 px-4 font-bold text-on-light underline-offset-4 hover:underline" />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Antes de venir: horarios y preguntas frecuentes juntos. A la izquierda el encabezado y los horarios
            (fijos al hacer scroll en pantallas anchas); a la derecha, las preguntas. */}
        <Section id="antes-de-venir" labelledBy="pol-title" className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
          <div data-zone="horarios" className="flex flex-col gap-6 lg:sticky lg:top-8">
            <SectionHeader id="pol-title" layout="stack" kicker="Antes de venir" title="Horarios" accent="y políticas" breakTitle subtitle="Lo que conviene saber para que tu llegada sea tranquila. ¿Tienes otra duda? Escríbenos.">
              <a href={wa(site.whatsapp)} target="_blank" rel="noopener" className="btn btn-card min-h-12 gap-2 px-[22px] font-bold">
                <WhatsAppIcon />
                Escribir por WhatsApp
              </a>
            </SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Check-in", site.checkIn, <LoginIcon key="i" size={22} />],
                ["Check-out", site.checkOut, <LogoutIcon key="o" size={22} />],
              ].map(([label, value, icon], i) => (
                <div key={label as string} className={`reveal-on-scroll flex flex-col gap-3 rounded-lg bg-card p-5 text-on-light ${i ? "[--reveal-after:48px]" : ""}`}>
                  <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-cta text-cta-text">
                    {icon}
                  </span>
                  <div>
                    <h3 className="text-[.75rem] font-extrabold uppercase tracking-[.12em]">{label}</h3>
                    <p className="display mt-1 text-[clamp(1.5rem,2.4vw,2rem)] leading-none normal-case">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div data-zone="politicas">
            <PoliciesAccordion policies={site.policies} />
          </div>
        </Section>

        {/* Contacto */}
        {/* Contacto: sobrio y elegante. Foto enmarcada con una leyenda de vidrio; al lado, cada canal como una fila
            (ícono, qué es, número y una flecha que se desliza al pasar el mouse). Sin animaciones que llamen la atención. */}
        <Section id="contacto" data-zone="contacto" labelledBy="contact-title">
          <div className="reveal-on-scroll relative isolate grid gap-3 overflow-hidden rounded-lg bg-surface p-3 text-on-dark md:grid-cols-[1fr_1.15fr]">
            <svg aria-hidden="true" viewBox="0 0 600 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-24 w-full fill-bg/45">
              <path d="M0 120V84l70-30 50 22 80-46 60 40 50-24 90 42 70-36 60 26 70-30v72z" />
            </svg>

            <figure className="group relative min-h-[260px] overflow-hidden rounded-md bg-bg md:min-h-[400px]">
              <div className="absolute inset-0 transition-transform duration-[1.6s] ease-out group-hover:scale-[1.04]">
                <PhotoSlot id="contact" src={photos.contact} sizes="(min-width: 1392px) 620px, (min-width: 768px) 45vw, 100vw" zoom />
              </div>
              <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/55 via-black/5 to-transparent" />
              <figcaption className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-xl bg-bg/55 px-4 py-3 ring-1 ring-card/15 backdrop-blur-md">
                <span className="grid size-10 flex-none place-items-center rounded-full border-2 border-on-dark">
                  <LogoMark size={28} snow />
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="font-script text-[1.25rem] text-card">Te esperamos en la montaña</span>
                  <span className="text-[.8rem] font-semibold text-on-dark-muted">Murillo, Tolima · frente al Nevado del Ruiz</span>
                </span>
              </figcaption>
            </figure>

            <div className="flex flex-col justify-center gap-7 px-[calc(12px_+_1.5cqi)] py-[calc(16px_+_1.5cqi)]">
              <div className="flex flex-col gap-3">
                <p className="kicker">
                  <SparkleIcon />
                  Atención familiar
                </p>
                <h2 id="contact-title" className="display text-[clamp(2.6rem,4.6cqi,4.4rem)] leading-[.92]">
                  Contacto <span className="text-accent">directo</span>
                </h2>
                <p className="max-w-[46ch] text-on-dark-muted">Será un placer atenderte. Resolvemos contigo fechas, cabañas, mascotas o una ocasión especial.</p>
              </div>
              <ul className="flex flex-col">
                {[
                  { href: wa(site.whatsapp, "Hola, quiero información para reservar."), external: true, icon: <WhatsAppIcon size={20} />, label: "WhatsApp", value: "Escríbenos un mensaje", strong: true },
                  ...site.phones.map((p, i) => ({ href: tel(p), external: false, icon: <PhoneIcon size={18} />, label: i === 0 ? "Llámanos" : "Otra línea", value: p, strong: false })),
                ].map((c, i) => (
                  <li key={c.href} className={i ? "border-t-2 border-dotted border-on-dark/15" : ""}>
                    <a
                      href={c.href}
                      {...(c.external && { target: "_blank", rel: "noopener" })}
                      className="group flex min-h-[68px] items-center gap-4 rounded-md px-2 py-3 transition-colors duration-300 hover:bg-bg/35"
                    >
                      <span aria-hidden="true" className={`grid size-11 flex-none place-items-center rounded-full transition-colors duration-300 ${c.strong ? "bg-card text-on-light" : "bg-bg/50 text-accent group-hover:bg-card group-hover:text-on-light"}`}>
                        {c.icon}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col leading-tight">
                        <span className="text-[.74rem] font-extrabold tracking-[.12em] text-accent uppercase">{c.label}</span>
                        <span className="mt-1 text-[1.08rem] font-bold tabular-nums">{c.value}</span>
                      </span>
                      <ArrowRightIcon className="flex-none text-on-dark/40 transition-[transform,color] duration-300 group-hover:translate-x-1 group-hover:text-card" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      </main>
      <PhotoLightbox photos={galleryOf(photos, cabins)} />

      <SiteFooterView c={site} texts={texts} />

      <a
        href={wa(site.whatsapp)}
        target="_blank"
        rel="noopener"
        aria-label="Escribir por WhatsApp"
        className="fixed right-5 bottom-5 z-60 grid size-[60px] place-items-center rounded-full bg-highlight text-on-light shadow-card transition-transform hover:scale-106"
      >
        <WhatsAppFabIcon size={26} />
      </a>
    </div>
  );
}
