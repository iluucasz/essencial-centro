import { describe, expect, it } from "vitest";

import {
  FAR_MAXIMO_IDENTIFICACAO,
  QUALIDADE_MINIMA_IDENTIFICACAO,
  decidirResultadoIdentificacao,
} from "./decisao";

describe("decidirResultadoIdentificacao", () => {
  it("retorna sem_match quando a ponte não reporta nenhum candidato", () => {
    expect(decidirResultadoIdentificacao({ situacao: "sem_claim" })).toBe("sem_match");
  });

  it("retorna rejeitado_invalido quando a biometria reportada não existe/não pertence a ninguém com agendamento hoje", () => {
    expect(decidirResultadoIdentificacao({ situacao: "claim_invalida" })).toBe(
      "rejeitado_invalido",
    );
  });

  it("retorna ja_confirmado quando o agendamento já tinha check-in", () => {
    expect(decidirResultadoIdentificacao({ situacao: "ja_confirmado" })).toBe("ja_confirmado");
  });

  it("confirma quando qualidade e FAR estão dentro dos limiares, sem ambiguidade", () => {
    expect(
      decidirResultadoIdentificacao({
        situacao: "claim_valida",
        qualidade: 80,
        farAtingido: 0.0001,
        farSegundoColocado: 0.01,
      }),
    ).toBe("confirmado");
  });

  it("rejeita por qualidade abaixo do mínimo", () => {
    expect(
      decidirResultadoIdentificacao({
        situacao: "claim_valida",
        qualidade: QUALIDADE_MINIMA_IDENTIFICACAO - 1,
        farAtingido: 0.0001,
        farSegundoColocado: null,
      }),
    ).toBe("rejeitado_qualidade");
  });

  it("aceita qualidade 0 — o SDK não reporta esse valor no Identify, não é leitura ruim", () => {
    expect(
      decidirResultadoIdentificacao({
        situacao: "claim_valida",
        qualidade: 0,
        farAtingido: 0,
        farSegundoColocado: null,
      }),
    ).toBe("confirmado");
  });

  it("aceita qualidade exatamente no limiar mínimo", () => {
    expect(
      decidirResultadoIdentificacao({
        situacao: "claim_valida",
        qualidade: QUALIDADE_MINIMA_IDENTIFICACAO,
        farAtingido: 0.0001,
        farSegundoColocado: null,
      }),
    ).toBe("confirmado");
  });

  it("rejeita por FAR acima do máximo", () => {
    expect(
      decidirResultadoIdentificacao({
        situacao: "claim_valida",
        qualidade: 80,
        farAtingido: FAR_MAXIMO_IDENTIFICACAO + 0.0001,
        farSegundoColocado: null,
      }),
    ).toBe("rejeitado_far");
  });

  it("aceita FAR exatamente no limiar máximo", () => {
    expect(
      decidirResultadoIdentificacao({
        situacao: "claim_valida",
        qualidade: 80,
        farAtingido: FAR_MAXIMO_IDENTIFICACAO,
        farSegundoColocado: null,
      }),
    ).toBe("confirmado");
  });

  it("pula a checagem de ambiguidade quando a ponte não relata o 2º colocado", () => {
    expect(
      decidirResultadoIdentificacao({
        situacao: "claim_valida",
        qualidade: 80,
        farAtingido: 0.0001,
        farSegundoColocado: null,
      }),
    ).toBe("confirmado");
  });

  it("rejeita por ambiguidade quando o 2º colocado é próximo do 1º", () => {
    expect(
      decidirResultadoIdentificacao({
        situacao: "claim_valida",
        qualidade: 80,
        farAtingido: 0.0001,
        farSegundoColocado: 0.0005, // menos de 10x pior que o 1º colocado
      }),
    ).toBe("rejeitado_ambiguo");
  });

  it("rejeita por ambiguidade quando o 2º colocado é igual ou melhor que o 1º", () => {
    expect(
      decidirResultadoIdentificacao({
        situacao: "claim_valida",
        qualidade: 80,
        farAtingido: 0.0001,
        farSegundoColocado: 0.0001,
      }),
    ).toBe("rejeitado_ambiguo");
  });

  it("trata farAtingido = 0 corretamente: qualquer 2º colocado positivo não é ambíguo", () => {
    expect(
      decidirResultadoIdentificacao({
        situacao: "claim_valida",
        qualidade: 80,
        farAtingido: 0,
        farSegundoColocado: 0.00001,
      }),
    ).toBe("confirmado");
  });

  it("trata farAtingido = 0 e farSegundoColocado = 0 como ambíguo (empate)", () => {
    expect(
      decidirResultadoIdentificacao({
        situacao: "claim_valida",
        qualidade: 80,
        farAtingido: 0,
        farSegundoColocado: 0,
      }),
    ).toBe("rejeitado_ambiguo");
  });
});
