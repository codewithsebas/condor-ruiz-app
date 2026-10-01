import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";
import { config } from "@/lib/config";

// El título de cada pestaña lo pone el panel (página actual + avisos sin leer).
export const metadata: Metadata = {
  title: { absolute: `Panel de reservas | ${config.name}` },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
