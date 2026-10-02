// Contenido de la página de inicio. Las fotos de cada experiencia se suben desde el panel (hueco exp-<id>).
import type { ServiceIcon } from "./service-icons";

export const EXPERIENCES = [
  { id: "vista", label: "Vista al Nevado y a la cascada" },
  { id: "aves", label: "Avistamiento de aves" },
  { id: "sendero", label: "Sendero ecológico" },
  { id: "malla", label: "Malla catamarán" },
  { id: "fogata", label: "Zona de fogata" },
];

// Servicios por defecto: los mismos que siembra la migración «servicios_del_sitio». Desde el panel se crean, editan,
// ocultan, ordenan y eliminan (tabla site_services); estos solo se usan si la base de datos no responde.
export const DEFAULT_SERVICES: { title: string; icon: ServiceIcon; note?: string }[] = [
  { title: "Cabaña tipo chalet", icon: "chalet" },
  { title: "Avistamiento de aves", icon: "aves" },
  { title: "Sendero ecológico", icon: "sendero" },
  { title: "Altillo", icon: "altillo" },
  { title: "Malla catamarán", icon: "malla" },
  { title: "Cama doble premium", icon: "cama" },
  { title: "Baño interno con agua caliente", icon: "ducha" },
  { title: "Zona de fogata", icon: "fogata" },
  { title: "Parqueadero", icon: "parqueadero" },
  { title: "Desayuno incluido", icon: "desayuno" },
  { title: "Vista al Nevado y a la cascada", icon: "montana" },
  { title: "Pet friendly (razas pequeñas)", icon: "mascota" },
  { title: "Decoración especial para ocasiones", icon: "corazon", note: "Valor adicional" },
];
