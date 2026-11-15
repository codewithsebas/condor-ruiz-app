// Ilustración del pie de página: las cabañas del Cóndor (tipo A) al anochecer, con pinos entre ellas sobre el prado y,
// a la derecha, el Nevado del Ruiz con su casquete de hielo y la fumarola. Cuatro estándar iguales y la Premium, que
// tiene además su jacuzzi de madera humeando en el deck. Estilo plano y suave: techo de teja terracota en escamas, marco oscuro, el gran ventanal
// triangular encendido con luz cálida, el listón de madera del costado, el balcón con su pasamanos claro, un farolito
// bajo el caballete y, como las reales, la base metálica que las levanta del suelo. Los colores de las cabañas y los pinos son fijos (los reales); el prado sigue la paleta del sitio.
// Un solo SVG: la cabaña y el pino son <symbol> y se repiten con <use>.

// Lienzo de 1700 × 300: las cabañas a la izquierda y el Nevado a la derecha. Cada cabaña mide 180 × 234 y apoya en el
// prado (y = 262). La última es la Premium con jacuzzi.
const CABIN_W = 180;
const CABIN_H = 234;
const CABIN_Y = 262 - (250 / 260) * CABIN_H;
const CABINS = [40, 260, 480, 700];
const PREMIUM = 920;
// Pinos: en las orillas y entre cabañas, de distintos altos.
const PINES: { x: number; h: number }[] = [
  { x: 14, h: 130 },
  { x: 240, h: 120 },
  { x: 460, h: 140 },
  { x: 680, h: 118 },
  { x: 900, h: 136 },
  { x: 1186, h: 150 },
  { x: 1222, h: 112 },
];
// Fumarola del cráter: bocanadas que suben y se abren hacia la derecha.
const PUFFS: [number, number, number][] = [
  [1440, 48, 13],
  [1452, 34, 17],
  [1472, 22, 19],
  [1500, 14, 20],
  [1530, 12, 18],
  [1556, 16, 14],
];

export function FooterCabins({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1700 300" preserveAspectRatio="xMidYMax meet" className={`pointer-events-none block ${className}`}>
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
        <linearGradient id="ft-roca" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8b7663" />
          <stop offset=".55" stopColor="#7a6553" />
          <stop offset=".56" stopColor="#5f4d40" />
          <stop offset="1" stopColor="#544438" />
        </linearGradient>
        <linearGradient id="ft-agua" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fe0e2" />
          <stop offset="1" stopColor="#3aa7b4" />
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

      {/* Nevado del Ruiz: volcán ancho de cima casi plana, una ladera en sombra, el casquete de hielo con su borde
          irregular y las lenguas de los glaciares, y la fumarola saliendo del cráter. */}
      <g>
        <path d="M1170 272C1240 232 1300 160 1350 92L1378 62Q1440 46 1500 60L1528 88C1580 150 1640 216 1700 250V272z" fill="url(#ft-roca)" />
        {/* Casquete de hielo con las lenguas de los glaciares */}
        <path
          d="M1350 92 1378 62Q1440 46 1500 60L1528 88 1520 104 1508 96 1498 122 1486 102 1474 140 1462 108 1450 128 1438 104 1426 146 1414 110 1402 128 1390 104 1378 124 1366 104 1356 112z"
          fill="#f8f5ee"
        />
        <path d="M1452 52Q1478 54 1500 60L1528 88 1520 104 1508 96 1498 122 1486 102 1474 140 1462 108z" fill="#d9dfe8" />
        <path d="M1426 146 1420 170M1474 140 1480 162M1378 124 1370 142" stroke="#f8f5ee" strokeWidth="6" strokeLinecap="round" />
        {/* Cráter */}
        <path d="M1420 58q20-6 40 0" stroke="#b9c2cf" strokeWidth="3" strokeLinecap="round" fill="none" />
        {PUFFS.map(([cx, cy, r]) => (
          <circle key={cx} cx={cx} cy={cy} r={r} fill="#f6f2ea" opacity=".85" />
        ))}
        {/* Estribaciones delante del volcán */}
        <path d="M1110 272C1180 246 1250 230 1320 236S1460 214 1540 228 1660 240 1700 236V272z" fill="#6c7a5a" />
        <path d="M1110 272C1180 252 1260 246 1330 250S1480 236 1560 246 1660 254 1700 252V272z" fill="#5a6a4c" />
      </g>

      {/* Prado: una loma suave que sigue la paleta del sitio */}
      <path d="M0 300V262q425-26 850-20t850 18v40z" className="fill-night" />
      <path d="M0 268q425-24 850-18t850 16" fill="none" className="stroke-card/15" strokeWidth="2" />

      {PINES.map((p) => (
        <use key={p.x} href="#ft-pino" x={p.x - p.h * 0.3} y={268 - p.h} width={p.h * 0.6} height={p.h} />
      ))}
      {CABINS.map((x) => (
        <use key={x} href="#ft-cabana" x={x} y={CABIN_Y} width={CABIN_W} height={CABIN_H} />
      ))}

      {/* Premium: la misma cabaña y, a su derecha, el jacuzzi de madera sobre su propio deck con base negra */}
      <use href="#ft-cabana" x={PREMIUM} y={CABIN_Y} width={CABIN_W} height={CABIN_H} />
      <g transform={`translate(${PREMIUM + CABIN_W - 14} 0)`}>
        <ellipse cx="44" cy="262" rx="58" ry="12" fill="url(#ft-halo)" />
        <rect x="2" y="226" width="84" height="7" rx="3.5" fill="#7a5233" />
        <rect x="2" y="226" width="84" height="2.5" rx="1.2" fill="#9b6c46" />
        {[12, 76].map((x) => (
          <rect key={x} x={x - 3.5} y="232" width="7" height="30" fill="#16171a" />
        ))}
        <path d="M12 236 76 260M76 236 12 260" stroke="#1c1d21" strokeWidth="2" />
        {/* Tina de madera con sus aros */}
        <path d="M10 196h68l-4 30H14z" fill="#9b6334" />
        <path d="M22 196v30M34 196v30M46 196v30M58 196v30M70 196v30" stroke="#7a4b26" strokeWidth="1.5" />
        <path d="M11 203h66M13 218h62" stroke="#2b2420" strokeWidth="2.5" />
        <ellipse cx="44" cy="196" rx="36" ry="8" fill="#7a4b26" />
        <ellipse cx="44" cy="196" rx="31" ry="5.5" fill="url(#ft-agua)" />
        <path d="M30 195q6-2 12 0t12 0" stroke="#e6fbfb" strokeWidth="1.5" fill="none" opacity=".8" />
        {/* Vapor */}
        <path
          d="M30 186q-6-8 0-16t0-16M46 184q-6-9 0-18t0-18M60 186q-6-8 0-16t0-14"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity=".55"
        />
      </g>
    </svg>
  );
}
