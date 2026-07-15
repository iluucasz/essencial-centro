"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { notificacao } from "./schema";
import { enviarWhatsAppTexto } from "./whatsapp";

export type EstadoTesteWhatsApp = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

const estadoInicialTeste: EstadoTesteWhatsApp = { status: "inicial" };

/**
 * Diagnóstico manual, protegido (só `profissional`) — nunca aceita/retorna a API key, nunca tem
 * telefone fixo no código (quem testa digita o número toda vez).
 */
export async function enviarWhatsAppDeTeste(
  _: EstadoTesteWhatsApp = estadoInicialTeste,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional"]);

  const telefone = formData.get("telefone");
  const mensagem = formData.get("mensagem");

  if (
    typeof telefone !== "string" ||
    typeof mensagem !== "string" ||
    !telefone.trim() ||
    !mensagem.trim()
  ) {
    return {
      status: "erro",
      mensagem: "Informe telefone e mensagem.",
    } satisfies EstadoTesteWhatsApp;
  }

  const resultado = await enviarWhatsAppTexto({ telefone, mensagem });

  if (!resultado.sent) {
    return {
      status: "erro",
      mensagem: resultado.error ?? "WhatsApp não está configurado.",
    } satisfies EstadoTesteWhatsApp;
  }

  return {
    status: "sucesso",
    mensagem: "Mensagem de teste enviada.",
  } satisfies EstadoTesteWhatsApp;
}

export async function marcarNotificacaoComoLida(formData: FormData) {
  const usuario = autorizarPapel(await auth(), ["profissional", "recepcao", "cliente"]);
  const id = formData.get("id");

  if (typeof id !== "string" || id.length === 0) return;

  await db
    .update(notificacao)
    .set({ lida: true, lidaEm: new Date() })
    .where(and(eq(notificacao.id, id), eq(notificacao.destinatarioId, usuario.id)));

  revalidatePath("/portal/notificacoes");
  revalidatePath("/portal");
}
