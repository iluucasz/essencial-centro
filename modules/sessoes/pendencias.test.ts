import { describe, expect, it } from "vitest";

import { filtrarAgendamentosRealizadosSemSessao } from "./pendencias";

describe("filtrarAgendamentosRealizadosSemSessao", () => {
  it("lista apenas atendimentos realizados que ainda nao possuem sessao vinculada", () => {
    const agendamentos = [
      { id: "agendamento-realizado-pendente", status: "realizado" },
      { id: "agendamento-realizado-com-sessao", status: "realizado" },
      { id: "agendamento-marcado", status: "marcado" },
      { id: "agendamento-falta", status: "falta" },
      { id: "agendamento-cancelado", status: "cancelado" },
    ];

    const sessoes = [{ agendamentoId: "agendamento-realizado-com-sessao" }];

    expect(filtrarAgendamentosRealizadosSemSessao(agendamentos, sessoes)).toEqual([
      { id: "agendamento-realizado-pendente", status: "realizado" },
    ]);
  });
});
