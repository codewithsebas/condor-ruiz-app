// Ilustración del pie de página: las cuatro cabañas del Cóndor (tipo A, todas iguales) al anochecer, con pinos entre
// ellas sobre el prado. Estilo plano y suave: techo de teja terracota en escamas, marco oscuro, el gran ventanal
// triangular encendido con luz cálida, el listón de madera del costado, el balcón con su pasamanos claro, un farolito
// bajo el caballete y, como las reales, la base metálica que las levanta del suelo. Los colores de las cabañas y los pinos son fijos (los reales); el prado sigue la paleta del sitio.
// Un solo SVG: la cabaña y el pino son <symbol> y se repiten con <use>.

// Cabañas: 200 de ancho, 60 entre una y otra, centradas en el lienzo de 1200.
const CABINS = [110, 370, 630, 890];
// Pinos: en las orillas y entre cabañas, de distintos altos.
const PINES: { x: number; h: number }[] = [
  { x: 28, h: 150 },
  { x: 66, h: 110 },
  { x: 318, h: 130 },
  { x: 578, h: 150 },
  { x: 838, h: 125 },
  { x: 1104, h: 115 },
  { x: 1140, h: 160 },
];

export function FooterCabins({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax meet" className={`pointer-events-none block ${className}`}>
      <defs>
        {/* Tejas en escamas */}
        <pattern id="ft-tejas" width="14" height="11" patternUnits="userSpaceOnUse">
          <rect width="14" height="11" fill="#c8623a" />
          <path d="M0 11a7 7 0 0 1 14 0" fill="#dc7a4c" />
          <path d="M0 11a7 7 0 0 1 14 0" fill="none" stroke="#9c4524" strokeWidth="1.2" />
          <path d="M-7 5.5a7 7 0 0 1 14 0M7 5.5a7 7 0 0 1 14 0" fill="#d36f43" stroke="#9c4524" strokeWidth="1.2" />
        </pattern>
        {/* Interior encendido: ámbar arriba que se vuelve miel abajo */}
        <linearGradient id="ft-interior" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffcf7d" />
          <stop offset="1" stopColor="#f39a45" />
        </linearGradient>
        <radialGradient id="ft-halo" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffd27f" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffd27f" stopOpacity="0" />
        </radialGradient>

        <symbol id="ft-cabana" viewBox="0 0 200 260" overflow="visible">
          {/* Resplandor de la luz sobre el prado */}
          <ellipse cx="100" cy="246" rx="120" ry="30" fill="url(#ft-halo)" />
          {/* Techo: la A completa en teja, con el caballete redondeado */}
          <path d="M100 6 6 204h188z" fill="url(#ft-tejas)" stroke="#8a3a1c" strokeWidth="4" strokeLinejoin="round" />
          {/* Brillo del faldón izquierdo */}
          <path d="M100 12 14 198h14L100 34z" fill="#fff" opacity=".12" />
          {/* Marco oscuro */}
          <path d="M100 40 42 204h116z" fill="#2b2420" stroke="#2b2420" strokeWidth="4" strokeLinejoin="round" />
          {/* Ventanal encendido */}
          <path d="M100 56 58 204h84z" fill="url(#ft-interior)" />
          {/* Listón de madera del costado derecho */}
          <path d="M104 52 142 168h-9L101 64z" fill="#9b6334" />
          {/* Reflejo en el vidrio */}
          <path d="M100 56 82 108l8 4 12-38z" fill="#fff" opacity=".35" />
          {/* Divisiones del vidrio y puerta */}
          <path d="M71 158h58M100 56v102M86 166v38M114 166v38M86 166h28" stroke="#2b2420" strokeWidth="3.5" strokeLinecap="round" />
          {/* Farolito bajo el caballete */}
          <path d="M100 40v8" stroke="#2b2420" strokeWidth="2" />
          <circle cx="100" cy="52" r="4.5" fill="#fff1c9" />
          <circle cx="100" cy="52" r="10" fill="#ffe7a8" opacity=".35" />
          {/* Balcón: pasamanos claro, barrotes y piso de madera */}
          <rect x="20" y="168" width="160" height="7" rx="3.5" fill="#f1e6cf" />
          {[28, 46, 64, 82, 118, 136, 154, 172].map((x) => (
            <rect key={x} x={x - 2} y="174" width="4" height="26" rx="1" fill="#2b2420" />
          ))}
          {/* Base metálica negra: viga bajo el piso, columnas de acero con riostras en cruz y sus zapatas */}
          <rect x="16" y="205" width="168" height="6" fill="#121316" />
          <path d="M30 211 76 246M76 211 30 246M124 211 170 246M170 211 124 246" stroke="#1c1d21" strokeWidth="2.5" />
          {[30, 76, 124, 170].map((x) => (
            <g key={x}>
              <rect x={x - 4} y="209" width="8" height="38" fill="#16171a" />
              <rect x={x - 4} y="209" width="3" height="38" fill="#2e3035" />
              <rect x={x - 8} y="246" width="16" height="6" rx="1.5" fill="#26272b" />
            </g>
          ))}
          <rect x="12" y="198" width="176" height="9" rx="4.5" fill="#7a5233" />
          <rect x="12" y="198" width="176" height="3" rx="1.5" fill="#9b6c46" />
        </symbol>

        <symbol id="ft-pino" viewBox="0 0 60 100" overflow="visible" preserveAspectRatio="none">
          <rect x="27" y="82" width="6" height="18" rx="2" fill="#5a3b25" />
          <path d="M30 0 52 34H40l16 26H43l15 26H2l15-26H4l16-26H8z" fill="#3e5a40" />
          <path d="M30 0 8 34h12L4 60h13L2 86h28z" fill="#4c6d4c" />
        </symbol>
      </defs>

      {/* Prado: una loma suave que sigue la paleta del sitio */}
      <path d="M0 300V262q300-26 600-20t600 18v40z" className="fill-night" />
      <path d="M0 268q300-24 600-18t600 16" fill="none" className="stroke-card/15" strokeWidth="2" />

      {PINES.map((p) => (
        <use key={p.x} href="#ft-pino" x={p.x - p.h * 0.3} y={268 - p.h} width={p.h * 0.6} height={p.h} />
      ))}
      {CABINS.map((x) => (
        <use key={x} href="#ft-cabana" x={x} y="12" width="200" height="260" />
      ))}
    </svg>
  );
}
