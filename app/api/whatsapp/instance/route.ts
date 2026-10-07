import {
  criarConexaoWhatsApp,
  desconectarWhatsApp,
  obterStatusConexaoWhatsApp,
} from "@/modules/whatsapp/conexao";
import { responderConexaoWhatsApp } from "@/modules/whatsapp/conexao-http";

/** Status da conexão do número (consulta a Evolution e atualiza o banco). */
export async function GET() {
  return responderConexaoWhatsApp(obterStatusConexaoWhatsApp);
}

/** Cria a instância (ou reaproveita a nossa) e devolve o QR Code. */
export async function POST() {
  return responderConexaoWhatsApp(criarConexaoWhatsApp);
}

/** Desconecta o número; a instância continua existindo. */
export async function DELETE() {
  return responderConexaoWhatsApp(desconectarWhatsApp);
}
