import { and, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, lte, or } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { agendamento } from "@/modules/agenda/schema";
import { autorizarClienteDono, autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";
import { usuario } from "@/modules/auth/schema";
import { cliente } from "@/modules/clientes/schema";
import { lancamentoFinanceiro } from "@/modules/financeiro/schema";
import { sessao } from "@/modules/sessoes/schema";
import { servico } from "@/modules/servicos/schema";

import { calcularProgressoPacote } from "./progresso";
import { pacote, type SituacaoPagamento } from "./schema";

export type StatusAtivoPacoteFiltro = "ativos" | "inativos";
export type ValidadePacoteFiltro = "validos" | "vencidos" | "sem_validade";

export type FiltrosPacotes = {
  ativo?: StatusAtivoPacoteFiltro;
  busca?: string;
  clienteId?: string;
  servicoId?: string;
  situacaoPagamento?: SituacaoPagamento;
  validade?: ValidadePacoteFiltro;
};

function hojeUtc() {
  const hoje = new Date();

  return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()));
}

function montarCondicoesPacote(filtro?: FiltrosPacotes) {
  const termo = filtro?.busca?.trim();
  const hoje = hojeUtc();

  const condicoes = [
    termo
      ? or(
          ilike(cliente.nome, `%${termo}%`),
          ilike(servico.nome, `%${termo}%`),
          ilike(pacote.formaPagamento, `%${termo}%`),
        )
      : undefined,
    filtro?.clienteId ? eq(pacote.clienteId, filtro.clienteId) : undefined,
    filtro?.servicoId ? eq(pacote.servicoId, filtro.servicoId) : undefined,
    filtro?.situacaoPagamento ? eq(pacote.situacaoPagamento, filtro.situacaoPagamento) : undefined,
    filtro?.ativo === "ativos" ? eq(pacote.ativo, true) : undefined,
    filtro?.ativo === "inativos" ? eq(pacote.ativo, false) : undefined,
    filtro?.validade === "validos" ? gte(pacote.validade, hoje) : undefined,
    filtro?.validade === "vencidos" ? lte(pacote.validade, hoje) : undefined,
    filtro?.validade === "sem_validade" ? isNull(pacote.validade) : undefined,
  ].filter((condicao) => condicao !== undefined);

  return condicoes.length > 0 ? and(...condicoes) : undefined;
}

