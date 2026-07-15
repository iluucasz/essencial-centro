"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarClienteDono, autorizarPapel } from "@/modules/auth/rbac";

import { assinaturaValida, podeAssinarDocumento } from "./assinatura";
import { calcularHashConteudo } from "./hash";
import { criarDocumentoSchema, documento } from "./schema";

export type EstadoFormularioDocumento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioDocumento = { status: "inicial" };

export type EstadoAssinatura = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

const estadoAssinaturaInicial: EstadoAssinatura = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

export async function criarDocumento(
  _: EstadoFormularioDocumento = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarDocumentoSchema.safeParse({
    clienteId: getValor(formData, "clienteId"),
    tipo: getValor(formData, "tipo"),
    titulo: getValor(formData, "titulo"),
    conteudo: getValor(formData, "conteudo"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do documento.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioDocumento;
  }

  await db.insert(documento).values({
    ...parsed.data,
    criadoPorId: usuarioAtual.id,
    atualizadoPorId: usuarioAtual.id,
  });

  revalidatePath(`/painel/clientes/${parsed.data.clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Documento emitido com sucesso.",
  } satisfies EstadoFormularioDocumento;
}

/**
 * Assinatura eletrônica simples (traço desenhado na tela) — captura a imagem do traço mais
 * evidências no servidor (IP, user-agent, hash do conteúdo assinado), nunca confiando em dados
 * de identidade vindos do cliente além do traço em si.
 */
export async function assinarDocumento(
  _: EstadoAssinatura = estadoAssinaturaInicial,
  formData: FormData,
) {
  const sessao = await auth();
  autorizarPapel(sessao, ["cliente"]);

  const id = getValor(formData, "id");
  if (typeof id !== "string") {
    return { status: "erro", mensagem: "Documento inválido." } satisfies EstadoAssinatura;
  }

  const assinaturaImagemDataUrl = getValor(formData, "assinaturaImagemDataUrl");
  const imagem = typeof assinaturaImagemDataUrl === "string" ? assinaturaImagemDataUrl : null;

  if (!assinaturaValida(imagem)) {
    return {
      status: "erro",
      mensagem: "Desenhe sua assinatura no campo antes de confirmar.",
    } satisfies EstadoAssinatura;
  }

  const [registro] = await db.select().from(documento).where(eq(documento.id, id)).limit(1);
  if (!registro) {
    return { status: "erro", mensagem: "Documento não encontrado." } satisfies EstadoAssinatura;
  }

  autorizarClienteDono(sessao, registro.clienteId);

  if (!podeAssinarDocumento(registro.status)) {
    return {
      status: "erro",
      mensagem: "Este documento já foi assinado.",
    } satisfies EstadoAssinatura;
  }

  const listaHeaders = await headers();
  const ip =
    listaHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    listaHeaders.get("x-real-ip") ??
    null;

  await db
    .update(documento)
    .set({
      status: "assinado",
      assinadoEm: new Date(),
      assinaturaImagemDataUrl: imagem,
      assinaturaIp: ip,
      assinaturaUserAgent: listaHeaders.get("user-agent"),
      conteudoHash: calcularHashConteudo(registro.conteudo),
    })
    .where(and(eq(documento.id, id), eq(documento.status, "emitido")));

  revalidatePath(`/portal/documentos/${id}`);
  revalidatePath("/portal/documentos");

  return { status: "sucesso" } satisfies EstadoAssinatura;
}
