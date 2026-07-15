import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { LIMITE_HISTORICO_PADRAO } from "./config";
import { mensagemAssistente } from "./schema";

/** Histórico do assistente do profissional logado, em ordem cronológica. */
export async function listarHistoricoAssistente(limite: number = LIMITE_HISTORICO_PADRAO) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const mensagens = await db
    .select({
      id: mensagemAssistente.id,
      papel: mensagemAssistente.papel,
      conteudo: mensagemAssistente.conteudo,
      criadoEm: mensagemAssistente.criadoEm,
    })
    .from(mensagemAssistente)
    .where(eq(mensagemAssistente.profissionalId, usuarioAtual.id))
    .orderBy(desc(mensagemAssistente.criadoEm))
    .limit(limite);

  return mensagens.reverse();
}
