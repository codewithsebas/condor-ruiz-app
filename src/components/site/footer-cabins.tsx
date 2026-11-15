// Ilustración del pie de página: las cabañas del Cóndor (tipo A) al anochecer, con pinos entre ellas sobre el prado y,
// a la derecha, el Nevado del Ruiz con su casquete de hielo y la fumarola. Cuatro estándar iguales y, aparte, la
// Premium con su jacuzzi de madera humeando en el deck. Estilo plano y suave: techo de teja terracota en escamas, marco
// oscuro, el gran ventanal triangular encendido con luz cálida, el listón de madera del costado, el balcón con su
// pasamanos claro, un farolito bajo el caballete y, como las reales, la base metálica negra que las levanta del suelo.
// Los colores de las cabañas, los pinos, el volcán y el prado son fijos.
// Un solo SVG: la cabaña y el pino son <symbol> y se repiten con <use>.

// Lienzo de 1900 × 300: las cabañas a la izquierda y el Nevado a la derecha. Cada cabaña mide 180 × 234 y apoya en el
// prado (y = 262). Las cuatro estándar van juntas; la Premium con jacuzzi, un poco aparte, entre pinos. El prado se
// extiende más allá del lienzo (overflow visible) para que no se vea su borde en pantallas anchas.
const CABIN_W = 180;
const CABIN_H = 234;
const CABIN_Y = 262 - (250 / 260) * CABIN_H;
const CABINS = [40, 250, 460, 670];
const PREMIUM = 960;
// Pinos: en las orillas, entre cabañas y un grupo que separa la Premium.
const PINES: { x: number; h: number }[] = [
  { x: 14, h: 130 },
  { x: 236, h: 116 },
  { x: 446, h: 136 },
  { x: 656, h: 118 },
  { x: 876, h: 150 },
  { x: 912, h: 112 },
  { x: 940, h: 128 },
  { x: 1240, h: 146 },
  { x: 1274, h: 108 },
];
// Fumarola del cráter. Con movimiento: bocanadas que salen una tras otra (animate-smoke, globals.css). Con «reducir
// movimiento»: estas bocanadas quietas que suben y se abren hacia la derecha, cada vez más grandes.
const SMOKE = 8; // bocanadas animadas, repartidas a lo largo del ciclo de 9 s
const PUFFS: [number, number, number][] = [
  [1570, 34, 13],
  [1586, 20, 17],
  [1610, 8, 21],
  [1642, 0, 23],
  [1678, -4, 21],
  [1710, 0, 17],
];

// Pasto: tres capas de briznas curvas en el borde del prado (siguen su curva), de atrás (oscuras y bajas) a adelante
// (claras y altas), cada una con degradado de la base a la punta; matas sueltas más abajo y unas florecitas. Posiciones
// y altos pseudoaleatorios pero fijos (iguales en servidor y navegador).
const groundY = (x: number) => 262 - 22 * Math.sin(Math.PI * Math.min(1, Math.max(0, x / 1900)));
const rnd = (i: number) => {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return v - Math.floor(v);
};
const f1 = (n: number) => n.toFixed(1);
// Brizna curva: base ancha, punta fina, inclinada hacia un lado.
const blade = (x: number, y: number, h: number, lean: number, w: number) =>
  `M${f1(x - w)} ${f1(y)}Q${f1(x + lean * 0.3)} ${f1(y - h * 0.55)} ${f1(x + lean)} ${f1(y - h)}Q${f1(x + lean * 0.2 + w * 0.3)} ${f1(y - h * 0.5)} ${f1(x + w)} ${f1(y)}Z`;
const GRASS_LAYERS = [
  { step: 3.2, minH: 6, maxH: 13, w: 1.6, dy: -1, seed: 0 },
  { step: 2.6, minH: 8, maxH: 17, w: 1.5, dy: 1.5, seed: 400 },
  { step: 3.4, minH: 9, maxH: 21, w: 1.4, dy: 4, seed: 900 },
].map(({ step, minH, maxH, w, dy, seed }) => {
  let d = "";
  for (let i = 0; i * step < 2300; i++) {
    const x = -200 + i * step + rnd(seed + i) * step;
    const r = rnd(seed + i + 7);
    // De vez en cuando una mata más alta.
    const h = (minH + r * (maxH - minH)) * (rnd(seed + i + 13) > 0.93 ? 1.5 : 1);
    d += blade(x, groundY(x) + dy, h, (rnd(seed + i + 3) - 0.45) * 9, w);
  }
  return d;
});
const TUFTS = Array.from({ length: 140 }, (_, i) => {
  const x = -150 + rnd(i + 50) * 2200;
  const y = groundY(x) + 12 + rnd(i + 90) * 28;
  return [-3, 0, 3].map((o, k) => blade(x + o, y, 4 + rnd(i * 3 + k) * 5, (o + (rnd(i + k) - 0.5) * 3) * 0.8, 0.9)).join("");
}).join("");
const FLOWERS = Array.from({ length: 36 }, (_, i) => {
  const x = -100 + rnd(i + 300) * 2100;
  return { x, y: groundY(x) + 6 + rnd(i + 310) * 22, c: rnd(i + 320) > 0.5 ? "#f3e7a1" : "#f6f1e6" };
});

