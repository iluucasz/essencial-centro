import { describe, expect, it } from "vitest";

import { precisaLembreteDiaAnterior, precisaLembreteHorasAntes } from "./lembretes";

const agora = new Date("2026-07-15T12:00:00.000Z");

function horasDepois(horas: number) {
  return new Date(agora.getTime() + horas * 60 * 60 * 1000);
}

describe("precisaLembreteDiaAnterior", () => {
  it("dispara quando o atendimento é amanhã (dia de calendário) e ainda não foi enviado", () => {
    // agora = 15/07 12:00Z; +20h = 16/07 08:00Z — dia seguinte de verdade.
    expect(
      precisaLembreteDiaAnterior(
        { status: "marcado", inicio: horasDepois(20), lembreteDiaAnteriorEm: null },
        agora,
      ),
    ).toBe(true);
  });

  it("NÃO dispara pra atendimento mais tarde no MESMO dia, mesmo dentro de 24h", () => {
    // Regressão: atendimento marcado pra hoje à noite recebia "Lembrete: atendimento amanhã"
    // mesmo sendo hoje — a janela antiga era só uma faixa de horas (0-24h), não dia de calendário.
    // agora = 15/07 12:00Z; +8h = 15/07 20:00Z — mesmo dia 15/07, só 8h de distância.
    expect(
      precisaLembreteDiaAnterior(
        { status: "marcado", inicio: horasDepois(8), lembreteDiaAnteriorEm: null },
        agora,
      ),
    ).toBe(false);
  });

  it("não dispara de novo se já foi enviado", () => {
    expect(
      precisaLembreteDiaAnterior(
        { status: "marcado", inicio: horasDepois(20), lembreteDiaAnteriorEm: agora },
        agora,
      ),
    ).toBe(false);
  });

  it("não dispara para agendamento dois dias ou mais à frente", () => {
    expect(
      precisaLembreteDiaAnterior(
        { status: "marcado", inicio: horasDepois(48), lembreteDiaAnteriorEm: null },
        agora,
      ),
    ).toBe(false);
  });

  it("não dispara para agendamento que já passou", () => {
    expect(
      precisaLembreteDiaAnterior(
        { status: "marcado", inicio: horasDepois(-1), lembreteDiaAnteriorEm: null },
        agora,
      ),
    ).toBe(false);
  });

  it("não dispara para agendamento cancelado/realizado/falta", () => {
    expect(
      precisaLembreteDiaAnterior(
        { status: "cancelado", inicio: horasDepois(20), lembreteDiaAnteriorEm: null },
        agora,
      ),
    ).toBe(false);
  });

  it("respeita a virada do dia mesmo com pouquíssimas horas de distância", () => {
    // agora = 15/07 23:50Z (10min antes da virada); +20min = 16/07 00:10Z — já é amanhã de verdade.
    const quaseMeiaNoite = new Date("2026-07-15T23:50:00.000Z");
    const logoApósAMeiaNoite = new Date("2026-07-16T00:10:00.000Z");

    expect(
      precisaLembreteDiaAnterior(
        { status: "marcado", inicio: logoApósAMeiaNoite, lembreteDiaAnteriorEm: null },
        quaseMeiaNoite,
      ),
    ).toBe(true);
  });
});

describe("precisaLembreteHorasAntes", () => {
  it("dispara quando faltam até 3h e ainda não foi enviado", () => {
    expect(
      precisaLembreteHorasAntes(
        { status: "marcado", inicio: horasDepois(2), lembreteHorasAntesEm: null },
        agora,
      ),
    ).toBe(true);
  });

  it("não dispara de novo se já foi enviado", () => {
    expect(
      precisaLembreteHorasAntes(
        { status: "marcado", inicio: horasDepois(2), lembreteHorasAntesEm: agora },
        agora,
      ),
    ).toBe(false);
  });

  it("não dispara para agendamento a mais de 3h de distância", () => {
    expect(
      precisaLembreteHorasAntes(
        { status: "marcado", inicio: horasDepois(10), lembreteHorasAntesEm: null },
        agora,
      ),
    ).toBe(false);
  });
});
