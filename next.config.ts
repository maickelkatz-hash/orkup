import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Fotos de perfil/post chegam como upload via Server Action — o limite
    // padrão de 1MB é curto demais para uma imagem de câmera de celular.
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
