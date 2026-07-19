import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";

import { lancamentoFinanceiro } from "./schema";
import type {
  CategoriaLancamento,
  FormaPagamentoLancamento,
  SituacaoLancamento,
  TipoLancamento,
} from "./schema";

export type FiltrosLancamentos = {
  busca?: string;
  categoria?: CategoriaLancamento;
  clienteId?: string;
  formaPagamento?: FormaPagamentoLancamento;
  periodo?: { inicio: Date; fim: Date };
  situacao?: SituacaoLancamento;
  tipo?: TipoLancamento;
};

function montarCondicoesLancamento(filtros?: FiltrosLancamentos) {
  const termo = filtros?.busca?.trim();

  const condicoes = [
    termo
      ? or(ilike(lancamentoFinanceiro.descricao, `%${termo}%`), ilike(cliente.nome, `%${termo}%`))
      : undefined,
    filtros?.tipo ? eq(lancamentoFinanceiro.tipo, filtros.tipo) : undefined,
    filtros?.categoria ? eq(lancamentoFinanceiro.categoria, filtros.categoria) : undefined,
    filtros?.situacao ? eq(lancamentoFinanceiro.situacao, filtros.situacao) : undefined,
    filtros?.formaPagamento
      ? eq(lancamentoFinanceiro.formaPagamento, filtros.formaPagamento)
      : undefined,
    filtros?.clienteId ? eq(lancamentoFinanceiro.clienteId, filtros.clienteId) : undefined,
    filtros?.periodo ? gte(lancamentoFinanceiro.data, filtros.periodo.inicio) : undefined,
    filtros?.periodo ? lte(lancamentoFinanceiro.data, filtros.periodo.fim) : undefined,
  ].filter((condicao) => condicao !== undefined);

  return condicoes.length > 0 ? and(...condicoes) : undefined;
}

export async function listarLancamentos(filtros?: FiltrosLancamentos) {
  autorizarPapel(await auth(), ["profissional"]);

  return db
    .select({
      id: lancamentoFinanceiro.id,
      tipo: lancamentoFinanceiro.tipo,
      categoria: lancamentoFinanceiro.categoria,
      descricao: lancamentoFinanceiro.descricao,
      valorCentavos: lancamentoFinanceiro.valorCentavos,
      data: lancamentoFinanceiro.data,
      formaPagamento: lancamentoFinanceiro.formaPagamento,
      situacao: lancamentoFinanceiro.situacao,
      clienteId: lancamentoFinanceiro.clienteId,
      pacoteId: lancamentoFinanceiro.pacoteId,
      clienteNome: cliente.nome,
    })
    .from(lancamentoFinanceiro)
    .leftJoin(cliente, eq(cliente.id, lancamentoFinanceiro.clienteId))
    .where(montarCondicoesLancamento(filtros))
    .orderBy(desc(lancamentoFinanceiro.data));
}
