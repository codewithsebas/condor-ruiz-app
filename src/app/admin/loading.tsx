import { ModuleSkeleton } from "@/components/admin/skeletons";

// Mientras llega la página que se abre (navegación del servidor), el esqueleto de esa misma página dentro del marco.
export default function AdminLoading() {
  return <ModuleSkeleton />;
}
