import type { Metadata } from "next";
import { Suspense } from "react";
import { ReservationWizard } from "@/components/reservar/wizard";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: { absolute: `Reservar | ${config.name} · Murillo, Tolima` },
  description: "Reserva tu cabaña tipo chalet frente al Nevado del Ruiz en Murillo, Tolima. Elige fechas, cabaña Estándar o Premium con jacuzzi y envía tu solicitud.",
  openGraph: { title: `Reservar | ${config.name}`, description: "Elige fechas y cabaña, y envía tu solicitud de reserva en Murillo, Tolima." },
  robots: { index: false },
};

export default function ReservePage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <ReservationWizard />
    </Suspense>
  );
}
