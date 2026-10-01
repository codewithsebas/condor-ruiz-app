import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BookingProvider, BookingWidget, CabinReserveButton } from "@/components/landing/booking";
import { LandingHeader } from "@/components/landing/landing-header";
import { PoliciesAccordion } from "@/components/landing/policies-accordion";
import { PhotoSlot } from "@/components/photo-slot";
import { SiteFooter } from "@/components/site-footer";
import {
  ArrowDownIcon, ArrowRightIcon, CondorSilhouette, DottedPath, LoginIcon, LogoutIcon, MountainIcon, PawTrail, PhoneIcon, PinIcon, SparkleIcon, StarIcon, WhatsAppFabIcon, WhatsAppIcon,
} from "@/components/icons";
import { config, type Cabin } from "@/lib/config";
import { getSiteCabins } from "@/lib/server/cabins";
import { getSite } from "@/lib/server/site";
import type { SiteConfig } from "@/lib/site";
import { EXPERIENCES, SERVICES } from "@/lib/content";
import { cop, dirHref, tel, wa } from "@/lib/format";

export const metadata: Metadata = {
  title: { absolute: `${config.name} · Chalets frente al Nevado del Ruiz en Murillo, Tolima` },
  description: "Cabañas tipo chalet con vista al Nevado del Ruiz y a una cascada en Murillo, Tolima. Desayuno incluido, jacuzzi, fogata, sendero ecológico y pet friendly. Reserva en línea.",
  openGraph: {
    title: `${config.name} · Murillo, Tolima`,
    description: "Despierta frente al Nevado del Ruiz. Cabañas tipo chalet con desayuno incluido.",
  },
  twitter: { card: "summary_large_image" },
};

// Página estática que se regenera cada hora o al guardar tarifas en el panel.
export const revalidate = 3600;

function jsonLd(cabins: Cabin[], site: SiteConfig) {
  const prices = cabins.length ? cabins.map((c) => c.couple) : [0];
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: config.name,
    description: config.tagline,
    telephone: "+57 " + site.phones[0],
    address: { "@type": "PostalAddress", streetAddress: config.street, addressLocality: config.city, addressRegion: config.region, addressCountry: config.country },
    geo: { "@type": "GeoCoordinates", latitude: config.lat, longitude: config.lng },
    priceRange: `${cop(Math.min(...prices))} - ${cop(Math.max(...prices))} COP por noche`,
    checkinTime: site.checkInStart,
    checkoutTime: site.checkOutTime,
    petsAllowed: "Sí, razas pequeñas",
    currenciesAccepted: "COP",
  };
}

const section = "gutter-1360 pb-[calc(48px_+_3cqi)]";

function SectionHead({ kicker, children, className = "" }: { kicker: string; children: ReactNode; className?: string }) {
  return (
    <div className={`relative mb-8 flex flex-wrap items-end gap-x-8 gap-y-2 ${className}`}>
      <p className="kicker pb-[.4em]">
        <SparkleIcon />
        {kicker}
      </p>
      {children}
    </div>
  );
}

function HeroCabinArt() {
  return (
    <svg aria-hidden="true" width="76" height="56" viewBox="0 0 76 56" className="flex-none">
      <path d="M4 54 L30 12 L40 24 L48 16 L74 54 Z" className="fill-accent" />
      <path d="M30 12 L37 21.5 L33.5 21 L30 18.5 L26 23 Z M48 16 L54.5 25 L51 24.5 L48 22 L45 25.5 L42.5 22.5 Z" className="fill-card" />
      <path d="M22 54 V38 L34 26 L46 38 V54 Z" className="fill-highlight" />
      <path d="M19 39 L34 23.5 L49 39" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-card" />
      <path d="M30 54 V44 H38 V54 Z" className="fill-bg" />
      <path d="M0 53 H76 V56 H0 Z" className="fill-card" />
    </svg>
  );
}

