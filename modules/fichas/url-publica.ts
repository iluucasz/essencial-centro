import "server-only";

import { headers } from "next/headers";

/**
 * URL absoluta do formulário público de ficha (link enviado por WhatsApp). Deriva o host da
 * requisição atual — `localhost:3000` no dev, o domínio da Vercel em produção (igual a
 * modules/agenda/checkin-url.ts).
 */
export async function urlFichaPublica(token: string) {
  const listaHeaders = await headers();
  const host = listaHeaders.get("host") ?? "localhost:3000";
  const protocolo = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";

  return `${protocolo}://${host}/ficha/${token}`;
}
