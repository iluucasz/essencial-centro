import { asc, desc, eq, sum } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import {
  calcularQuantidadeDisponivel,
  calcularStatusValidade,
  deveAvisarEstoqueBaixo,
} from "./disponibilidade";
import { lote, movimentacaoEstoque, produto } from "./schema";

export async function listarProdutos() {
  autorizarPapel(await auth(), ["profissional"]);

  const [produtos, lotes, saidas] = await Promise.all([
    db.select().from(produto).orderBy(asc(produto.nome)),
    db
      .select({ id: lote.id, produtoId: lote.produtoId, quantidadeInicial: lote.quantidadeInicial })
      .from(lote),
    db
      .select({ loteId: movimentacaoEstoque.loteId, total: sum(movimentacaoEstoque.quantidade) })
      .from(movimentacaoEstoque)
      .groupBy(movimentacaoEstoque.loteId),
  ]);

  const saidaPorLote = new Map(saidas.map((s) => [s.loteId, Number(s.total ?? 0)]));

  const inicialPorProduto = new Map<string, number>();
  const saidaPorProduto = new Map<string, number>();

  for (const l of lotes) {
    inicialPorProduto.set(
      l.produtoId,
      (inicialPorProduto.get(l.produtoId) ?? 0) + l.quantidadeInicial,
    );
    saidaPorProduto.set(
      l.produtoId,
      (saidaPorProduto.get(l.produtoId) ?? 0) + (saidaPorLote.get(l.id) ?? 0),
    );
  }

  return produtos.map((p) => {
    const disponivel = calcularQuantidadeDisponivel(
      inicialPorProduto.get(p.id) ?? 0,
      saidaPorProduto.get(p.id) ?? 0,
    );

    return {
      ...p,
      disponivel,
      avisoEstoqueBaixo: deveAvisarEstoqueBaixo(disponivel, p.estoqueMinimo),
    };
  });
}

/** KPI do painel principal — conta lotes com estoque disponível que já venceram ou vencem nos
 * próximos 30 dias (mesmo limiar de `calcularStatusValidade`). Lote zerado não conta: não há mais
 * o que descartar/alertar sobre ele. */
export async function contarLotesProximosDoVencimento() {
  autorizarPapel(await auth(), ["profissional"]);

  const [lotes, saidas] = await Promise.all([
    db
      .select({ id: lote.id, quantidadeInicial: lote.quantidadeInicial, validade: lote.validade })
      .from(lote),
    db
      .select({ loteId: movimentacaoEstoque.loteId, total: sum(movimentacaoEstoque.quantidade) })
      .from(movimentacaoEstoque)
      .groupBy(movimentacaoEstoque.loteId),
  ]);

  const saidaPorLote = new Map(saidas.map((s) => [s.loteId, Number(s.total ?? 0)]));

  return lotes.filter((l) => {
    const disponivel = calcularQuantidadeDisponivel(
      l.quantidadeInicial,
      saidaPorLote.get(l.id) ?? 0,
    );
    if (disponivel <= 0) return false;

    const status = calcularStatusValidade(l.validade);
    return status === "vencido" || status === "proximo_vencimento";
  }).length;
}

export async function listarProdutosParaSelecao() {
  autorizarPapel(await auth(), ["profissional"]);

  return db
    .select({ id: produto.id, nome: produto.nome, unidade: produto.unidade })
    .from(produto)
    .where(eq(produto.ativo, true))
    .orderBy(asc(produto.nome));
}

export async function obterProduto(id: string) {
  autorizarPapel(await auth(), ["profissional"]);

  const [registro] = await db.select().from(produto).where(eq(produto.id, id)).limit(1);

  return registro ?? null;
}

export async function listarLotesDoProduto(produtoId: string) {
  autorizarPapel(await auth(), ["profissional"]);

  const [lotes, saidas] = await Promise.all([
    db.select().from(lote).where(eq(lote.produtoId, produtoId)).orderBy(desc(lote.criadoEm)),
    db
      .select({ loteId: movimentacaoEstoque.loteId, total: sum(movimentacaoEstoque.quantidade) })
      .from(movimentacaoEstoque)
      .innerJoin(lote, eq(lote.id, movimentacaoEstoque.loteId))
      .where(eq(lote.produtoId, produtoId))
      .groupBy(movimentacaoEstoque.loteId),
  ]);

  const saidaPorLote = new Map(saidas.map((s) => [s.loteId, Number(s.total ?? 0)]));

  return lotes.map((l) => ({
    ...l,
    disponivel: calcularQuantidadeDisponivel(l.quantidadeInicial, saidaPorLote.get(l.id) ?? 0),
  }));
}
