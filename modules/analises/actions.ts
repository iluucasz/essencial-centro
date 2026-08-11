"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { ErroAutorizacao, autorizarPapel } from "@/modules/auth/rbac";

import {
  excluirAnaliseSchema,
  revisarAnaliseSchema,
  salvarObservacaoAnaliseSchema,
  analiseClinica,
} from "./schema";

export type EstadoAnalise = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoAnalise = { status: "inicial" };

/** Guarda comum: só `profissional` mexe em análise clínica. */
async function exigirProfissional() {
  return autorizarPapel(await auth(), ["profissional"]);
}

function erroDeValidacao(erro: z.ZodError): EstadoAnalise {
  return {
    status: "erro",
    mensagem: "Revise os dados.",
    campos: z.flattenError(erro).fieldErrors,
  };
}

/**
 * Complemento da profissional. Guardado em coluna SEPARADA de `analiseIa` de propósito: o texto da
 * IA nunca é sobrescrito, então daqui a um ano ainda se sabe o que a máquina disse e o que a pessoa
 * concluiu.
 */
export async function salvarObservacaoAnalise(
  _: EstadoAnalise = estadoInicial,
  formData: FormData,
): Promise<EstadoAnalise> {
  try {
    await exigirProfissional();
  } catch (erro) {
    if (erro instanceof ErroAutorizacao) return { status: "erro", mensagem: erro.message };
    throw erro;
  }

  const dados = salvarObservacaoAnaliseSchema.safeParse({
    id: formData.get("id"),
    clienteId: formData.get("clienteId"),
    observacaoProfissional: formData.get("observacaoProfissional"),
  });

  if (!dados.success) return erroDeValidacao(dados.error);

  const atualizadas = await db
    .update(analiseClinica)
    .set({
      observacaoProfissional: dados.data.observacaoProfissional ?? null,
      atualizadoEm: new Date(),
    })
    .where(
      and(eq(analiseClinica.id, dados.data.id), eq(analiseClinica.clienteId, dados.data.clienteId)),
    )
    .returning({ id: analiseClinica.id });

  if (!atualizadas.length) return { status: "erro", mensagem: "Análise não encontrada." };

  revalidatePath(`/painel/clientes/${dados.data.clienteId}`);

  return { status: "sucesso", mensagem: "Observação salva." };
}

/**
 * Marca a análise como revisada. É a etapa que transforma rascunho de IA em registro clínico válido
 * — deliberadamente separada da criação, igual a `confirmarVerificacaoMedicamento`. Nunca acontece
 * junto com a geração.
 */
export async function revisarAnalise(formData: FormData): Promise<EstadoAnalise> {
  let usuarioAtual;

  try {
    usuarioAtual = await exigirProfissional();
  } catch (erro) {
    if (erro instanceof ErroAutorizacao) return { status: "erro", mensagem: erro.message };
    throw erro;
  }

  const dados = revisarAnaliseSchema.safeParse({
    id: formData.get("id"),
    clienteId: formData.get("clienteId"),
  });

  if (!dados.success) return erroDeValidacao(dados.error);

  const atualizadas = await db
    .update(analiseClinica)
    .set({ revisadoPorId: usuarioAtual.id, revisadoEm: new Date(), atualizadoEm: new Date() })
    .where(
      and(eq(analiseClinica.id, dados.data.id), eq(analiseClinica.clienteId, dados.data.clienteId)),
    )
    .returning({ id: analiseClinica.id });

  if (!atualizadas.length) return { status: "erro", mensagem: "Análise não encontrada." };

  revalidatePath(`/painel/clientes/${dados.data.clienteId}`);

  return { status: "sucesso", mensagem: "Análise marcada como revisada." };
}

export async function excluirAnalise(formData: FormData): Promise<EstadoAnalise> {
  try {
    await exigirProfissional();
  } catch (erro) {
    if (erro instanceof ErroAutorizacao) return { status: "erro", mensagem: erro.message };
    throw erro;
  }

  const dados = excluirAnaliseSchema.safeParse({
    id: formData.get("id"),
    clienteId: formData.get("clienteId"),
    confirmarExclusao: formData.get("confirmarExclusao"),
  });

  if (!dados.success) return erroDeValidacao(dados.error);

  // WHERE amarrado ao cliente: id de outro cliente não encontra linha em vez de apagar às cegas.
  await db
    .delete(analiseClinica)
    .where(
      and(eq(analiseClinica.id, dados.data.id), eq(analiseClinica.clienteId, dados.data.clienteId)),
    );

  revalidatePath(`/painel/clientes/${dados.data.clienteId}`);

  return { status: "sucesso", mensagem: "Análise removida." };
}
