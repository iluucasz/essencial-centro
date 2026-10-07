import { auth } from "@/auth";
import { autorizarAdmin, ErroAutorizacao } from "@/modules/auth/rbac";

import { ErroConexaoWhatsApp } from "./conexao";

/**
 * Casca comum das rotas `/api/whatsapp/instance*`: só admin da clínica (profissional + função
 * admin) conecta/desconecta o número, e todo erro conhecido vira `{ error }` com o status certo
 * (401/403 sessão, 409 conflito, 502 Evolution recusou/não respondeu, 503 sem configuração).
 */
export async function responderConexaoWhatsApp(acao: () => Promise<unknown>) {
  try {
    autorizarAdmin(await auth());

    return Response.json(await acao(), { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    if (erro instanceof ErroAutorizacao || erro instanceof ErroConexaoWhatsApp) {
      return Response.json({ error: erro.message }, { status: erro.status });
    }

    throw erro;
  }
}