async function buscarPacotesComProgresso(filtro?: FiltrosPacotes) {
  const condicoes = montarCondicoesPacote(filtro);

  const [pacotes, realizadosPorPacote] = await Promise.all([
    db
      .select({
        id: pacote.id,
        clienteId: pacote.clienteId,
        servicoId: pacote.servicoId,
        quantidadeSessoes: pacote.quantidadeSessoes,
        dataContratacao: pacote.dataContratacao,
        validade: pacote.validade,
        valorCentavos: pacote.valorCentavos,
        formaPagamento: pacote.formaPagamento,
        situacaoPagamento: pacote.situacaoPagamento,
        ativo: pacote.ativo,
        clienteNome: cliente.nome,
        servicoNome: servico.nome,
      })
      .from(pacote)
      .innerJoin(cliente, eq(cliente.id, pacote.clienteId))
      .innerJoin(servico, eq(servico.id, pacote.servicoId))
      .where(condicoes)
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

export async function listarPacotes(clienteId?: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  return buscarPacotesComProgresso(clienteId ? { clienteId } : undefined);
}

export async function listarPacotesPainel(filtros?: FiltrosPacotes) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  return buscarPacotesComProgresso(filtros);
}

export async function listarPacotesPainelDetalhados(filtros?: FiltrosPacotes) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const pacotes = await buscarPacotesComProgresso(filtros);
  const ids = pacotes.map((p) => p.id);

  if (ids.length === 0) return [];

  const [agendamentos, sessoes, lancamentos] = await Promise.all([
    db
      .select({
        id: agendamento.id,
        pacoteId: agendamento.pacoteId,
        inicio: agendamento.inicio,
        duracaoMinutos: agendamento.duracaoMinutos,
        status: agendamento.status,
        modalidade: agendamento.modalidade,
        observacoes: agendamento.observacoes,
        checkinEm: agendamento.checkinEm,
        profissionalNome: usuario.name,
        profissionalEmail: usuario.email,
      })
      .from(agendamento)
      .leftJoin(usuario, eq(usuario.id, agendamento.profissionalId))
      .where(and(isNotNull(agendamento.pacoteId), inArray(agendamento.pacoteId, ids)))
      .orderBy(desc(agendamento.inicio)),
    db
      .select({
        id: sessao.id,
        pacoteId: sessao.pacoteId,
        agendamentoId: sessao.agendamentoId,
        dataHora: sessao.dataHora,
        duracaoMinutos: sessao.duracaoMinutos,
        regiaoTratada: sessao.regiaoTratada,
        presencaConfirmada: sessao.presencaConfirmada,
        proximaSessaoRecomendada: sessao.proximaSessaoRecomendada,
        servicoNome: servico.nome,
        profissionalNome: usuario.name,
        profissionalEmail: usuario.email,
      })
      .from(sessao)
      .innerJoin(servico, eq(servico.id, sessao.servicoId))
      .leftJoin(usuario, eq(usuario.id, sessao.profissionalId))
      .where(and(isNotNull(sessao.pacoteId), inArray(sessao.pacoteId, ids)))
      .orderBy(desc(sessao.dataHora)),
    db
      .select({
        id: lancamentoFinanceiro.id,
        pacoteId: lancamentoFinanceiro.pacoteId,
        tipo: lancamentoFinanceiro.tipo,
        categoria: lancamentoFinanceiro.categoria,
        descricao: lancamentoFinanceiro.descricao,
        valorCentavos: lancamentoFinanceiro.valorCentavos,
        data: lancamentoFinanceiro.data,
        formaPagamento: lancamentoFinanceiro.formaPagamento,
        situacao: lancamentoFinanceiro.situacao,
      })
      .from(lancamentoFinanceiro)
      .where(
        and(isNotNull(lancamentoFinanceiro.pacoteId), inArray(lancamentoFinanceiro.pacoteId, ids)),
      )
      .orderBy(desc(lancamentoFinanceiro.data)),
  ]);

  const agendamentosPorPacote = new Map<string, typeof agendamentos>();
  for (const agendamentoItem of agendamentos) {
    if (!agendamentoItem.pacoteId) continue;

    const lista = agendamentosPorPacote.get(agendamentoItem.pacoteId) ?? [];
    lista.push(agendamentoItem);
    agendamentosPorPacote.set(agendamentoItem.pacoteId, lista);
  }

  const sessoesPorPacote = new Map<string, typeof sessoes>();
  for (const sessaoItem of sessoes) {
    if (!sessaoItem.pacoteId) continue;

    const lista = sessoesPorPacote.get(sessaoItem.pacoteId) ?? [];
    lista.push(sessaoItem);
    sessoesPorPacote.set(sessaoItem.pacoteId, lista);
  }

  const lancamentosPorPacote = new Map<string, typeof lancamentos>();
  for (const lancamento of lancamentos) {
    if (!lancamento.pacoteId) continue;

    const lista = lancamentosPorPacote.get(lancamento.pacoteId) ?? [];
    lista.push(lancamento);
    lancamentosPorPacote.set(lancamento.pacoteId, lista);
  }

  return pacotes.map((pacoteItem) => ({
    ...pacoteItem,
    agendamentos: agendamentosPorPacote.get(pacoteItem.id) ?? [],
    sessoes: sessoesPorPacote.get(pacoteItem.id) ?? [],
    lancamentos: lancamentosPorPacote.get(pacoteItem.id) ?? [],
  }));
}

export async function listarPacotesDoCliente(clienteId: string) {
  return listarPacotes(clienteId);
}

/** Usado pela página de detalhe do serviço — todos os pacotes já contratados dele. */
export async function listarPacotesDoServico(servicoId: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  return buscarPacotesComProgresso({ servicoId });
}

/** Sessões contratadas/restantes do próprio cliente — dado explicitamente visível no portal. */
export async function listarMeusPacotes() {
  const sessaoAuth = await auth();
  const usuario = autorizarPapel(sessaoAuth, ["cliente"]);

  if (!usuario.clienteId) {
    throw new ErroAutorizacao(
      "Seu usuário ainda não está vinculado a um cadastro de cliente.",
      403,
    );
  }

  autorizarClienteDono(sessaoAuth, usuario.clienteId);

  return buscarPacotesComProgresso({ clienteId: usuario.clienteId });
}

/**
 * Progresso de UM pacote — usado internamente (ex.: ao concluir um agendamento, para avisar o
 * cliente quando o pacote está acabando). Sem checagem de role própria.
 */
export async function obterProgressoPacote(pacoteId: string) {
  const [registro] = await db
    .select({ quantidadeSessoes: pacote.quantidadeSessoes, clienteId: pacote.clienteId })
    .from(pacote)
    .where(eq(pacote.id, pacoteId))
    .limit(1);

  if (!registro) return null;

  const [{ realizados }] = await db
    .select({ realizados: count() })
    .from(agendamento)
    .where(and(eq(agendamento.pacoteId, pacoteId), eq(agendamento.status, "realizado")));

  return {
    clienteId: registro.clienteId,
    progresso: calcularProgressoPacote(registro.quantidadeSessoes, realizados),
  };
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
