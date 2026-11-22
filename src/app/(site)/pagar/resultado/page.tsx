import type { Metadata } from "next";
import { Suspense } from "react";
import { PayResult } from "@/components/booking/online-pay";

export const metadata: Metadata = { title: "Resultado del pago", robots: { index: false, follow: false } };

// Vuelta de la pasarela (/pagar/resultado?ref=…&id=…): consulta el pago y muestra cómo quedó.
export default function PayResultRoute() {
  return (
    <main className="flex flex-col gap-5 gutter-1000 pt-6 pb-[72px]">
      <h1 className="page-title">
        <span>Tu</span> <span className="text-accent">pago</span>
      </h1>
      <Suspense>
        <PayResult />
      </Suspense>
    </main>
  );
}
