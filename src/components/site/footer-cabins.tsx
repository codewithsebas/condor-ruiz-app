// Las cabañas del Cóndor (tipo A) dibujadas para el pie de página, vistas de tres cuartos como en la foto: el faldón de
// teja color terracota que se pierde hacia atrás, el marco negro del frente, el gran ventanal triangular que refleja el
// cielo, el listón de madera del costado y el balcón con su pasamanos claro. Son cuatro iguales, en fila sobre el prado.
// Los colores son los de las cabañas reales (no los de la paleta del sitio); el prado sí sigue la paleta. Un solo SVG con
// la cabaña como <symbol> y cuatro <use>: los degradados y las tejas se declaran una vez.

type P = [number, number];
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const pt = ([x, y]: P) => `${x.toFixed(1)} ${y.toFixed(1)}`;

// Faldón izquierdo: del caballete (frente y fondo) al alero (frente y fondo).
const RIDGE_F: P = [150, 22];
const RIDGE_B: P = [96, 8];
const EAVE_F: P = [70, 222];
const EAVE_B: P = [6, 204];
// Frente: el triángulo del marco.
const APEX: P = [150, 22];
const BASE_L: P = [70, 222];
const BASE_R: P = [230, 222];

const ROOF = `M${pt(RIDGE_F)}L${pt(RIDGE_B)}L${pt(EAVE_B)}L${pt(EAVE_F)}Z`;
// Canales de teja: bajan del caballete al alero.
const CHANNELS = Array.from({ length: 13 }, (_, i) => {
  const t = (i + 0.5) / 13;
  return `M${pt(lerp(RIDGE_F, RIDGE_B, t))}L${pt(lerp(EAVE_F, EAVE_B, t))}`;
}).join("");
// Hiladas: de frente a fondo, cada vez más abajo.
const COURSES = Array.from({ length: 17 }, (_, i) => {
  const s = (i + 1) / 18;
  return `M${pt(lerp(RIDGE_F, EAVE_F, s))}L${pt(lerp(RIDGE_B, EAVE_B, s))}`;
}).join("");

const CABINS = [0, 1, 2, 3];

export function FooterCabins({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1080 250" preserveAspectRatio="xMidYMax meet" className={`pointer-events-none block ${className}`}>
      <defs>
        <linearGradient id="ft-teja" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9784a" />
          <stop offset="1" stopColor="#b2552f" />
        </linearGradient>
        <linearGradient id="ft-vidrio" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1222" />
          <stop offset=".6" stopColor="#16264a" />
          <stop offset="1" stopColor="#2c4573" />
        </linearGradient>
        <linearGradient id="ft-brillo" x1="0" y1="0" x2="1" y2=".6">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ft-luz" cx=".5" cy="1" r=".9">
          <stop offset="0" stopColor="#ffd08a" />
          <stop offset=".6" stopColor="#f2a24e" stopOpacity=".55" />
          <stop offset="1" stopColor="#f2a24e" stopOpacity="0" />
        </radialGradient>
        <clipPath id="ft-techo">
          <path d={ROOF} />
        </clipPath>
        <clipPath id="ft-ventanal">
          <path d="M150 46 96 214h108z" />
        </clipPath>

        <symbol id="ft-cabana" viewBox="0 0 240 240" overflow="visible">
          {/* Sombra en el prado */}
          <ellipse cx="128" cy="232" rx="122" ry="7" fill="#000" opacity=".25" />

          {/* Faldón de teja que se pierde hacia el fondo */}
          <path d={ROOF} fill="url(#ft-teja)" />
          <g clipPath="url(#ft-techo)">
            <path d={CHANNELS} stroke="#f0a17a" strokeWidth="5" strokeLinecap="round" opacity=".45" />
            <path d={CHANNELS} stroke="#8d3a1b" strokeWidth="1.4" transform="translate(3 1)" opacity=".8" />
            <path d={COURSES} stroke="#7a2f14" strokeWidth="2.2" opacity=".75" />
            <path d={COURSES} stroke="#f3ad86" strokeWidth="1" transform="translate(0 2.4)" opacity=".5" />
            {/* Sombra junto al frente */}
            <path d={`M${pt(RIDGE_F)}L${pt(EAVE_F)}l-18 -4L${pt(lerp(RIDGE_F, RIDGE_B, 0.18))}Z`} fill="#000" opacity=".18" />
          </g>
          {/* Caballete y alero */}
          <path d={`M${pt(RIDGE_F)}L${pt(RIDGE_B)}`} stroke="#7a2f14" strokeWidth="3" strokeLinecap="round" />
          <path d={`M${pt(EAVE_B)}L${pt(EAVE_F)}`} stroke="#5d2410" strokeWidth="3" strokeLinecap="round" />

          {/* Marco negro del frente, con el borde de la teja asomando */}
          <path d={`M${pt(APEX)}L${pt(BASE_L)}L${pt(BASE_R)}Z`} fill="#121316" />
          <path d={`M${pt(APEX)}L${pt(BASE_L)}`} stroke="#c9653b" strokeWidth="2.5" strokeLinecap="round" />
          {/* Listón de madera del costado derecho */}
          <path d="M156 42 218 222h-14L154 60z" fill="#9a6235" />
          <path d="M162 70 204 192M166 64 211 196" stroke="#6e4220" strokeWidth=".8" opacity=".7" />

          {/* Ventanal */}
          <path d="M150 46 96 214h108z" fill="url(#ft-vidrio)" />
          <g clipPath="url(#ft-ventanal)">
            {/* Reflejo del cielo y de una nube abajo */}
            <path d="M96 214 150 46l14 42-46 126z" fill="url(#ft-brillo)" />
            <path d="M98 214c6-14 16-20 28-16 6-10 20-12 28-2 10-4 22 0 26 12z" fill="#c9d6ea" opacity=".35" />
            {/* Puerta con la luz de adentro */}
            <rect x="130" y="150" width="40" height="64" fill="url(#ft-luz)" />
          </g>
          {/* Divisiones del vidrio */}
          <path d="M110 150h80M130 150v64M170 150v64M150 46v104" stroke="#0a0b0d" strokeWidth="2.4" />
          {/* Tornillos del marco */}
          {[0.2, 0.36, 0.52, 0.68, 0.84].map((t) => (
            <circle key={t} cx={150 + 72 * t} cy={30 + 186 * t} r="1.4" fill="#aab3bd" />
          ))}

          {/* Balcón: plataforma, barrotes y pasamanos claro */}
          <path d="M50 222h196l-6 8H56z" fill="#2b2622" />
          {[58, 80, 102, 124, 176, 198, 220, 240].map((x) => (
            <rect key={x} x={x - 1.8} y="196" width="3.6" height="27" fill="#16171a" />
          ))}
          <path d="M52 191h194l-2 7H54z" fill="#ede3cd" />
          <path d="M54 198h190" stroke="#b7a98c" strokeWidth="1.5" />
        </symbol>
      </defs>

      {/* Prado bajo las cabañas: sigue la paleta del sitio. */}
      <path d="M0 250V238q270-16 540-12t540 10v14z" className="fill-night" />

      {CABINS.map((i) => (
        <use key={i} href="#ft-cabana" x={28 + i * 262} y="8" width="240" height="240" />
      ))}
    </svg>
  );
}
