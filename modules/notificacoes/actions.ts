"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { enviarEmailNotificacao } from "./email";
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

/**
 * Diagnóstico manual, protegido (só `profissional`) — nunca aceita/retorna a API key, nunca tem
 * e-mail fixo no código (quem testa digita o endereço toda vez).
 */
export async function enviarEmailDeTeste(
  _: EstadoTesteWhatsApp = estadoInicialTeste,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional"]);

  const email = formData.get("email");
  const mensagem = formData.get("mensagem");

  if (
    typeof email !== "string" ||
    typeof mensagem !== "string" ||
    !email.trim() ||
    !mensagem.trim()
  ) {
    return {
      status: "erro",
      mensagem: "Informe e-mail e mensagem.",
    } satisfies EstadoTesteWhatsApp;
  }

  const resultado = await enviarEmailNotificacao({
    destinatarioEmail: email,
    destinatarioNome: email,
    titulo: "Teste de integração — Essencial Centro",
    mensagem,
  });

  if (!resultado.sent) {
    return {
      status: "erro",
      mensagem: resultado.error ?? "E-mail não está configurado.",
    } satisfies EstadoTesteWhatsApp;
  }

  return {
    status: "sucesso",
    mensagem: "E-mail de teste enviado.",
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
