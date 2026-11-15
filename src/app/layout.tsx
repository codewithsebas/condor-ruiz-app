import type { Metadata, Viewport } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { ServiceWorker } from "@/components/site/service-worker";
import { SiteProvider } from "@/components/site/site-provider";
import { config } from "@/lib/config";
import { getSiteCabins } from "@/lib/server/cabins";
import { getSiteContent } from "@/lib/server/site";
import "@/app/globals.css";

// Fuentes en el repo (subconjunto latin de Google Fonts, app/fonts): la compilación no las descarga, así no depende de la
// red del servidor de Hostinger, donde next/font/google falló al bajar Caveat.
const bebas = localFont({ src: "./fonts/bebas-neue-400.woff2", variable: "--font-bebas", weight: "400" });
const manrope = localFont({ src: "./fonts/manrope-variable.woff2", variable: "--font-manrope", weight: "200 800" });
const caveat = localFont({ src: "./fonts/caveat-variable.woff2", variable: "--font-caveat", weight: "500 600" });

// Las páginas se regeneran cada hora o al guardar contenido en el panel (revalidatePath).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { default: config.name, template: `%s | ${config.name}` },
  description: "Cabañas tipo chalet con vista al Nevado del Ruiz y a una cascada en Murillo, Tolima.",
  openGraph: { locale: "es_CO", siteName: config.name, type: "website" },
  // PWA: los íconos salen de app/favicon.ico, app/icon.png y app/apple-icon.png (public/icons para la PWA, components/brand/marca.tsx); el manifiesto, de app/manifest.webmanifest.
  manifest: "/manifest.webmanifest",
  applicationName: config.name,
  appleWebApp: { capable: true, title: "Cóndor del Ruiz", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#dcc39c",
};

// Apariencia del panel antes de pintar (components/admin/appearance.tsx), para que el modo oscuro no destelle en claro.
const ADMIN_THEME = `try{if(/^\/(admin|login)(\/|$)/.test(location.pathname)){var p=localStorage.getItem("vf-admin-theme");document.documentElement.dataset.adminTheme=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light"}}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [content, cabins] = await Promise.all([getSiteContent(), getSiteCabins()]);
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${bebas.variable} ${manrope.variable} ${caveat.variable}`} suppressHydrationWarning>
      <body>
        <Script id="admin-theme" strategy="beforeInteractive">
          {ADMIN_THEME}
        </Script>
        <SiteProvider content={content} cabins={cabins}>
          {children}
        </SiteProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
