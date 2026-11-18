import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PANEL_THEME_CSS } from "@/components/admin/panel-theme";
import { config } from "@/lib/config";
import { PANEL_ICONS } from "@/lib/pwa";

// Ingreso al panel en su propia página: la misma letra y los mismos colores del panel (app/admin/layout.tsx).
const adminFont = Inter({ variable: "--font-admin", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { absolute: `Iniciar sesión | ${config.name}` },
  robots: { index: false, follow: false },
  manifest: "/admin/manifest.webmanifest",
  // Íconos del panel: el cóndor del logo (public/icons/panel-*.png), en lugar de los del sitio.
  icons: PANEL_ICONS,
};

export const viewport: Viewport = { themeColor: "#eef0f2" };

export default function LoginLayout({ children }: LayoutProps<"/login">) {
  return (
    <div className={`${adminFont.variable} admin-theme`}>
      <style dangerouslySetInnerHTML={{ __html: PANEL_THEME_CSS }} />
      {children}
    </div>
  );
}
