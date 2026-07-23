type AgendamentoComStatus = {
  id: string;
  status: string;
};

type SessaoComAgendamento = {
  agendamentoId: string | null;
};

export function filtrarAgendamentosRealizadosSemSessao<
  TAgendamento extends AgendamentoComStatus,
  TSessao extends SessaoComAgendamento,
>(agendamentos: TAgendamento[], sessoes: TSessao[]) {
  const agendamentosComSessao = new Set(
    sessoes.map((item) => item.agendamentoId).filter((id): id is string => Boolean(id)),
  );

  return agendamentos.filter(
    (agendamento) =>
      agendamento.status === "realizado" && !agendamentosComSessao.has(agendamento.id),
  );
}
