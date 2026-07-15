"use server";

import { revalidatePath } from "next/cache";
import { eq, sum } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { calcularQuantidadeDisponivel } from "./disponibilidade";
import {
  criarLoteSchema,
  criarProdutoSchema,
  lote,
  movimentacaoEstoque,
  produto,
  registrarSaidaSchema,
} from "./schema";

export type EstadoFormularioEstoque = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioEstoque = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

export async function criarProduto(_: EstadoFormularioEstoque = estadoInicial, formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarProdutoSchema.safeParse({
    nome: getValor(formData, "nome"),
    unidade: getValor(formData, "unidade"),
    estoqueMinimo: getValor(formData, "estoqueMinimo"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do produto.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioEstoque;
  }

  await db.insert(produto).values({
    ...parsed.data,
    criadoPorId: usuarioAtual.id,
    atualizadoPorId: usuarioAtual.id,
  });

  revalidatePath("/painel/estoque");

  return {
    status: "sucesso",
    mensagem: "Produto cadastrado com sucesso.",
  } satisfies EstadoFormularioEstoque;
}

export async function criarLote(_: EstadoFormularioEstoque = estadoInicial, formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarLoteSchema.safeParse({
    produtoId: getValor(formData, "produtoId"),
    numeroLote: getValor(formData, "numeroLote"),
    quantidadeInicial: getValor(formData, "quantidadeInicial"),
    validade: getValor(formData, "validade"),
    custoCentavos: getValor(formData, "custo"),
    fornecedor: getValor(formData, "fornecedor"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do lote.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioEstoque;
  }

  await db.insert(lote).values({
    ...parsed.data,
    criadoPorId: usuarioAtual.id,
  });

  revalidatePath("/painel/estoque");
  revalidatePath(`/painel/estoque/${parsed.data.produtoId}`);

  return {
    status: "sucesso",
    mensagem: "Lote registrado com sucesso.",
  } satisfies EstadoFormularioEstoque;
}

export async function registrarSaida(
  _: EstadoFormularioEstoque = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = registrarSaidaSchema.safeParse({
    loteId: getValor(formData, "loteId"),
    quantidade: getValor(formData, "quantidade"),
    motivo: getValor(formData, "motivo"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da saída.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioEstoque;
  }

  const [registroLote] = await db
    .select({ id: lote.id, produtoId: lote.produtoId, quantidadeInicial: lote.quantidadeInicial })
    .from(lote)
    .where(eq(lote.id, parsed.data.loteId))
    .limit(1);

  if (!registroLote) {
    return { status: "erro", mensagem: "Lote não encontrado." } satisfies EstadoFormularioEstoque;
  }

  const [{ total }] = await db
    .select({ total: sum(movimentacaoEstoque.quantidade) })
    .from(movimentacaoEstoque)
    .where(eq(movimentacaoEstoque.loteId, parsed.data.loteId));

  const disponivel = calcularQuantidadeDisponivel(
    registroLote.quantidadeInicial,
    Number(total ?? 0),
  );

  if (parsed.data.quantidade > disponivel) {
    return {
      status: "erro",
      mensagem: `Só há ${disponivel} unidade${disponivel === 1 ? "" : "s"} disponível${disponivel === 1 ? "" : "eis"} nesse lote.`,
    } satisfies EstadoFormularioEstoque;
  }

  await db.insert(movimentacaoEstoque).values({
    loteId: parsed.data.loteId,
    quantidade: parsed.data.quantidade,
    motivo: parsed.data.motivo,
    criadoPorId: usuarioAtual.id,
  });

  revalidatePath("/painel/estoque");
  revalidatePath(`/painel/estoque/${registroLote.produtoId}`);

  return {
    status: "sucesso",
    mensagem: "Saída registrada com sucesso.",
  } satisfies EstadoFormularioEstoque;
}
