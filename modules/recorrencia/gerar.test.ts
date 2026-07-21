import { describe, expect, it } from "vitest";

import { gerarOcorrencias, ocorrenciasEmConflito } from "./gerar";

function iso(data: Date) {
  return data.toISOString();
}

describe("gerarOcorrencias — semanal", () => {
  it("gera as próximas N ocorrências no mesmo dia da semana e horário", () => {
    // 2026-01-05 é uma segunda-feira.
    const datas = gerarOcorrencias({
      frequencia: "semanal",
      diaSemana: 1,
      diaDoMes: null,
      hora: 14,
      minuto: 30,
      dataInicio: new Date(Date.UTC(2026, 0, 5)),
      quantidade: 3,
    });

    expect(datas.map(iso)).toEqual([
      "2026-01-05T14:30:00.000Z",
      "2026-01-12T14:30:00.000Z",
      "2026-01-19T14:30:00.000Z",
    ]);
  });

  it("avança até o primeiro dia da semana alvo quando a data de início não bate", () => {
    // 2026-01-05 é segunda; alvo é quarta (3) → primeira ocorrência em 2026-01-07.
    const datas = gerarOcorrencias({
      frequencia: "semanal",
      diaSemana: 3,
      diaDoMes: null,
      hora: 9,
      minuto: 0,
      dataInicio: new Date(Date.UTC(2026, 0, 5)),
      quantidade: 2,
    });

    expect(datas.map(iso)).toEqual(["2026-01-07T09:00:00.000Z", "2026-01-14T09:00:00.000Z"]);
  });
});

describe("gerarOcorrencias — mensal", () => {
  it("gera o mesmo dia em meses consecutivos", () => {
    const datas = gerarOcorrencias({
      frequencia: "mensal",
      diaSemana: null,
      diaDoMes: 15,
      hora: 10,
      minuto: 0,
      dataInicio: new Date(Date.UTC(2026, 0, 1)),
      quantidade: 3,
    });

    expect(datas.map(iso)).toEqual([
      "2026-01-15T10:00:00.000Z",
      "2026-02-15T10:00:00.000Z",
      "2026-03-15T10:00:00.000Z",
    ]);
  });

  it("começa no mês seguinte quando o dia alvo já passou no mês inicial", () => {
    const datas = gerarOcorrencias({
      frequencia: "mensal",
      diaSemana: null,
      diaDoMes: 10,
      hora: 8,
      minuto: 0,
      dataInicio: new Date(Date.UTC(2026, 0, 20)),
      quantidade: 1,
    });

    expect(datas.map(iso)).toEqual(["2026-02-10T08:00:00.000Z"]);
  });

  it("pula meses que não têm o dia alvo (ex.: 31)", () => {
    const datas = gerarOcorrencias({
      frequencia: "mensal",
      diaSemana: null,
      diaDoMes: 31,
      hora: 12,
      minuto: 0,
      dataInicio: new Date(Date.UTC(2026, 0, 1)),
      quantidade: 3,
    });

    // Fevereiro, abril e junho não têm dia 31 → são pulados.
    expect(datas.map(iso)).toEqual([
      "2026-01-31T12:00:00.000Z",
      "2026-03-31T12:00:00.000Z",
      "2026-05-31T12:00:00.000Z",
    ]);
  });
});

describe("gerarOcorrencias — casos de borda", () => {
  it("retorna vazio quando a quantidade é zero ou negativa", () => {
    expect(
      gerarOcorrencias({
        frequencia: "semanal",
        diaSemana: 1,
        diaDoMes: null,
        hora: 9,
        minuto: 0,
        dataInicio: new Date(Date.UTC(2026, 0, 5)),
        quantidade: 0,
      }),
    ).toEqual([]);
  });
});

describe("ocorrenciasEmConflito", () => {
  it("retorna as datas que se sobrepõem a agendamentos existentes", () => {
    const ocorrencias = [
      { inicio: new Date(Date.UTC(2026, 0, 5, 14, 0)), duracaoMinutos: 60 },
      { inicio: new Date(Date.UTC(2026, 0, 12, 14, 0)), duracaoMinutos: 60 },
    ];
    const existentes = [{ inicio: new Date(Date.UTC(2026, 0, 12, 14, 30)), duracaoMinutos: 30 }];

    expect(ocorrenciasEmConflito(ocorrencias, existentes).map(iso)).toEqual([
      "2026-01-12T14:00:00.000Z",
    ]);
  });

  it("retorna vazio quando nenhuma ocorrência conflita", () => {
    const ocorrencias = [{ inicio: new Date(Date.UTC(2026, 0, 5, 14, 0)), duracaoMinutos: 60 }];
    const existentes = [{ inicio: new Date(Date.UTC(2026, 0, 5, 16, 0)), duracaoMinutos: 60 }];

    expect(ocorrenciasEmConflito(ocorrencias, existentes)).toEqual([]);
  });
});
