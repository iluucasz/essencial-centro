import { describe, expect, it } from "vitest";

import {
  QUALIDADE_MINIMA_CADASTRO,
  codigoValido,
  gerarCodigoNumerico,
  qualidadeCadastroValida,
} from "./cadastro";

describe("codigoValido", () => {
  const agora = new Date("2026-07-16T12:00:00.000Z");

  it("é válido quando ainda não expirou e não foi consumido", () => {
    expect(
      codigoValido({ expiraEm: new Date("2026-07-16T12:05:00.000Z"), consumidoEm: null }, agora),
    ).toBe(true);
  });

  it("é inválido quando já expirou", () => {
    expect(
      codigoValido({ expiraEm: new Date("2026-07-16T11:59:00.000Z"), consumidoEm: null }, agora),
    ).toBe(false);
  });

  it("é inválido quando já foi consumido, mesmo dentro da validade", () => {
    expect(
      codigoValido(
        { expiraEm: new Date("2026-07-16T12:05:00.000Z"), consumidoEm: new Date(agora) },
        agora,
      ),
    ).toBe(false);
  });
});

describe("qualidadeCadastroValida", () => {
  it("aceita qualidade exatamente no mínimo", () => {
    expect(qualidadeCadastroValida(QUALIDADE_MINIMA_CADASTRO)).toBe(true);
  });

  it("rejeita qualidade abaixo do mínimo", () => {
    expect(qualidadeCadastroValida(QUALIDADE_MINIMA_CADASTRO - 1)).toBe(false);
  });
});

describe("gerarCodigoNumerico", () => {
  it("gera sempre uma string de 6 dígitos", () => {
    for (let i = 0; i < 50; i++) {
      expect(gerarCodigoNumerico()).toMatch(/^\d{6}$/);
    }
  });
});
