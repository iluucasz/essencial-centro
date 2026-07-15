import { describe, expect, it } from "vitest";

import { calcularVariacaoDor } from "./evolucao-dor";

describe("calcularVariacaoDor", () => {
  it("identifica melhora quando a dor diminui", () => {
    const resultado = calcularVariacaoDor(8, 3);

    expect(resultado).toEqual({ variacao: -5, melhora: true, pioraSignificativa: false });
  });

  it("identifica piora significativa quando a dor aumenta 3 pontos ou mais", () => {
    const resultado = calcularVariacaoDor(2, 6);

    expect(resultado).toEqual({ variacao: 4, melhora: false, pioraSignificativa: true });
  });

  it("não marca piora significativa para pequenas variações", () => {
    const resultado = calcularVariacaoDor(4, 5);

    expect(resultado).toEqual({ variacao: 1, melhora: false, pioraSignificativa: false });
  });

  it("retorna null quando falta uma das medições", () => {
    expect(calcularVariacaoDor(5, undefined)).toBeNull();
    expect(calcularVariacaoDor(null, 5)).toBeNull();
  });
});
