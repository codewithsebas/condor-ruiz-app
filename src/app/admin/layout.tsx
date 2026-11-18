import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AdminShell } from "@/components/admin/shell";
import { config } from "@/lib/config";
import { PANEL_ICONS } from "@/lib/pwa";

// Tipografía del panel: neutra y legible en tamaños pequeños (tablas, etiquetas). El sitio conserva la suya.
const adminFont = Inter({ variable: "--font-admin", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { absolute: `Panel de reservas | ${config.name}` },
  robots: { index: false, follow: false },
  manifest: "/admin/manifest.webmanifest",
  // Íconos del panel: el cóndor del logo (public/icons/panel-*.png), en lugar de los del sitio.
  icons: PANEL_ICONS,
  appleWebApp: { capable: true, title: "Panel Cóndor", statusBarStyle: "default" },
};

// La barra del navegador en el celular toma el gris del fondo del panel.
export const viewport: Viewport = { themeColor: "#eef0f2" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className={`${adminFont.variable} admin-theme`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
