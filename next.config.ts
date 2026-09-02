import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  // pdf-parse → pdfjs-dist → @napi-rs/canvas (binário nativo). O rastreamento automático de
  // arquivos (@vercel/nft) não resolve estaticamente qual pacote de plataforma o @napi-rs/canvas
  // vai exigir em runtime (a escolha é dinâmica, por process.platform/arch/libc), então o binário
  // linux fica de fora do bundle da function na Vercel — foi isso que causou o
  // "ReferenceError: DOMMatrix is not defined" em produção. Força a inclusão explícita nas duas
  // rotas que de fato chamam extrairTextoPdf.
  outputFileTracingIncludes: {
    "/api/analises": [
      "./node_modules/.pnpm/@napi-rs+canvas@*/**/*",
      "./node_modules/.pnpm/@napi-rs+canvas-linux-x64-gnu@*/**/*",
    ],
    "/api/assistente/anexos": [
      "./node_modules/.pnpm/@napi-rs+canvas@*/**/*",
      "./node_modules/.pnpm/@napi-rs+canvas-linux-x64-gnu@*/**/*",
    ],
  },
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
