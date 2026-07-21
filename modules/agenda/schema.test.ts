import { describe, expect, it } from "vitest";

import {
  concluirAgendamentoSchema,
  confirmarPresencaSchema,
  criarAgendamentoSchema,
  interpretarDataHoraParede,
} from "./schema";

describe("interpretarDataHoraParede", () => {
  // Regressão do bug de fuso: num dev em Brasília (TZ do processo = America/Sao_Paulo, onde estes
  // testes rodam), `new Date("2026-07-20T12:00")` daria 15:00Z. A parede tem que ir para os campos
  // UTC sem deslocar — independente do fuso do processo.
  it("grava a hora informada nos campos UTC, sem deslocar pelo fuso", () => {
    expect(interpretarDataHoraParede("2026-07-20T12:00")?.toISOString()).toBe(
      "2026-07-20T12:00:00.000Z",
    );
  });

  it("aceita segundos quando presentes", () => {
    expect(interpretarDataHoraParede("2026-07-20T12:00:30")?.toISOString()).toBe(
      "2026-07-20T12:00:30.000Z",
    );
  });

  it("retorna null para formato inválido", () => {
    expect(interpretarDataHoraParede("20/07/2026 12:00")).toBeNull();
    expect(interpretarDataHoraParede("")).toBeNull();
  });
});

describe("criarAgendamentoSchema — parse de inicio", () => {
  const base = {
    clienteId: "11111111-1111-4111-8111-111111111111",
    servicoId: "22222222-2222-4222-8222-222222222222",
    profissionalId: "33333333-3333-4333-8333-333333333333",
    duracaoMinutos: 60,
  };

  it("interpreta o horário do formulário como parede (UTC fields), não como hora local", () => {
    const parsed = criarAgendamentoSchema.parse({ ...base, inicio: "2026-07-20T12:00" });

    expect(parsed.inicio.toISOString()).toBe("2026-07-20T12:00:00.000Z");
  });
});

describe("concluirAgendamentoSchema", () => {
  const id = "44444444-4444-4444-8444-444444444444";

  it("exige valor quando a sessão será lançada como paga ou pendente", () => {
    expect(
      concluirAgendamentoSchema.safeParse({
        id,
        situacaoPagamentoSessao: "pago",
        valorSessaoCentavos: "",
      }).success,
    ).toBe(false);

    expect(
      concluirAgendamentoSchema.safeParse({
        id,
        situacaoPagamentoSessao: "pendente",
        valorSessaoCentavos: "120,00",
      }).success,
    ).toBe(true);
  });

  it("não exige valor quando a sessão já estava paga no contrato", () => {
    expect(
      concluirAgendamentoSchema.safeParse({
        id,
        situacaoPagamentoSessao: "nao_lancar",
        valorSessaoCentavos: "",
      }).success,
    ).toBe(true);
  });
});

describe("confirmarPresencaSchema", () => {
  it("aceita apenas UUID válido de agendamento", () => {
    expect(
      confirmarPresencaSchema.safeParse({
        id: "55555555-5555-4555-8555-555555555555",
      }).success,
    ).toBe(true);

    expect(confirmarPresencaSchema.safeParse({ id: "123" }).success).toBe(false);
  });
});
