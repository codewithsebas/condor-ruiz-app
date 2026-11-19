// Configuración única del negocio. Edita aquí y se actualiza todo el sitio.
// Los valores entre {LLAVES} son placeholders: reemplázalos por los reales.

// Las cabañas viven en la tabla cabin_types (se crean y editan desde el panel); estos son solo los valores de respaldo.
export type CabinTypeId = string;

// Cabaña tal como la muestra el sitio público.
export type Cabin = {
  id: CabinTypeId;
  name: string; // corto: "Estándar"
  full: string; // completo: "Cabaña Estándar"
  couple: number;
  extra: number;
  max: number;
  tiers?: Record<string, number>; // precio por noche según las personas (si existe, reemplaza a couple + extra)
  fromGuests?: number; // para cuántas personas es `couple`; sin definir, 2
  badge: string;
  description: string;
  features: string[];
  photos: string[]; // URLs públicas
};

export type Policy = { q: string; a: string };

export const config = {
  name: "Cabañas El Cóndor del Ruiz",
  tagline: "Descanso a los pies del Nevado del Ruiz",
  whatsapp: "573144001279",
  phones: ["314 400 1279", "311 530 1206", "310 794 4849"],
  address: "Cra. 3 #5-37, Murillo, Tolima, Colombia",
  street: "Cra. 3 #5-37",
  city: "Murillo",
  region: "Tolima",
  country: "CO",
  lat: 4.8778484,
  lng: -75.1683813,

  // Backend: las rutas /api de este mismo Next.js (Supabase). NEXT_PUBLIC_USE_MOCK_API=1 usa el adaptador simulado.
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "{TURNSTILE_SITE_KEY}",
  correoReservas: "{CORREO_RESERVAS}",
  // Solo para el modo simulado: con Supabase, tarifas, capacidad y número de cabañas viven en la tabla cabin_types.
  unidades: { estandar: 2, premium: 1 } as Record<CabinTypeId, number>,
  // Para pagar por transferencia o en recepción (se edita en el panel: Contenido → Pagos).
  datosPagoAbono: "{DATOS_DE_PAGO}",
  // Titular legal del negocio (derechos de autor, política de privacidad). Pendientes: los da el cliente.
  razonSocial: "{RAZON_SOCIAL}",
  nit: "{NIT}",
  rnt: "{NUMERO_RNT}",
  timeZone: "America/Bogota",

  cabins: {
    estandar: {
      id: "estandar",
      name: "Estándar",
      full: "Cabaña Estándar",
      couple: 290000,
      extra: 75000,
      max: 4,
      badge: "",
      description: "",
      features: [],
      photos: [],
    },
    premium: {
      id: "premium",
      name: "Premium con Jacuzzi",
      full: "Cabaña Premium con Jacuzzi",
      couple: 390000,
      extra: 95000,
      max: 6,
      badge: "Con jacuzzi",
      description: "",
      features: [],
      photos: [],
    },
  } as Record<CabinTypeId, Cabin>,
  checkIn: "3:00 p. m. a 7:00 p. m.",
  checkOut: "12:00 del mediodía",
  checkInStart: "15:00",
  checkInEnd: "19:00",
  checkOutTime: "12:00",
  depositPct: 30,

  policies: [
    { q: "Confirmación de la reserva", a: "Para confirmar tu reserva se requiere un abono del 30 % del valor total. Este abono no es reembolsable." },
    { q: "Documento de identidad", a: "Todo huésped debe presentar su documento de identidad físico al llegar." },
    { q: "Cambios de fecha", a: "– Con 5 días o más: reprogramación hasta 3 meses (según disponibilidad).  – Con menos de 120 horas: no se permiten cambios." },
    { q: "Daños", a: "Los daños, las manchas en la lencería o cualquier afectación a la cabaña generan un cobro adicional." },
    { q: "Responsabilidad", a: "No nos hacemos responsables por condiciones climáticas, objetos personales ni vehículos." },
    { q: "Mascotas", a: "Se admiten mascotas de razas pequeñas." },
  ] as Policy[],
};

export const fallbackCabins = Object.values(config.cabins);

// "Cabaña Premium con Jacuzzi" → "Premium con Jacuzzi"
export const shortCabinName = (full: string) => full.replace(/^Cabaña\s+/i, "");

export const isMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === "1";
