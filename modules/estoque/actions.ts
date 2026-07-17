"use server";

import { revalidatePath } from "next/cache";
import { eq, sum } from "drizzle-orm";
import { z } from "zod";

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
const produtoIdSchema = z.string().uuid("Produto inválido.");

export type EstadoExclusaoEstoque = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

const estadoInicialExclusao: EstadoExclusaoEstoque = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function checkboxAtivo(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function parseFormularioProduto(formData: FormData) {
  return criarProdutoSchema.safeParse({
    nome: getValor(formData, "nome"),
    unidade: getValor(formData, "unidade"),
    estoqueMinimo: getValor(formData, "estoqueMinimo"),
  });
}

export async function criarProduto(_: EstadoFormularioEstoque = estadoInicial, formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = parseFormularioProduto(formData);

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

export async function atualizarProduto(
  _: EstadoFormularioEstoque = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);
  const produtoId = produtoIdSchema.safeParse(getValor(formData, "id"));
  const parsed = parseFormularioProduto(formData);

  if (!produtoId.success) {
    return {
      status: "erro",
      mensagem: "Produto inválido.",
      campos: { id: produtoId.error.flatten().formErrors },
    } satisfies EstadoFormularioEstoque;
  }

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do produto.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioEstoque;
  }

  const atualizados = await db
    .update(produto)
    .set({
      ...parsed.data,
      ativo: checkboxAtivo(getValor(formData, "ativo")),
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
    })
    .where(eq(produto.id, produtoId.data))
    .returning({ id: produto.id });

  if (atualizados.length === 0) {
    return {
      status: "erro",
      mensagem: "Produto não encontrado.",
    } satisfies EstadoFormularioEstoque;
  }

  revalidatePath("/painel/estoque");
  revalidatePath(`/painel/estoque/${produtoId.data}`);

  return {
    status: "sucesso",
    mensagem: "Produto atualizado com sucesso.",
  } satisfies EstadoFormularioEstoque;
}

export async function excluirProduto(
  _: EstadoExclusaoEstoque = estadoInicialExclusao,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional"]);
  const produtoId = produtoIdSchema.safeParse(getValor(formData, "produtoId"));
  const exclusaoConfirmada = checkboxAtivo(getValor(formData, "confirmarExclusao"));

  if (!produtoId.success) {
    return {
      status: "erro",
      mensagem: "Produto inválido.",
    } satisfies EstadoExclusaoEstoque;
  }

  if (!exclusaoConfirmada) {
    return {
      status: "erro",
      mensagem: "Confirme que entende a exclusão antes de continuar.",
    } satisfies EstadoExclusaoEstoque;
  }

  try {
    const excluidos = await db
      .delete(produto)
      .where(eq(produto.id, produtoId.data))
      .returning({ id: produto.id });

    if (excluidos.length === 0) {
      return {
        status: "erro",
        mensagem: "Produto não encontrado.",
      } satisfies EstadoExclusaoEstoque;
    }
  } catch {
    return {
      status: "erro",
      mensagem:
        "Não foi possível excluir este produto porque ele pode estar vinculado a lotes ou movimentações de estoque.",
    } satisfies EstadoExclusaoEstoque;
  }

  revalidatePath("/painel/estoque");

  return {
    status: "sucesso",
    mensagem: "Produto excluído com sucesso.",
  } satisfies EstadoExclusaoEstoque;
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
