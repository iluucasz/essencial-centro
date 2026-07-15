"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { criarLancamentoSchema, lancamentoFinanceiro } from "./schema";

export type EstadoFormularioLancamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioLancamento = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

export async function criarLancamento(
  _: EstadoFormularioLancamento = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarLancamentoSchema.safeParse({
    tipo: getValor(formData, "tipo"),
    categoria: getValor(formData, "categoria"),
    descricao: getValor(formData, "descricao"),
    valorCentavos: getValor(formData, "valor"),
    data: getValor(formData, "data"),
    formaPagamento: getValor(formData, "formaPagamento"),
    situacao: getValor(formData, "situacao"),
    clienteId: getValor(formData, "clienteId"),
    pacoteId: getValor(formData, "pacoteId"),
  });

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
