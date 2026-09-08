import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  /**
   * ⚠️ NÃO reintroduzir `outputFileTracingIncludes` forçando `.pnpm/@napi-rs+canvas*` sem antes
   * confirmar que o caminho existe de verdade no build da Vercel. Foi tentado em 9f2f8f9 (pra
   * evitar "DOMMatrix is not defined" nas rotas que leem PDF) e quebrou TODO deploy subsequente
   * por uma semana inteira (erro ENOENT no passo "direct:build" — confirmado via API da Vercel,
   * `deployments/{id}` retorna `errorCode: "ENOENT"`; o dashboard só mostra "internal error"
   * genérico, sem essa causa). O binário de plataforma do @napi-rs/canvas aparentemente não
   * resolve pro mesmo caminho no ambiente de build deles que resolvia localmente no Windows.
   * As rotas de PDF (`/api/analises`, `/api/assistente/anexos`) continuam com risco do
   * DOMMatrix — é um problema mais estreito que vale investigar separadamente, com deploy real,
   * antes de mexer aqui de novo.
   */
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
