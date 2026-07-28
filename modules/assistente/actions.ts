"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";
import { documento } from "@/modules/documentos/schema";

import { montarDocumentoBiorressonancia } from "./arquivamento";
import { anexoAssistente, mensagemAssistente, type PapelMensagemAssistente } from "./schema";

/** Helper interno (não ligado a formulário) — a rota de chat chama a cada turno. */
export async function salvarMensagemAssistente(papel: PapelMensagemAssistente, conteudo: string) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  await db.insert(mensagemAssistente).values({ profissionalId: usuarioAtual.id, papel, conteudo });
}

export type EstadoArquivamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  clienteId?: string;
};

/**
 * "Confirmar" do card de arquivamento: grava o PDF anexado + o resumo na aba Documentos do cliente,
 * como tipo `biorressonancia` (só a profissional vê — ver `tiposDocumentoSomenteProfissional`).
 *
 * O `clienteId` vem do cliente, então **nada** dele é confiado: o anexo é buscado com a posse no
 * WHERE (nunca o de outra profissional) e o cliente é revalidado no banco antes de gravar.
 */
export async function arquivarAnexoNoProntuario({
  anexoId,
  clienteId,
  resumo,
}: {
  anexoId: string;
  clienteId: string;
  resumo: string;
}): Promise<EstadoArquivamento> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const [anexo] = await db
    .select({
      nomeArquivo: anexoAssistente.nomeArquivo,
      pathname: anexoAssistente.pathname,
      contentType: anexoAssistente.contentType,
      tamanhoBytes: anexoAssistente.tamanhoBytes,
    })
    .from(anexoAssistente)
    .where(
      and(eq(anexoAssistente.id, anexoId), eq(anexoAssistente.profissionalId, usuarioAtual.id)),
    )
    .limit(1);

  if (!anexo) {
    return { status: "erro", mensagem: "Anexo não encontrado." };
  }

  const [destinatario] = await db
    .select({ id: cliente.id })
    .from(cliente)
    .where(eq(cliente.id, clienteId))
    .limit(1);

  if (!destinatario) {
    return { status: "erro", mensagem: "Cliente não encontrado." };
  }

  const { titulo, conteudo } = montarDocumentoBiorressonancia({
    nomeArquivo: anexo.nomeArquivo,
    resumo,
    emitidoEm: new Date(),
  });

  await db.insert(documento).values({
    clienteId: destinatario.id,
    tipo: "biorressonancia",
    titulo,
    conteudo,
    arquivoPathname: anexo.pathname,
    arquivoNome: anexo.nomeArquivo,
    arquivoContentType: anexo.contentType,
    arquivoTamanhoBytes: anexo.tamanhoBytes,
    criadoPorId: usuarioAtual.id,
    atualizadoPorId: usuarioAtual.id,
  });

  revalidatePath(`/painel/clientes/${destinatario.id}`);

  return { status: "sucesso", clienteId: destinatario.id };
}

/** Botão "limpar conversa" do widget — apaga só o histórico do próprio profissional logado. */
export async function limparHistoricoAssistente() {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  await Promise.all([
    db.delete(mensagemAssistente).where(eq(mensagemAssistente.profissionalId, usuarioAtual.id)),
    db.delete(anexoAssistente).where(eq(anexoAssistente.profissionalId, usuarioAtual.id)),
  ]);
}
