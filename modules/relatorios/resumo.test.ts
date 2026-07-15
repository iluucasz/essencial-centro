import { describe, expect, it } from "vitest";

import {
  calcularRankingServicos,
  calcularTaxaComparecimento,
  contarAgendamentosPorStatus,
  contarClientesNovos,
} from "./resumo";

describe("contarAgendamentosPorStatus", () => {
  it("conta cada status corretamente", () => {
    const contagem = contarAgendamentosPorStatus([
      { status: "realizado" },
      { status: "realizado" },
      { status: "falta" },
      { status: "cancelado" },
      { status: "marcado" },
    ]);

    expect(contagem).toEqual({ marcado: 1, realizado: 2, falta: 1, cancelado: 1 });
  });

  it("retorna tudo zerado para uma lista vazia", () => {
    expect(contarAgendamentosPorStatus([])).toEqual({
      marcado: 0,
      realizado: 0,
      falta: 0,
      cancelado: 0,
    });
  });
});

describe("calcularTaxaComparecimento", () => {
  it("calcula o percentual de comparecimento", () => {
    expect(calcularTaxaComparecimento(8, 2)).toBe(80);
  });

  it("retorna 0 quando não há realizados nem faltas", () => {
    expect(calcularTaxaComparecimento(0, 0)).toBe(0);
  });

  it("retorna 100 quando não houve faltas", () => {
    expect(calcularTaxaComparecimento(5, 0)).toBe(100);
  });
});

describe("calcularRankingServicos", () => {
  it("ordena serviços por quantidade de atendimentos realizados", () => {
    const ranking = calcularRankingServicos([
      { servicoNome: "Massagem", status: "realizado" },
      { servicoNome: "Drenagem", status: "realizado" },
      { servicoNome: "Massagem", status: "realizado" },
      { servicoNome: "Massagem", status: "falta" },
      { servicoNome: "Drenagem", status: "cancelado" },
    ]);

    expect(ranking).toEqual([
      { servicoNome: "Massagem", total: 2 },
      { servicoNome: "Drenagem", total: 1 },
    ]);
  });

  it("ignora agendamentos que não foram realizados", () => {
    const ranking = calcularRankingServicos([
      { servicoNome: "Massagem", status: "marcado" },
      { servicoNome: "Massagem", status: "cancelado" },
    ]);

    expect(ranking).toEqual([]);
  });
});

describe("contarClientesNovos", () => {
  it("conta apenas clientes criados dentro do período", () => {
    const total = contarClientesNovos(
      [
        { criadoEm: new Date("2026-01-05T00:00:00.000Z") },
        { criadoEm: new Date("2026-01-15T00:00:00.000Z") },
        { criadoEm: new Date("2025-12-31T00:00:00.000Z") },
      ],
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2026-01-31T23:59:59.999Z"),
    );

    expect(total).toBe(2);
  });
});
