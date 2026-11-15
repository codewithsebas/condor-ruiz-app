// Tema del panel, fijo. Va en una hoja aparte (no en app/globals.css) porque solo aplica mientras el panel está abierto:
// el sitio público tiene sus propios colores.
export const PANEL_THEME_CSS = `
:root:not([data-admin-theme="dark"]) {
  --color-ink:#163a2a;
  --color-focus:#163a2a;
  --color-chart:#163a2a;
  --color-series-1:#163a2a;
  --color-ink-muted:color-mix(in srgb, #163a2a 66%, var(--color-canvas));
  --color-ink-subtle:color-mix(in srgb, #163a2a 52%, var(--color-canvas));
  --color-sidebar:#163a2a;
  --color-canvas:#f5f1e4;
  --color-panel:#ebe4cf;
  --color-paper:#fffdf6;
  --color-line:#ddd4b8;
  --color-line-strong:color-mix(in srgb, #ddd4b8 88%, #000);
  --color-pink:#d9937f;
  --color-pink-soft:color-mix(in srgb, #d9937f 55%, #fff);
  --color-pink-deep:color-mix(in srgb, #d9937f 86%, #000);
  --color-yellow:#d9a441;
  --color-yellow-soft:color-mix(in srgb, #d9a441 55%, #fff);
  --color-yellow-deep:color-mix(in srgb, #d9a441 86%, #000);
  --color-warning:color-mix(in srgb, #d9a441 38%, #000);
  --color-warning-soft:color-mix(in srgb, #d9a441 55%, #fff);
  --color-green:#7fae84;
  --color-green-soft:color-mix(in srgb, #7fae84 55%, #fff);
  --color-green-deep:color-mix(in srgb, #7fae84 86%, #000);
  --color-success:color-mix(in srgb, #7fae84 38%, #000);
  --color-success-soft:color-mix(in srgb, #7fae84 55%, #fff);
  --color-blue:#9fb8c4;
  --color-blue-soft:color-mix(in srgb, #9fb8c4 55%, #fff);
  --color-blue-deep:color-mix(in srgb, #9fb8c4 86%, #000);
  --color-info:color-mix(in srgb, #9fb8c4 38%, #000);
  --color-info-soft:color-mix(in srgb, #9fb8c4 55%, #fff);
  --color-series-2:color-mix(in srgb, #d9937f 60%, #000);
  --color-error:#c41e2a;
  --color-error-soft:color-mix(in srgb, #c41e2a 20%, #fff);
}
:root[data-admin-theme="dark"] {
  --color-sidebar:#0f2a1e;
  --color-pink:color-mix(in srgb, #d9937f 48%, #000);
  --color-pink-soft:color-mix(in srgb, #d9937f 20%, #121110);
  --color-pink-deep:color-mix(in srgb, #d9937f 68%, #000);
  --color-yellow:color-mix(in srgb, #d9a441 48%, #000);
  --color-yellow-soft:color-mix(in srgb, #d9a441 20%, #121110);
  --color-yellow-deep:color-mix(in srgb, #d9a441 68%, #000);
  --color-warning:color-mix(in srgb, #d9a441 70%, #fff);
  --color-warning-soft:color-mix(in srgb, #d9a441 20%, #121110);
  --color-green:color-mix(in srgb, #7fae84 48%, #000);
  --color-green-soft:color-mix(in srgb, #7fae84 20%, #121110);
  --color-green-deep:color-mix(in srgb, #7fae84 68%, #000);
  --color-success:color-mix(in srgb, #7fae84 70%, #fff);
  --color-success-soft:color-mix(in srgb, #7fae84 20%, #121110);
  --color-blue:color-mix(in srgb, #9fb8c4 48%, #000);
  --color-blue-soft:color-mix(in srgb, #9fb8c4 20%, #121110);
  --color-blue-deep:color-mix(in srgb, #9fb8c4 68%, #000);
  --color-info:color-mix(in srgb, #9fb8c4 70%, #fff);
  --color-info-soft:color-mix(in srgb, #9fb8c4 20%, #121110);
  --color-series-2:#d9937f;
  --color-error:color-mix(in srgb, #c41e2a 55%, #fff);
  --color-error-soft:color-mix(in srgb, #c41e2a 28%, #121110);
}
`;
