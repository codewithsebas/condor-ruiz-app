import { Marca } from "@/components/brand/marca";

// Marca de Cabañas El Cóndor del Ruiz con el arte original (components/brand/marca.tsx).
//
// Brand: la versión del sitio, en horizontal (el símbolo y el nombre entre líneas), del color del texto.
// Logo / BrandName / PanelBrand: la versión del panel, con colores propios (sello nogal y crema), porque el panel
// tiene su propio tema y no usa la paleta del sitio.

// Símbolo + nombre (sitio público). `circle` es el alto del nombre; los demás parámetros se aceptan por compatibilidad.
export function Brand({ circle = 46 }: { circle?: number; mark?: number; snow?: boolean; wordSize?: string; eyebrowSize?: string }) {
  return (
    <>
      {/* En pantallas angostas se encoge con el ancho para no chocar con los botones del encabezado. */}
      <Marca parte="simbolo" height={`min(${Math.round(circle * 0.85)}px, 7.5vw)`} />
      <Marca parte="nombre" height={`min(${circle}px, 9vw)`} />
    </>
  );
}

// Sello del panel: el símbolo crema sobre nogal, en un círculo. Decorativo: junto a él siempre va el nombre, o
// el enlace que lo envuelve lo nombra. `eager` se acepta por compatibilidad.
export function Logo({ size, className = "" }: { size: number; eager?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={`grid flex-none place-items-center rounded-full bg-[#5b3a21] ${className}`} style={{ width: size, height: size }}>
      <Marca parte="simbolo" className="bg-[#fbf6ec]" style={{ width: "80%", height: "auto", aspectRatio: "800 / 338" }} />
    </span>
  );
}

// «Cabañas / EL CÓNDOR DEL RUIZ» entre sus líneas (panel). `eyebrow` y `eyebrowSize` se aceptan por compatibilidad.
const EYEBROW = "Cabañas";
export function BrandName({
  wordSize,
  className = "",
}: {
  wordSize: string;
  eyebrowSize?: string;
  eyebrow?: string;
  className?: string;
}) {
  // El nombre con sus líneas, del alto de dos renglones de `wordSize` y del color del texto.
  return (
    <span className={`flex min-w-0 flex-col ${className}`}>
      <Marca parte="nombre" height={`calc(${wordSize} * 2.2)`} />
    </span>
  );
}

// Sello + nombre (panel).
export function PanelBrand({
  size = 46,
  wordSize = "1.4rem",
  eyebrowSize = ".5em",
  eyebrow = EYEBROW,
}: {
  size?: number;
  wordSize?: string;
  eyebrowSize?: string;
  eyebrow?: string;
  eager?: boolean;
}) {
  return (
    <>
      <Logo size={size} />
      <BrandName wordSize={wordSize} eyebrowSize={eyebrowSize} eyebrow={eyebrow} />
    </>
  );
}
