import { describe, expect, it } from "vitest";

import { calcularEvolucaoDorPeriodo } from "./dor-periodo";

describe("calcularEvolucaoDorPeriodo", () => {
  it("calcula dor inicial/atual e média de variação ao longo de várias sessões", () => {
    const resultado = calcularEvolucaoDorPeriodo([
      { data: new Date("2026-01-05"), dorAntes: 8, dorDepois: 6 },
      { data: new Date("2026-01-01"), dorAntes: 9, dorDepois: 7 },
      { data: new Date("2026-01-10"), dorAntes: 4, dorDepois: 2 },
    ]);

    expect(resultado).not.toBeNull();
    expect(resultado?.dorInicial).toBe(9);
    expect(resultado?.dorAtual).toBe(2);
    expect(resultado?.mediaVariacao).toBe(-2);
    expect(resultado?.melhoraGeral).toBe(true);
    expect(resultado?.totalRegistros).toBe(3);
  });

  it("usa dorDepois como inicial quando a primeira sessão não tem dorAntes", () => {
    const resultado = calcularEvolucaoDorPeriodo([
      { data: new Date("2026-01-01"), dorAntes: null, dorDepois: 5 },
    ]);

    expect(resultado?.dorInicial).toBe(5);
    expect(resultado?.dorAtual).toBe(5);
    expect(resultado?.mediaVariacao).toBe(0);
  });

  it("identifica quando não houve melhora geral", () => {
    const resultado = calcularEvolucaoDorPeriodo([
      { data: new Date("2026-01-01"), dorAntes: 2, dorDepois: 2 },
      { data: new Date("2026-01-05"), dorAntes: 5, dorDepois: 6 },
    ]);

    expect(resultado?.melhoraGeral).toBe(false);
  });

  it("retorna null quando não há nenhum registro de dor", () => {
    expect(calcularEvolucaoDorPeriodo([])).toBeNull();
    expect(
      calcularEvolucaoDorPeriodo([
        { data: new Date("2026-01-01"), dorAntes: null, dorDepois: null },
      ]),
    ).toBeNull();
  });
});
