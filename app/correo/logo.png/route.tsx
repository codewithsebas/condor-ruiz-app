import { ImageResponse } from "next/og";
import { CONDOR_HEAD } from "@/components/icons";

// Logo de los correos en PNG (muchos clientes de correo no muestran SVG ni imágenes en data:). 96 px para pantallas retina.
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#163A2A", borderRadius: 48 }}>
        <svg width="96" height="96" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="none" stroke="#F2EBD3" strokeWidth="2" />
          <path d="M8 36 L19 20 L24 26 L29 18 L40 36 Z" fill="#F2EBD3" />
          <path d={CONDOR_HEAD} fill="#F2EBD3" />
        </svg>
      </div>
    ),
    { width: 96, height: 96, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
}
