import { gerarQrCodeWhatsApp } from "@/modules/whatsapp/conexao";
import { responderConexaoWhatsApp } from "@/modules/whatsapp/conexao-http";

/** QR Code novo — a Evolution renova o código a cada ~40 s. */
export async function GET() {
  return responderConexaoWhatsApp(gerarQrCodeWhatsApp);
}
