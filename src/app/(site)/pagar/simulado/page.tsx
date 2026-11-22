import type { Metadata } from "next";
import { Suspense } from "react";
import { PaySimulator } from "@/components/booking/online-pay";

export const metadata: Metadata = { title: "Pago simulado", robots: { index: false, follow: false } };

// Checkout simulado (sin llaves de Wompi y solo donde el simulador está permitido: la API lo rechaza en los demás casos).
export default function PaySimulatorRoute() {
  return (
    <main className="flex flex-col gap-5 gutter-1000 pt-6 pb-[72px]">
      <Suspense>
        <PaySimulator />
      </Suspense>
    </main>
  );
}
