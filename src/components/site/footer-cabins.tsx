// Las cabañas del Cóndor (tipo A) dibujadas para el pie de página: techo de teja color terracota, marco negro, el gran
// ventanal triangular que refleja el cielo, el listón de madera del costado y la baranda del balcón con su pasamanos
// claro. Son cuatro iguales, en fila sobre el prado. Los colores son los de las cabañas reales (no los de la paleta del
// sitio); el prado y la noche sí siguen la paleta. Un solo SVG con la cabaña como <symbol> y cuatro <use>: así los
// degradados y el patrón de las tejas se declaran una vez.

const CABINS = [0, 1, 2, 3];

export function FooterCabins({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1000 250" preserveAspectRatio="xMidYMax meet" className={`pointer-events-none block ${className}`}>
      <defs>
        {/* Tejas: hileras curvas con sombra abajo y brillo arriba, a lo largo de cada faldón. */}
        <pattern id="ft-teja-izq" width="12" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
          <rect width="12" height="9" fill="#c9653b" />
          <rect width="12" height="2.2" fill="#de8256" />
          <path d="M0 8.4q3 -3.4 6 0t6 0" fill="none" stroke="#7e3418" strokeWidth="1.3" />
          <path d="M3 1.5v5.5M9 1.5v5.5" stroke="#b35530" strokeWidth=".8" opacity=".7" />
        </pattern>
        <pattern id="ft-teja-der" width="12" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
          <rect width="12" height="9" fill="#b85a33" />
          <rect width="12" height="2.2" fill="#cf7148" />
          <path d="M0 8.4q3 -3.4 6 0t6 0" fill="none" stroke="#6f2d14" strokeWidth="1.3" />
          <path d="M3 1.5v5.5M9 1.5v5.5" stroke="#a24b29" strokeWidth=".8" opacity=".7" />
        </pattern>
        {/* El ventanal: azul profundo que refleja el cielo y una nube clara abajo. */}
        <linearGradient id="ft-vidrio" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1526" />
          <stop offset=".55" stopColor="#1a2b4a" />
          <stop offset="1" stopColor="#3b5378" />
        </linearGradient>
        <linearGradient id="ft-reflejo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* Luz cálida que se ve por la puerta de vidrio. */}
        <radialGradient id="ft-luz" cx=".5" cy=".85" r=".7">
          <stop offset="0" stopColor="#ffc56b" stopOpacity=".95" />
          <stop offset="1" stopColor="#ff9d3b" stopOpacity="0" />
        </radialGradient>

        <symbol id="ft-cabana" viewBox="0 0 200 230" overflow="visible">
          {/* Sombra en el prado */}
          <ellipse cx="100" cy="226" rx="104" ry="7" fill="#000" opacity=".28" />
          {/* Faldones de teja, del caballete al piso */}
          <path d="M100 4 4 222h46L100 34z" fill="url(#ft-teja-izq)" />
          <path d="M100 4 196 222h-46L100 34z" fill="url(#ft-teja-der)" />
          {/* Remate del borde de las tejas */}
          <path d="M100 4 4 222M100 4l96 218" stroke="#8f3c1c" strokeWidth="3" strokeLinecap="round" />
          {/* Marco negro del frente */}
          <path d="M100 26 46 222h108z" fill="#141518" />
          {/* Listón de madera del costado derecho */}
          <path d="M108 50l38 172h-9L104 66z" fill="#8a5a2f" />
          <path d="M108 50l38 172" stroke="#5e3a1c" strokeWidth="1" />
          {/* Ventanal */}
          <path d="M100 44 60 214h80z" fill="url(#ft-vidrio)" />
          <path d="M100 44 60 214h34L100 64z" fill="url(#ft-reflejo)" />
          {/* Puerta con la luz de adentro */}
          <rect x="86" y="160" width="28" height="54" fill="url(#ft-luz)" />
          {/* Divisiones del vidrio */}
          <path d="M74 152h52M86 160v54M114 160v54M86 160h28" stroke="#0a0b0d" strokeWidth="2.2" />
          {/* Tornillos del marco */}
          {[0.22, 0.4, 0.58, 0.76].map((t) => (
            <circle key={t} cx={100 + 44 * t} cy={30 + 186 * t} r="1.3" fill="#9aa3ad" />
          ))}
          {/* Balcón: pasamanos claro, barrotes negros y la plataforma */}
          <rect x="14" y="184" width="172" height="7" rx="1.5" fill="#e9dfc9" />
          <rect x="14" y="190" width="172" height="2" fill="#b9ac92" />
          {[18, 40, 62, 84, 116, 138, 160, 182].map((x) => (
            <rect key={x} x={x - 1.6} y="191" width="3.2" height="31" fill="#17181b" />
          ))}
          <rect x="10" y="218" width="180" height="6" rx="1" fill="#2a2420" />
        </symbol>
      </defs>

      {/* Prado bajo las cabañas: sigue la paleta del sitio. */}
      <path d="M0 250V236q250-14 500-10t500 8v16z" className="fill-night" />

      {CABINS.map((i) => (
        <use key={i} href="#ft-cabana" x={62 + i * 225} y="10" width="200" height="230" />
      ))}
    </svg>
  );
}
