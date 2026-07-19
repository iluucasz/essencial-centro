"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import {
  atualizarLancamentoSchema,
  criarLancamentoSchema,
  lancamentoFinanceiro,
  situacoesLancamento,
} from "./schema";

export type EstadoFormularioLancamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

export type EstadoExclusaoLancamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

const estadoInicial: EstadoFormularioLancamento = { status: "inicial" };
const estadoInicialExclusao: EstadoExclusaoLancamento = { status: "inicial" };
const lancamentoIdSchema = z.string().uuid("Lançamento inválido.");
const atualizarSituacaoSchema = z.object({
  id: lancamentoIdSchema,
  situacao: z.enum(situacoesLancamento),
});

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function parseFormularioLancamento(formData: FormData) {
  return {
    tipo: getValor(formData, "tipo"),
    categoria: getValor(formData, "categoria"),
    descricao: getValor(formData, "descricao"),
    valorCentavos: getValor(formData, "valor"),
    data: getValor(formData, "data"),
    formaPagamento: getValor(formData, "formaPagamento"),
    situacao: getValor(formData, "situacao"),
    clienteId: getValor(formData, "clienteId"),
    pacoteId: getValor(formData, "pacoteId"),
  };
}

export async function criarLancamento(
  _: EstadoFormularioLancamento = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarLancamentoSchema.safeParse(parseFormularioLancamento(formData));

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do lançamento.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioLancamento;
  }

  await db.insert(lancamentoFinanceiro).values({
    ...parsed.data,
    criadoPorId: usuarioAtual.id,
    atualizadoPorId: usuarioAtual.id,
  });

  revalidatePath("/painel/financeiro");

  return {
    status: "sucesso",
    mensagem: "Lançamento registrado com sucesso.",
  } satisfies EstadoFormularioLancamento;
}

export async function atualizarLancamento(
  _: EstadoFormularioLancamento = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = atualizarLancamentoSchema.safeParse({
    id: getValor(formData, "id"),
    ...parseFormularioLancamento(formData),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do lançamento.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioLancamento;
  }

  const { id, ...dados } = parsed.data;

  const atualizados = await db
    .update(lancamentoFinanceiro)
    .set({
      ...dados,
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
    })
    .where(eq(lancamentoFinanceiro.id, id))
    .returning({ id: lancamentoFinanceiro.id });

  if (atualizados.length === 0) {
    return {
      status: "erro",
      mensagem: "Lançamento não encontrado.",
    } satisfies EstadoFormularioLancamento;
  }

  revalidatePath("/painel/financeiro");

  return {
    status: "sucesso",
    mensagem: "Lançamento atualizado com sucesso.",
  } satisfies EstadoFormularioLancamento;
}

export async function atualizarSituacaoLancamento(formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = atualizarSituacaoSchema.safeParse({
    id: getValor(formData, "id"),
    situacao: getValor(formData, "situacao"),
  });

  if (!parsed.success) return;

  await db
    .update(lancamentoFinanceiro)
    .set({
      situacao: parsed.data.situacao,
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
    })
    .where(eq(lancamentoFinanceiro.id, parsed.data.id));

  revalidatePath("/painel/financeiro");
}

export async function excluirLancamento(
  _: EstadoExclusaoLancamento = estadoInicialExclusao,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional"]);

  const id = lancamentoIdSchema.safeParse(getValor(formData, "id"));
  const exclusaoConfirmada = getValor(formData, "confirmarExclusao");

  if (!id.success) {
    return {
      status: "erro",
      mensagem: "Lançamento inválido.",
    } satisfies EstadoExclusaoLancamento;
  }

  if (exclusaoConfirmada !== "true") {
    return {
      status: "erro",
      mensagem: "Confirme que entende a exclusão antes de continuar.",
    } satisfies EstadoExclusaoLancamento;
  }

  const excluidos = await db
    .delete(lancamentoFinanceiro)
    .where(eq(lancamentoFinanceiro.id, id.data))
    .returning({ id: lancamentoFinanceiro.id });

  if (excluidos.length === 0) {
    return {
      status: "erro",
      mensagem: "Lançamento não encontrado.",
    } satisfies EstadoExclusaoLancamento;
  }

  revalidatePath("/painel/financeiro");

  return {
    status: "sucesso",
    mensagem: "Lançamento excluído com sucesso.",
  } satisfies EstadoExclusaoLancamento;
}
