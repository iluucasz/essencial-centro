import { describe, expect, it } from "vitest";

import { agruparAgendamentosPorDia } from "./tendencia";

describe("agruparAgendamentosPorDia", () => {
  const hoje = new Date("2026-07-15T12:00:00.000Z");

  it("preenche todos os dias do período, incluindo os sem agendamento", () => {
    const pontos = agruparAgendamentosPorDia([], 3, hoje);

    expect(pontos).toEqual([
      { data: "2026-07-13", total: 0 },
      { data: "2026-07-14", total: 0 },
      { data: "2026-07-15", total: 0 },
    ]);
  });

  it("conta agendamentos do mesmo dia juntos", () => {
    const pontos = agruparAgendamentosPorDia(
      [
        { inicio: new Date("2026-07-14T09:00:00.000Z") },
        { inicio: new Date("2026-07-14T15:00:00.000Z") },
        { inicio: new Date("2026-07-15T10:00:00.000Z") },
      ],
      3,
      hoje,
    );

    expect(pontos).toEqual([
      { data: "2026-07-13", total: 0 },
      { data: "2026-07-14", total: 2 },
      { data: "2026-07-15", total: 1 },
    ]);
  });

  it("ignora agendamentos fora do período pedido", () => {
    const pontos = agruparAgendamentosPorDia(
      [{ inicio: new Date("2026-06-01T09:00:00.000Z") }],
      3,
      hoje,
    );

    expect(pontos.every((ponto) => ponto.total === 0)).toBe(true);
  });
});
