import type { NextConfig } from "next";

// Fotos del sitio servidas desde Supabase Storage (bucket público site-images).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, port: "", pathname: "/storage/v1/object/public/site-images/**", search: "" }] : [],
    // 90 para las fotos del sitio (PhotoSlot); 75 queda para miniaturas del panel.
    qualities: [75, 90],
  },
};

export default nextConfig;
