import { and, desc, eq, gte, lte } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";

import { lancamentoFinanceiro } from "./schema";

export async function listarLancamentos(periodo?: { inicio: Date; fim: Date }) {
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
      clienteNome: cliente.nome,
    })
    .from(lancamentoFinanceiro)
    .leftJoin(cliente, eq(cliente.id, lancamentoFinanceiro.clienteId))
    .where(
      periodo
        ? and(
            gte(lancamentoFinanceiro.data, periodo.inicio),
            lte(lancamentoFinanceiro.data, periodo.fim),
          )
        : undefined,
    )
    .orderBy(desc(lancamentoFinanceiro.data));
}
