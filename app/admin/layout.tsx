import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: { absolute: `Panel de reservas | ${config.name}` },
  robots: { index: false, follow: false },
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Panel Cóndor", statusBarStyle: "black" },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
