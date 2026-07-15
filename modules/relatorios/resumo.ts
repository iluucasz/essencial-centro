import type { StatusAgendamento } from "@/modules/agenda/schema";

export type ContagemPorStatus = Record<StatusAgendamento, number>;

export function contarAgendamentosPorStatus(
  agendamentos: { status: StatusAgendamento }[],
): ContagemPorStatus {
  const contagem: ContagemPorStatus = { marcado: 0, realizado: 0, falta: 0, cancelado: 0 };

  for (const agendamento of agendamentos) {
    contagem[agendamento.status] += 1;
  }

  return contagem;
}

export function calcularTaxaComparecimento(realizados: number, faltas: number) {
  const total = realizados + faltas;

  return total === 0 ? 0 : Math.round((realizados / total) * 100);
}

export type RankingServico = { servicoNome: string; total: number };

export function calcularRankingServicos(
  agendamentos: { servicoNome: string; status: StatusAgendamento }[],
): RankingServico[] {
  const contagem = new Map<string, number>();

  for (const agendamento of agendamentos) {
    if (agendamento.status !== "realizado") continue;

    contagem.set(agendamento.servicoNome, (contagem.get(agendamento.servicoNome) ?? 0) + 1);
  }

  return [...contagem.entries()]
    .map(([servicoNome, total]) => ({ servicoNome, total }))
    .sort((a, b) => b.total - a.total);
}

export function contarClientesNovos(clientes: { criadoEm: Date }[], inicio: Date, fim: Date) {
  return clientes.filter((cliente) => cliente.criadoEm >= inicio && cliente.criadoEm <= fim).length;
}
