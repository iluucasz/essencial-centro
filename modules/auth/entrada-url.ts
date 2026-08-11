import "server-only";

import { headers } from "next/headers";

/**
 * URL absoluta da tela de login (`/entrar`), usada na mensagem de boas-vindas enviada por WhatsApp
 * quando o acesso ao portal é criado. Deriva o host da requisição atual — `localhost:3000` no dev, o
 * domínio da Vercel em produção (mesmo padrão de `modules/agenda/confirmacao-url.ts`).
 */
export async function urlEntradaPortal() {
  const listaHeaders = await headers();
  const host = listaHeaders.get("host") ?? "localhost:3000";
  const protocolo = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";

  return `${protocolo}://${host}/entrar`;
}