export default async function HomePage() {
  const [cabins, { c: site, photos, texts }] = await Promise.all([getSiteCabins(), getSite()]);
  return (
    <div id="top" className="@container relative overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(cabins, site)).replace(/</g, "\\u003c") }} />
      <LandingHeader />

      <main>
        <BookingProvider cabins={cabins}>
          {/* Portada */}
          <section aria-label="Presentación" className="gutter-1360 relative flex flex-wrap-reverse gap-4">
            <CondorSilhouette className="pointer-events-none absolute top-8 left-[44%] z-3 h-auto w-[clamp(160px,26cqi,380px)] -rotate-8 fill-on-dark/22" />
            <div className="relative flex min-w-0 flex-[1_1_560px] flex-col justify-between gap-10 overflow-hidden rounded-lg bg-surface p-[calc(24px_+_1.5cqi)]">
              <DottedPath d="M10 210 C 90 170, 20 90, 120 70 S 250 80, 240 8" width={260} height={220} className="-right-5 bottom-[120px] stroke-on-dark/45" />
              <h1 className="display relative text-[clamp(3.6rem,7.4cqi,7.8rem)] leading-[.9] tracking-[.005em]">
                <span className="flex flex-wrap items-center gap-x-[.3em] gap-y-[.15em]">
                  <span>{texts.hero.title}</span>
                  <span className="relative inline-flex items-end gap-1.5 font-body text-base leading-[1.3] font-semibold tracking-normal normal-case">
                    <SparkleIcon className="absolute -top-[18px] left-11" />
                    <HeroCabinArt />
                    {texts.hero.badge && <span className="max-w-[19ch] rounded-sm bg-card px-3 py-2 text-[.78rem] text-on-light">{texts.hero.badge}</span>}
                  </span>
                </span>
                {texts.hero.highlight && <span className="block text-accent">{texts.hero.highlight}</span>}
              </h1>
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <p className="max-w-[40ch] text-pretty text-on-dark-muted">{texts.hero.description}</p>
                <a href="#reserva" className="btn btn-cta min-h-14 gap-3.5 py-1.5 pr-1.5 pl-[26px] font-bold whitespace-nowrap">
                  Reservar por WhatsApp
                  <span className="grid size-11 place-items-center rounded-full bg-card text-on-light">
                    <ArrowRightIcon />
                  </span>
                </a>
              </div>
              <div className="relative grid grid-cols-4 gap-3">
                {["hero-thumb-1", "hero-thumb-2", "hero-thumb-3", "hero-thumb-4"].map((id) => (
                  <div key={id} className="relative aspect-[1/1.1] overflow-hidden rounded-md bg-bg">
                    <PhotoSlot id={id} src={photos[id]} sizes="(min-width: 1088px) 200px, 25vw" eager />
                  </div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[clamp(320px,46cqi,700px)] min-w-0 flex-[1_1_480px] overflow-hidden rounded-lg bg-surface">
              <PhotoSlot id="hero-main" src={photos["hero-main"]} sizes="(min-width: 1392px) 720px, (min-width: 1088px) 50vw, 100vw" preload />
            </div>
          </section>

          <BookingWidget />

          <div aria-hidden="true" className="gutter-1360">
            <PawTrail variant="a" className="ml-auto" />
          </div>

          {/* Experiencias */}
          <section id="experiencias" className="gutter-1360 pt-[calc(32px_+_2cqi)] pb-[calc(48px_+_3cqi)]">
            <SectionHead kicker="Lo que te espera">
              <h2 className="display-xl text-balance">
                <span>Alta montaña</span> <span className="text-accent">frente al nevado</span>
              </h2>
            </SectionHead>
            <div role="list" className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1">
              {EXPERIENCES.map((e) => (
                <article key={e.id} role="listitem" className="relative aspect-[3/4.1] flex-[0_0_max(230px,calc((100%_-_64px)/5))] snap-start overflow-hidden rounded-lg bg-surface">
                  <PhotoSlot id={`exp-${e.id}`} src={photos[`exp-${e.id}`]} sizes="(min-width: 1392px) 270px, 240px" />
                  <h3 className="pointer-events-none absolute top-3 left-3 max-w-[calc(100%-24px)] rounded-sm bg-card px-3 py-2 text-[.84rem] leading-[1.3] font-bold text-on-light">{e.label}</h3>
                </article>
              ))}
            </div>
          </section>

          {/* Cabañas */}
          <section id="cabanas" className={`${section} relative`}>
            <DottedPath d="M-10 150 C 60 140, 30 60, 110 60 S 190 20, 170 0" width={200} height={160} className="-top-10 left-0 stroke-on-dark/40" />
            <SectionHead kicker="Elige la tuya">
              <h2 className="display-xl">
                <span>Nuestras cabañas</span> <span className="text-accent">tipo chalet</span>
              </h2>
            </SectionHead>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
              {cabins.map((c) => {
                return (
                  <article key={c.id} className="flex flex-col gap-4 rounded-lg bg-card p-3 text-on-light transition duration-250 hover:-translate-y-1.5 hover:shadow-card">
                    <div className="relative aspect-4/3 overflow-hidden rounded-md bg-card-muted">
                      <PhotoSlot src={c.photos[0]} alt={c.full} placeholder={`Foto real: ${c.full.toLowerCase()}`} sizes="(min-width: 1392px) 660px, (min-width: 888px) 50vw, 100vw" />
                      {c.badge && <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-highlight px-3.5 py-[7px] text-[.8rem] font-extrabold text-on-light">{c.badge}</span>}
                    </div>
                    <div className="flex flex-col gap-3 px-2 pb-2">
                      <h3 className="display text-[2.4rem] leading-none">{c.full}</h3>
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
                          <dt className="font-medium">Noche en pareja</dt>
                          <dd className="text-[1.1rem] font-extrabold">{cop(c.couple)}</dd>
                          <dt className="font-medium">Persona adicional</dt>
                          <dd className="font-bold">{cop(c.extra)}</dd>
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
            <a href="#servicios" className="btn btn-surface mt-6 min-h-12 px-[22px] font-bold">
              Todas las cabañas incluyen
              <ArrowDownIcon />
            </a>
          </section>
        </BookingProvider>

        {/* Servicios */}
        <section id="servicios" className={section}>
          <SectionHead kicker="Incluido en tu estadía">
            <h2 className="display-xl">
              <span>Servicios</span> <span className="text-accent">incluidos</span>
            </h2>
          </SectionHead>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,210px),1fr))] gap-3">
            {SERVICES.map((s) => (
              <li key={s.label} className={`flex min-h-[132px] flex-col gap-3 rounded-lg border-2 p-5 ${s.note ? "border-dashed border-highlight bg-transparent" : "border-transparent bg-surface"}`}>
                <span className="grid size-[52px] place-items-center rounded-full border-2 border-accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={s.d} />
                  </svg>
                </span>
                <span className="leading-[1.3] font-bold">{s.label}</span>
                {s.note && <span className="mt-auto self-start rounded-full bg-highlight px-3 py-1 text-[.76rem] font-extrabold text-on-light">{s.note}</span>}
              </li>
            ))}
          </ul>
        </section>

        {/* Horarios */}
        <section aria-labelledby="horarios-title" className={section}>
          <h2 id="horarios-title" className="display mb-6 text-[clamp(2.2rem,4cqi,3.6rem)] leading-[.92]">
            Horarios
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-4">
            {[
              ["Check-in", site.checkIn, <LoginIcon key="i" size={28} />],
              ["Check-out", site.checkOut, <LogoutIcon key="o" size={28} />],
            ].map(([label, value, icon]) => (
              <div key={label as string} className="flex items-center gap-5 rounded-lg bg-card p-7 text-on-light">
                <span aria-hidden="true" className="grid size-16 flex-none place-items-center rounded-full bg-cta text-cta-text">
                  {icon}
                </span>
                <div>
                  <h3 className="text-[.8rem] font-extrabold uppercase tracking-[.1em]">{label}</h3>
                  <p className="display mt-0.5 text-[2.6rem] leading-none normal-case">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div aria-hidden="true" className="gutter-1360 -mt-6 mb-4">
          <PawTrail variant="b" />
        </div>

        {/* Políticas */}
        <section aria-labelledby="pol-title" className={`${section} flex flex-wrap gap-8`}>
          <div className="flex flex-[1_1_320px] flex-col items-start gap-4">
            <p className="kicker">
              <SparkleIcon />
              Antes de venir
            </p>
            <h2 id="pol-title" className="display-xl">
              <span className="block">Reservas</span>
              <span className="block text-accent">y políticas</span>
            </h2>
            <p className="max-w-[32ch] text-on-dark-muted">¿Tienes alguna duda? Escríbenos y con gusto te ayudamos.</p>
            <a href={wa(site.whatsapp)} target="_blank" rel="noopener" className="btn btn-card min-h-12 gap-2 px-[22px] font-bold">
              <WhatsAppIcon />
              Escribir por WhatsApp
            </a>
          </div>
          <PoliciesAccordion policies={site.policies} />
        </section>

        {/* Reseñas */}
        <section aria-labelledby="rev-title" className={section}>
          <div className="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-lg bg-surface p-[calc(32px_+_1.5cqi)]">
            <CondorSilhouette className="absolute top-3.5 right-[6%] h-auto w-[180px] rotate-6 fill-on-dark/14" />
            <div className="relative flex flex-col gap-2.5">
              <p className="kicker">
                <SparkleIcon />
                Opiniones reales
              </p>
              <h2 id="rev-title" className="display text-[clamp(2.4rem,4.6cqi,4.6rem)] leading-[.92]">
                <span>Lo que dicen</span> <span className="text-accent">nuestros huéspedes</span>
              </h2>
            </div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${config.lat},${config.lng}`} target="_blank" rel="noopener" className="btn btn-card relative min-h-14 px-[26px]">
              <StarIcon />
              Ver reseñas en Google
            </a>
          </div>
        </section>

        {/* Ubicación */}
        <section id="ubicacion" className={section}>
          <SectionHead kicker="Así se llega">
            <h2 className="display-xl">
              <span className="block">En Murillo</span>
              <span className="block text-accent">el pueblo más alto del Tolima</span>
            </h2>
          </SectionHead>
          <div className="flex flex-wrap gap-4">
            <div className="relative min-h-[420px] min-w-0 flex-[1.4_1_480px] overflow-hidden rounded-lg bg-surface">
              <iframe
                title={`Mapa de ubicación de ${config.name}`}
                src={`https://maps.google.com/maps?q=${config.lat},${config.lng}&z=16&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 size-full border-0"
              />
            </div>
            <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-5 rounded-lg bg-card p-8 text-on-light">
              <div className="flex items-start gap-3.5">
                <span aria-hidden="true" className="grid size-12 flex-none place-items-center rounded-full bg-cta text-cta-text">
                  <PinIcon size={22} stroke={2} />
                </span>
                <div>
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
              <a href={dirHref()} target="_blank" rel="noopener" className="btn btn-cta mt-auto min-h-[52px] self-start px-6">
                Cómo llegar
                <ArrowRightIcon />
              </a>
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" aria-labelledby="contact-title" className={section}>
          <div className="flex flex-wrap gap-8 rounded-lg bg-card p-3 text-on-light">
            <div className="relative min-h-[260px] min-w-0 flex-[1_1_380px] overflow-hidden rounded-md bg-card-muted">
              <PhotoSlot id="contact" src={photos.contact} sizes="(min-width: 1392px) 620px, (min-width: 888px) 45vw, 100vw" />
            </div>
            <div className="flex min-w-0 flex-[1.2_1_420px] flex-col justify-center gap-6 px-[calc(12px_+_1cqi)] py-[calc(20px_+_1cqi)]">
              <div className="flex flex-col gap-3.5">
                <p className="kicker">
                  <SparkleIcon />
                  Atención familiar
                </p>
                <h2 id="contact-title" className="display text-[clamp(2.6rem,5cqi,5rem)] leading-[.92]">
                  Contacto
                </h2>
                <p className="text-[1.1rem] font-semibold">Será un placer atenderte.</p>
              </div>
            <div className="flex flex-col gap-2.5">
              <a href={wa(site.whatsapp)} target="_blank" rel="noopener" className="btn btn-cta min-h-[60px] text-[1.05rem]">
                <WhatsAppIcon size={20} />
                Escríbenos por WhatsApp
              </a>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
                {site.phones.map((p) => (
                  <a key={p} href={tel(p)} className="btn btn-outline-light min-h-[52px] gap-2 font-bold whitespace-nowrap hover:bg-card-muted">
                    <PhoneIcon size={16} />
                    {p}
                  </a>
                ))}
              </div>
            </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

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
