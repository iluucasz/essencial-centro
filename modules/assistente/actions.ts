"use server";

import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { anexoAssistente, mensagemAssistente, type PapelMensagemAssistente } from "./schema";

/** Helper interno (não ligado a formulário) — a rota de chat chama a cada turno. */
export async function salvarMensagemAssistente(papel: PapelMensagemAssistente, conteudo: string) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  await db.insert(mensagemAssistente).values({ profissionalId: usuarioAtual.id, papel, conteudo });
}

/** Botão "limpar conversa" do widget — apaga só o histórico do próprio profissional logado. */
export async function limparHistoricoAssistente() {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  await Promise.all([
    db.delete(mensagemAssistente).where(eq(mensagemAssistente.profissionalId, usuarioAtual.id)),
    db.delete(anexoAssistente).where(eq(anexoAssistente.profissionalId, usuarioAtual.id)),
  ]);
}
