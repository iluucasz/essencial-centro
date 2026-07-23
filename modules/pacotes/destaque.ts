type PacoteBaseDestaque = {
  ativo: boolean;
  id: string;
};

type AgendamentoBaseDestaque = {
  inicio: Date;
  pacoteId: string | null;
  status: string;
};

function encontrarProximaSessao(
  agendamentos: readonly AgendamentoBaseDestaque[],
  pacoteId: string,
  agora: Date,
) {
  return (
    agendamentos
      .filter(
        (agendamento) =>
          agendamento.pacoteId === pacoteId &&
          agendamento.status === "marcado" &&
          agendamento.inicio >= agora,
      )
      .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())[0]?.inicio ?? null
  );
}

export function montarPacotesEmDestaque<TPacote extends PacoteBaseDestaque>(
  pacotes: readonly TPacote[],
  agendamentos: readonly AgendamentoBaseDestaque[],
  agora: Date,
) {
  return pacotes
    .filter((pacote) => pacote.ativo)
    .map((pacote) => ({
      ...pacote,
      proximaSessao: encontrarProximaSessao(agendamentos, pacote.id, agora),
    }));
}
