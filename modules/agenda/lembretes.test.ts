import { describe, expect, it } from "vitest";

import { precisaLembreteDiaAnterior, precisaLembreteHorasAntes } from "./lembretes";

const agora = new Date("2026-07-15T12:00:00.000Z");

function horasDepois(horas: number) {
  return new Date(agora.getTime() + horas * 60 * 60 * 1000);
}

describe("precisaLembreteDiaAnterior", () => {
  it("dispara quando faltam até 24h e ainda não foi enviado", () => {
    expect(
      precisaLembreteDiaAnterior(
        { status: "marcado", inicio: horasDepois(20), lembreteDiaAnteriorEm: null },
        agora,
      ),
    ).toBe(true);
  });

  it("não dispara de novo se já foi enviado", () => {
    expect(
      precisaLembreteDiaAnterior(
        { status: "marcado", inicio: horasDepois(20), lembreteDiaAnteriorEm: agora },
        agora,
      ),
    ).toBe(false);
  });

  it("não dispara para agendamento a mais de 24h de distância", () => {
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
        { status: "cancelado", inicio: horasDepois(10), lembreteDiaAnteriorEm: null },
        agora,
      ),
    ).toBe(false);
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
