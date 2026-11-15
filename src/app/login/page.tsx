import { Suspense } from "react";
import { LoginPage } from "@/components/admin/login";

// Ingreso del equipo. El panel manda aquí cuando no hay sesión (/login?next=/admin/...) y, al entrar, vuelve a esa ruta.
export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
