import "server-only";

import QRCode from "qrcode";

import { urlCheckin } from "./checkin-url";

/**
 * QR de presença de um agendamento em base64 puro (sem prefixo `data:`), pra anexar no WhatsApp.
 * Fica em módulo próprio porque é usado pela action do painel e pelo job de lembretes — e um job não
 * pode importar de um arquivo `"use server"`.
 */
export async function qrCheckinBase64(agendamentoId: string) {
  const dataUrl = await QRCode.toDataURL(await urlCheckin(agendamentoId), {
    margin: 1,
    width: 320,
  });

  return dataUrl.split(",")[1] ?? "";
}
