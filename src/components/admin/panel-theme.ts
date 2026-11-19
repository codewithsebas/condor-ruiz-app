// Tema del panel, fijo. Va en una hoja aparte (no en app/globals.css) porque solo aplica mientras el panel está abierto:
// el sitio público tiene sus propios colores.
//
// Estilo limpio y neutro: fondo gris muy claro con un brillo frío detrás de la barra lateral, área de trabajo blanca,
// tarjetas y chips en gris casi blanco, bordes finos, tinta casi negra para la navegación activa y las acciones
// principales, y seis pasteles suaves (salmón, durazno, menta, lavanda, cielo y lila) para indicadores, estados y
// eventos. Los textos sobre los pasteles van en tinta: todos pasan 4.5:1. Gráficas de dos partes (dashboard): violeta y
// aguamarina (--color-chart-a/-b), validadas para daltonismo en claro y oscuro; van siempre con leyenda y valores.
export const PANEL_THEME_CSS = `
:root:not([data-admin-theme="dark"]) {
  --color-canvas:#eef0f2;
  --color-panel:#f5f6f8;
  --color-paper:#ffffff;
  --color-line:#ebecef;
  --color-line-strong:#dcdee3;
  --color-ink:#141416;
  --color-ink-muted:#6c6d75;
  --color-ink-subtle:#9a9ba3;
  --color-sidebar:transparent;
  --color-focus:#141416;
  --color-chart:#141416;
  --color-series-1:#141416;
  --color-series-2:#8b7cf6;
  --color-chart-a:#6250d6;
  --color-chart-b:#1baf7a;
  --color-pink:#fbd6cd;
  --color-pink-soft:#fdeae5;
  --color-pink-deep:#f4b3a4;
  --color-yellow:#fde8c6;
  --color-yellow-soft:#fef4e3;
  --color-yellow-deep:#f7d197;
  --color-green:#d3f3e0;
  --color-green-soft:#e9f9ef;
  --color-green-deep:#a6e3c0;
  --color-blue:#dcdcfc;
  --color-blue-soft:#eeeefe;
  --color-blue-deep:#b9b9f6;
  --color-lilac:#ebe3fc;
  --color-sky:#def1fb;
  --color-success:#1f7a4d;
  --color-success-soft:#e3f6ea;
  --color-warning:#8a5600;
  --color-warning-soft:#fdf0d8;
  --color-error:#c2352b;
  --color-error-soft:#fde8e5;
  --color-info:#4045b5;
  --color-info-soft:#ececfd;
  --shadow-panel:0 1px 2px rgb(20 20 22 / 0.05);
  --shadow-overlay:0 24px 56px -20px rgb(20 20 22 / 0.22), 0 0 0 1px rgb(20 20 22 / 0.06);
}
:root[data-admin-theme="dark"] {
  --color-canvas:#0e0f11;
  --color-panel:#1b1c1f;
  --color-paper:#141517;
  --color-line:#25262a;
  --color-line-strong:#34363b;
  --color-ink:#f2f2f4;
  --color-ink-muted:#a4a5ad;
  --color-ink-subtle:#76777f;
  --color-sidebar:transparent;
  --color-focus:#f2f2f4;
  --color-chart:#f2f2f4;
  --color-series-1:#f2f2f4;
  --color-series-2:#a99ff9;
  --color-chart-a:#9085e9;
  --color-chart-b:#199e70;
  --color-pink:#5b3029;
  --color-pink-soft:#2c1d1a;
  --color-pink-deep:#7a4136;
  --color-yellow:#57411d;
  --color-yellow-soft:#2a2218;
  --color-yellow-deep:#76592a;
  --color-green:#1f4a35;
  --color-green-soft:#16261e;
  --color-green-deep:#2c6449;
  --color-blue:#33356b;
  --color-blue-soft:#1d1e33;
  --color-blue-deep:#454892;
  --color-lilac:#3d2f63;
  --color-sky:#1e3d4f;
  --color-success:#7fd6a5;
  --color-success-soft:#16261e;
  --color-warning:#f1c27a;
  --color-warning-soft:#2a2218;
  --color-error:#f3897d;
  --color-error-soft:#2f1a18;
  --color-info:#b4b6fb;
  --color-info-soft:#1d1e33;
  --shadow-panel:0 1px 2px rgb(0 0 0 / 0.5);
  --shadow-overlay:0 24px 56px -20px rgb(0 0 0 / 0.8), 0 0 0 1px rgb(255 255 255 / 0.07);
}
`;
