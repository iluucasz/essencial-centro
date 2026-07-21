import { describe, expect, it } from "vitest";

import {
  escolherAgendamentoMaisProximo,
  extrairAgendamentoIdDoQr,
  podeConcluirAtendimento,
  podeConfirmarPresenca,
} from "./checkin";

const ID = "9fb63b59-f4bc-46c2-9e31-33ebd759c122";

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

describe("podeConcluirAtendimento", () => {
  it("libera conclusão somente para agendamento marcado com presença confirmada", () => {
    expect(podeConcluirAtendimento("marcado", new Date())).toBe(true);
  });

  it("bloqueia conclusão sem presença confirmada", () => {
    expect(podeConcluirAtendimento("marcado", null)).toBe(false);
  });

  it("bloqueia quando o agendamento já foi resolvido", () => {
    expect(podeConcluirAtendimento("realizado", new Date())).toBe(false);
    expect(podeConcluirAtendimento("falta", new Date())).toBe(false);
    expect(podeConcluirAtendimento("cancelado", new Date())).toBe(false);
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

describe("extrairAgendamentoIdDoQr", () => {
  it("extrai o ID da URL completa gerada no portal", () => {
    expect(
      extrairAgendamentoIdDoQr(`https://essencial-centro.vercel.app/painel/checkin/${ID}`),
    ).toBe(ID);
  });

  it("aceita http e localhost", () => {
    expect(extrairAgendamentoIdDoQr(`http://localhost:3000/painel/checkin/${ID}`)).toBe(ID);
  });

  it("ignora barra final, query string e hash", () => {
    expect(extrairAgendamentoIdDoQr(`https://x.com/painel/checkin/${ID}/`)).toBe(ID);
    expect(extrairAgendamentoIdDoQr(`https://x.com/painel/checkin/${ID}?v=1`)).toBe(ID);
    expect(extrairAgendamentoIdDoQr(`https://x.com/painel/checkin/${ID}#topo`)).toBe(ID);
  });

  it("aceita o UUID cru e normaliza maiúsculas", () => {
    expect(extrairAgendamentoIdDoQr(`  ${ID.toUpperCase()}  `)).toBe(ID);
  });

  it("retorna null para QR que não é de check-in", () => {
    expect(extrairAgendamentoIdDoQr("https://exemplo.com/outra-coisa")).toBeNull();
    expect(extrairAgendamentoIdDoQr("texto qualquer")).toBeNull();
    expect(extrairAgendamentoIdDoQr("")).toBeNull();
  });

  it("retorna null quando o segmento após checkin não é um UUID válido", () => {
    expect(extrairAgendamentoIdDoQr("https://x.com/painel/checkin/123")).toBeNull();
  });
});