export function FooterCabins({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1900 300" preserveAspectRatio="xMidYMax meet" overflow="visible" className={`pointer-events-none block ${className}`}>
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
        {/* Roca del volcán: la ladera izquierda con luz y la derecha en sombra, más oscuras hacia la base */}
        <linearGradient id="ft-roca-luz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a08a76" />
          <stop offset="1" stopColor="#7c6654" />
        </linearGradient>
        <linearGradient id="ft-roca-sombra" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a6555" />
          <stop offset="1" stopColor="#584739" />
        </linearGradient>
        <linearGradient id="ft-agua" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fe0e2" />
          <stop offset="1" stopColor="#3aa7b4" />
        </linearGradient>
        {/* Briznas: oscuras en la base, claras en la punta (una por capa) */}
        <linearGradient id="ft-pasto-0" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#3c4a32" />
          <stop offset="1" stopColor="#5d7049" />
        </linearGradient>
        <linearGradient id="ft-pasto-1" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#44543a" />
          <stop offset="1" stopColor="#7a8f5f" />
        </linearGradient>
        <linearGradient id="ft-pasto-2" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#4d5e40" />
          <stop offset="1" stopColor="#9bb07a" />
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

      {/* Cordillera lejana detrás del volcán */}
      <path d="M1180 272 1250 206 1300 222 1360 176 1420 200 1470 170 1760 190 1820 160 1900 186 4000 186V272z" fill="#c4ae8d" opacity=".55" />

      {/* Nevado del Ruiz: volcán ancho de cima casi plana, una ladera con luz y otra en sombra, quebradas, el casquete de
          hielo con su borde irregular y las lenguas de los glaciares, el cráter y la fumarola. */}
      <g>
        <path d="M1250 272C1330 236 1400 160 1462 90L1500 52Q1530 46 1572 44V272z" fill="url(#ft-roca-luz)" />
        <path d="M1572 44Q1610 44 1640 50L1676 84C1740 150 1810 220 1900 252V272H1572z" fill="url(#ft-roca-sombra)" />
        {/* Quebradas */}
        <path
          d="M1520 140 1490 200 1470 250M1556 150 1546 210 1550 262M1610 150 1630 214 1660 258M1650 120 1700 190 1760 240"
          stroke="#4e3f33"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity=".45"
        />
        {/* Casquete de hielo */}
        <path
          d="M1462 90 1500 52Q1570 36 1640 50L1676 84 1668 100 1654 92 1644 122 1630 100 1618 144 1604 110 1590 134 1576 104 1562 152 1548 112 1532 136 1518 106 1504 128 1490 104 1476 118z"
          fill="#fbf9f4"
        />
        <path d="M1572 40Q1610 40 1640 50L1676 84 1668 100 1654 92 1644 122 1630 100 1618 144 1604 110 1590 134 1576 104z" fill="#dde3ec" />
        {/* Lenguas de los glaciares */}
        <path d="M1562 152 1558 176M1618 144 1624 170M1532 136 1524 158M1644 122 1654 142" stroke="#fbf9f4" strokeWidth="6" strokeLinecap="round" />
        {/* Cráter */}
        <ellipse cx="1572" cy="44" rx="26" ry="5" fill="#c3cad5" />
        {/* Fumarola animada */}
        <g className="motion-reduce:hidden">
          {Array.from({ length: SMOKE }, (_, i) => (
            <g
              key={i}
              className="[transform-origin:center] animate-smoke [transform-box:fill-box]"
              style={{ animationDelay: `${(-9 * i) / SMOKE}s`, opacity: 0 }}
            >
              <circle cx="1572" cy={30 - (i % 3) * 3} r={15 + (i % 2) * 3} fill="#f7f3ec" />
              <circle cx="1576" cy={34 - (i % 3) * 3} r={10 + (i % 2) * 2} fill="#e3ddd2" opacity=".55" />
            </g>
          ))}
        </g>
        {/* Fumarola quieta */}
        <g opacity=".92" className="hidden motion-reduce:inline">
          {PUFFS.map(([cx, cy, r]) => (
            <circle key={cx} cx={cx} cy={cy} r={r} fill="#f7f3ec" />
          ))}
          {PUFFS.map(([cx, cy, r]) => (
            <circle key={cx} cx={cx + r * 0.25} cy={cy + r * 0.3} r={r * 0.7} fill="#e3ddd2" opacity=".55" />
          ))}
        </g>
        {/* Estribaciones verdes delante del volcán */}
        <path d="M1200 272C1290 244 1370 232 1450 238S1620 216 1720 230 1860 244 1900 240 4000 240 4000 240V272z" fill="#6f7d5c" />
        <path d="M1200 272C1300 252 1380 246 1460 250S1640 236 1740 246 1880 254 4000 254V272z" fill="#5b6b4d" />
      </g>

      {/* Prado verde (el mismo de la franja final del pie); se extiende fuera del lienzo */}
      <path d="M-3000 300V262C0 262 600 236 950 240S1900 258 4900 262V300z" fill="#5b6b4d" />
      {/* Franja más clara justo bajo el borde y el pasto */}
      <path d="M-3000 268V262C0 262 600 236 950 240S1900 258 4900 262V268C1900 264 1200 248 950 246S0 268 -3000 268z" fill="#6a7c56" opacity=".6" />
      <path d={TUFTS} fill="#46563b" opacity=".85" />
      {FLOWERS.map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r="1.6" fill={f.c} opacity=".9" />
      ))}
      <path d="M0 268C400 250 700 246 950 248S1600 262 1900 264" fill="none" className="stroke-card/15" strokeWidth="2" />

      {/* Briznas de pasto en el borde del prado: detrás de pinos y cabañas, que apoyan delante */}
      {GRASS_LAYERS.map((d, i) => (
        <path key={i} d={d} fill={`url(#ft-pasto-${i})`} />
      ))}

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
