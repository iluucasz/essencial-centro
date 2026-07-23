import { and, desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { LIMITE_HISTORICO_PADRAO } from "./config";
import { anexoAssistente, mensagemAssistente } from "./schema";

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

/** Busca o PDF extraido mantendo a posse no WHERE para evitar acesso cruzado entre profissionais. */
export async function obterAnexoAssistenteDoProfissional(id: string, profissionalId: string) {
  const [anexo] = await db
    .select({
      id: anexoAssistente.id,
      nomeArquivo: anexoAssistente.nomeArquivo,
      totalPaginas: anexoAssistente.totalPaginas,
      totalCaracteres: anexoAssistente.totalCaracteres,
      textoExtraido: anexoAssistente.textoExtraido,
    })
    .from(anexoAssistente)
    .where(and(eq(anexoAssistente.id, id), eq(anexoAssistente.profissionalId, profissionalId)))
    .limit(1);

  return anexo ?? null;
}
