import type { Metadata } from "next";
import { Suspense } from "react";
import { PayPage } from "@/components/booking/online-pay";

export const metadata: Metadata = { title: "Pagar mi reserva", robots: { index: false, follow: false } };

// Enlace de pago que comparte el equipo (/pagar?code=…&k=…) o el del correo: pagar en línea sin buscar la reserva.
export default function PayRoute() {
  return (
    <main className="flex flex-col gap-5 gutter-1000 pt-6 pb-[72px]">
      <h1 className="page-title">
        <span>Paga</span> <span className="text-accent">tu reserva</span>
      </h1>
      <Suspense>
        <PayPage />
      </Suspense>
    </main>
  );
}
