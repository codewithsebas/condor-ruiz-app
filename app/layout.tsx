import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Caveat, Manrope } from "next/font/google";
import { SiteProvider } from "@/components/site-provider";
import { config } from "@/lib/config";
import { getSiteCabins } from "@/lib/server/cabins";
import { getSiteContent } from "@/lib/server/site";
import "./globals.css";

const bebas = Bebas_Neue({ variable: "--font-bebas", weight: "400", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", weight: ["500", "600"], subsets: ["latin"] });

// Las páginas se regeneran cada hora o al guardar contenido en el panel (revalidatePath).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { default: config.name, template: `%s | ${config.name}` },
  description: "Cabañas tipo chalet con vista al Nevado del Ruiz y a una cascada en Murillo, Tolima.",
  openGraph: { locale: "es_CO", siteName: config.name, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#163A2A",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [content, cabins] = await Promise.all([getSiteContent(), getSiteCabins()]);
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${bebas.variable} ${manrope.variable} ${caveat.variable}`}>
      <body>
        <SiteProvider content={content} cabins={cabins}>
          {children}
        </SiteProvider>
      </body>
    </html>
  );
}
