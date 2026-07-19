import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Next.js limita o body de Server Action a 1MB por padrão — abaixo do teto de 4MB que
      // modules/fotos/schema.ts permite para upload de foto (e do teto de 4.5MB da própria
      // Vercel). Sem isso, envios de imagem acima de 1MB derrubam a requisição no meio do
      // upload ("Failed to fetch" no navegador) antes mesmo de chegar à validação do Zod.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
