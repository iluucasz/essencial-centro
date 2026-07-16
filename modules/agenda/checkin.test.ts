import { describe, expect, it } from "vitest";

import { escolherAgendamentoMaisProximo, podeConfirmarPresenca } from "./checkin";

describe("podeConfirmarPresenca", () => {
  it("permite confirmar quando o agendamento está marcado e sem check-in prévio", () => {
    expect(podeConfirmarPresenca("marcado", null)).toBe(true);
  });

  it("bloqueia quando já houve check-in", () => {
    expect(podeConfirmarPresenca("marcado", new Date())).toBe(false);
  });

  it("bloqueia quando o agendamento não está mais marcado", () => {
    expect(podeConfirmarPresenca("realizado", null)).toBe(false);
    expect(podeConfirmarPresenca("falta", null)).toBe(false);
    expect(podeConfirmarPresenca("cancelado", null)).toBe(false);
  });
});

describe("escolherAgendamentoMaisProximo", () => {
  it("retorna null quando não há candidatos", () => {
    expect(escolherAgendamentoMaisProximo([], new Date("2026-07-16T12:00:00"))).toBeNull();
  });

  it("retorna o único candidato quando há apenas um", () => {
    const unico = { inicio: new Date("2026-07-16T14:00:00") };

    expect(escolherAgendamentoMaisProximo([unico], new Date("2026-07-16T12:00:00"))).toBe(unico);
  });

  it("escolhe o candidato mais próximo do horário atual entre vários", () => {
    const agora = new Date("2026-07-16T12:00:00");
    const distante = { inicio: new Date("2026-07-16T09:00:00") };
    const proximo = { inicio: new Date("2026-07-16T12:30:00") };
    const outroDistante = { inicio: new Date("2026-07-16T18:00:00") };

    expect(escolherAgendamentoMaisProximo([distante, proximo, outroDistante], agora)).toBe(proximo);
  });

  it("em empate exato de distância, mantém o primeiro encontrado", () => {
    const agora = new Date("2026-07-16T12:00:00");
    const antes = { inicio: new Date("2026-07-16T11:00:00") };
    const depois = { inicio: new Date("2026-07-16T13:00:00") };

    expect(escolherAgendamentoMaisProximo([antes, depois], agora)).toBe(antes);
  });
});
