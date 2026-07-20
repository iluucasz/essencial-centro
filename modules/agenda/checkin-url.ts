import "server-only";

import { headers } from "next/headers";

/**
 * URL absoluta da página de check-in de um agendamento, usada tanto no QR mostrado no portal
 * (qr-checkin.tsx) quanto no QR enviado por WhatsApp (actions.ts). Deriva o host da requisição
 * atual — `localhost:3000` no dev, o domínio da Vercel em produção.
 */
export async function urlCheckin(agendamentoId: string) {
  const listaHeaders = await headers();
  const host = listaHeaders.get("host") ?? "localhost:3000";
  const protocolo = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";

  return `${protocolo}://${host}/painel/checkin/${agendamentoId}`;
}
