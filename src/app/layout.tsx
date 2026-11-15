import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Bebas_Neue, Caveat, Manrope } from "next/font/google";
import { ServiceWorker } from "@/components/site/service-worker";
import { SiteProvider } from "@/components/site/site-provider";
import { config } from "@/lib/config";
import { getSiteCabins } from "@/lib/server/cabins";
import { getSiteContent } from "@/lib/server/site";
import "@/app/globals.css";

const bebas = Bebas_Neue({ variable: "--font-bebas", weight: "400", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", weight: ["500", "600"], subsets: ["latin"] });

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
  themeColor: "#163A2A",
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
