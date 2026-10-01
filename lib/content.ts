// Contenido de la página de inicio. Las fotos de cada experiencia se suben desde el panel (hueco exp-<id>).

export const EXPERIENCES = [
  { id: "vista", label: "Vista al Nevado y a la cascada" },
  { id: "aves", label: "Avistamiento de aves" },
  { id: "sendero", label: "Sendero ecológico" },
  { id: "malla", label: "Malla catamarán" },
  { id: "fogata", label: "Zona de fogata" },
];

// Círculo como trazo SVG (para combinar con otros paths en un solo `d`).
const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

export const SERVICES: { label: string; d: string; note?: string }[] = [
  { label: "Cabaña tipo chalet", d: "M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { label: "Avistamiento de aves", d: "M16 7h.01M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.3-2.3L2 20M20 7l2 .5-2 .5M10 18v3M14 17.8V21M7 18a6 6 0 0 0 3.8-10.6" },
  { label: "Sendero ecológico", d: "M4 16v-2.4C4 11.5 3 10.5 3 8c0-2.7 1.5-6 4.5-6C9.4 2 10 3.8 10 5.5c0 3.1-2 5.7-2 8.7V16a2 2 0 1 1-4 0ZM20 20v-2.4c0-2.1 1-3.1 1-5.6 0-2.7-1.5-6-4.5-6-1.9 0-2.5 1.8-2.5 3.5 0 3.1 2 5.7 2 8.7V20a2 2 0 1 0 4 0ZM16 17h4M4 13h4" },
  { label: "Altillo", d: "M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10" },
  { label: "Malla catamarán", d: "M3 9h18l-2 8H5zM7.5 9l1.5 8M12 9v8M16.5 9 15 17M4 13h16" },
  { label: "Cama doble premium", d: "M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" },
  { label: "Baño interno con agua caliente", d: "M4 4l2.5 2.5M13.5 6.5a5 5 0 0 0-7 7M15 5 5 15M14 17v.01M10 16v.01M13 13v.01M16 10v.01M11 20v.01M17 14v.01M20 11v.01" },
  { label: "Zona de fogata", d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z" },
  {
    label: "Parqueadero",
    d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2M9 17h6" + circle(7, 17, 2) + circle(17, 17, 2),
  },
  { label: "Desayuno incluido", d: "M10 2v2M14 2v2M6 2v2M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" },
  { label: "Vista al Nevado y a la cascada", d: "M8 3l4 8 5-5 5 15H2L8 3zM4.1 15.1c2.6-1.6 5.2-1.4 7.9.4 2.7 1.9 5.5 2 8.2.2" },
  {
    label: "Pet friendly (razas pequeñas)",
    d: circle(11, 4, 2) + circle(18, 8, 2) + circle(20, 16, 2) + "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.8 1C6.5 17.5 4.5 16.8 4.5 16.8A3.5 3.5 0 0 1 5.5 10Z",
  },
  { label: "Decoración especial para ocasiones", note: "Valor adicional", d: "M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" },
];
