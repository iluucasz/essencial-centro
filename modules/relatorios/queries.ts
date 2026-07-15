import { auth } from "@/auth";
import { listarAgendamentosNoPeriodo } from "@/modules/agenda/queries";
import { autorizarPapel } from "@/modules/auth/rbac";
import { listarClientes } from "@/modules/clientes/queries";
import { listarLancamentos } from "@/modules/financeiro/queries";
import { calcularResumoFinanceiro } from "@/modules/financeiro/resumo";

import {
  calcularRankingServicos,
  calcularTaxaComparecimento,
  contarAgendamentosPorStatus,
  contarClientesNovos,
} from "./resumo";

export async function obterRelatorioPeriodo(inicio: Date, fim: Date) {
  autorizarPapel(await auth(), ["profissional"]);

  const [agendamentos, lancamentos, clientes] = await Promise.all([
    listarAgendamentosNoPeriodo(inicio, fim),
    listarLancamentos({ inicio, fim }),
    listarClientes(),
  ]);

  const agendamentosPorStatus = contarAgendamentosPorStatus(agendamentos);

  return {
    financeiro: calcularResumoFinanceiro(lancamentos),
    agendamentosPorStatus,
    taxaComparecimento: calcularTaxaComparecimento(
      agendamentosPorStatus.realizado,
      agendamentosPorStatus.falta,
    ),
    rankingServicos: calcularRankingServicos(agendamentos),
    clientesNovos: contarClientesNovos(clientes, inicio, fim),
  };
}
