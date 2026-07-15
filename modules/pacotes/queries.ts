import { and, count, desc, eq, isNotNull } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { agendamento } from "@/modules/agenda/schema";
import { autorizarPapel } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";
import { servico } from "@/modules/servicos/schema";

import { calcularProgressoPacote } from "./progresso";
import { pacote } from "./schema";

export async function listarPacotes() {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const [pacotes, realizadosPorPacote] = await Promise.all([
    db
      .select({
        id: pacote.id,
        quantidadeSessoes: pacote.quantidadeSessoes,
        validade: pacote.validade,
        valorCentavos: pacote.valorCentavos,
        situacaoPagamento: pacote.situacaoPagamento,
        ativo: pacote.ativo,
        clienteNome: cliente.nome,
        servicoNome: servico.nome,
      })
      .from(pacote)
      .innerJoin(cliente, eq(cliente.id, pacote.clienteId))
      .innerJoin(servico, eq(servico.id, pacote.servicoId))
      .orderBy(desc(pacote.criadoEm)),
    db
      .select({ pacoteId: agendamento.pacoteId, realizados: count() })
      .from(agendamento)
      .where(and(isNotNull(agendamento.pacoteId), eq(agendamento.status, "realizado")))
      .groupBy(agendamento.pacoteId),
  ]);

  const realizadosPorId = new Map(realizadosPorPacote.map((r) => [r.pacoteId, r.realizados]));

  return pacotes.map((p) => ({
    ...p,
    progresso: calcularProgressoPacote(p.quantidadeSessoes, realizadosPorId.get(p.id) ?? 0),
  }));
}

/** Opções simples para seletores (ex.: vincular um agendamento a um pacote). */
export async function listarPacotesParaSelecao() {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  return db
    .select({
      id: pacote.id,
      clienteNome: cliente.nome,
      servicoNome: servico.nome,
    })
    .from(pacote)
    .innerJoin(cliente, eq(cliente.id, pacote.clienteId))
    .innerJoin(servico, eq(servico.id, pacote.servicoId))
    .where(eq(pacote.ativo, true))
    .orderBy(desc(pacote.criadoEm));
}
