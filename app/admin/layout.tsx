import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";
import { config } from "@/lib/config";

// El título de cada pestaña lo pone el panel (página actual + avisos sin leer).
export const metadata: Metadata = {
  title: { absolute: `Panel de reservas | ${config.name}` },
  robots: { index: false, follow: false },
  // App instalable propia del equipo (abre directo en el panel) con su ícono invertido: app/admin/apple-icon.tsx.
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Panel Cóndor", statusBarStyle: "black" },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
