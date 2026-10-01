"use client";

import { useEffect, useState } from "react";
import { useSite } from "../site-provider";
import { dirHref, tel } from "@/lib/format";
import { Brand } from "../brand";
import { CloseIcon, LogoMark, MenuIcon, PhoneIcon, PinIcon, SparkleIcon } from "../icons";

const SECTIONS = [
  ["cabanas", "Cabañas"],
  ["experiencias", "Experiencias"],
  ["servicios", "Servicios"],
  ["ubicacion", "Ubicación"],
  ["contacto", "Contacto"],
] as const;

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const close = () => setMenuOpen(false);
  const { c } = useSite();
  const phone1 = c.phones[0];

  return (
    <>
      <header className="gutter-1360 flex items-center gap-4 py-4">
        <a href="#top" aria-label={`${c.name}, inicio`} className="flex min-h-11 min-w-0 items-center gap-3 text-on-dark no-underline">
          <Brand circle={50} mark={38} snow wordSize="1.5rem" eyebrowSize=".66rem" />
        </a>
        <nav aria-label="Principal" className="ml-4 hidden gap-0.5 min-[1100px]:flex">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center rounded-full px-3.5 text-[.93rem] font-semibold no-underline hover:bg-surface">
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a href={dirHref()} target="_blank" rel="noopener" className="btn btn-card hidden min-h-11 flex-none gap-2 whitespace-nowrap pr-5 pl-3.5 text-[.9rem] font-bold min-[860px]:inline-flex">
            <PinIcon />
            Cómo llegar
          </a>
          <a href={tel(phone1)} className="btn btn-surface hidden min-h-11 flex-none gap-2 whitespace-nowrap pr-5 pl-3.5 text-[.9rem] font-semibold min-[1320px]:inline-flex">
            <PhoneIcon size={16} />
            {phone1}
          </a>
          <a href={tel(phone1)} aria-label={`Llamar al ${phone1}`} className="btn-icon size-12 bg-surface text-on-dark min-[860px]:hidden">
            <PhoneIcon />
          </a>
          <button type="button" aria-label="Abrir menú" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="btn-icon btn-card size-12 border-0">
            <MenuIcon />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div role="dialog" aria-modal="true" aria-label="Menú" className="fixed inset-0 z-100 flex flex-col gap-8 overflow-auto bg-bg px-6 pt-4 pb-8 text-on-dark">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2.5">
              <LogoMark size={40} snow />
              <span className="display whitespace-nowrap text-[1.5rem] tracking-[.03em]">El Cóndor del Ruiz</span>
            </span>
            <button type="button" aria-label="Cerrar menú" onClick={close} autoFocus className="btn-icon btn-card size-12 border-0">
              <CloseIcon />
            </button>
          </div>
          <nav aria-label="Menú principal" className="flex flex-col">
            {SECTIONS.map(([id, label], i) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={close}
                className={`display flex min-h-16 items-center text-[3.4rem] leading-none no-underline ${i < SECTIONS.length - 1 ? "border-b-2 border-dotted border-on-dark/30" : ""}`}
              >
                {label}
              </a>
            ))}
          </nav>
          <p className="kicker">
            <SparkleIcon />
            {c.tagline}
          </p>
          <div className="mt-auto flex flex-col gap-2.5">
            <a href="#reserva" onClick={close} className="btn btn-card min-h-14">
              Reservar por WhatsApp
            </a>
            <a href={tel(phone1)} className="btn bg-surface min-h-14 font-bold">
              {phone1}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
