import { describe, expect, it } from "vitest";

import { calcularResumoFinanceiro, type LancamentoParaResumo } from "./resumo";

function lancamento(overrides: Partial<LancamentoParaResumo>): LancamentoParaResumo {
  return { tipo: "receita", situacao: "pago", valorCentavos: 0, ...overrides };
}

describe("calcularResumoFinanceiro", () => {
  it("soma receitas e despesas pagas e calcula o saldo", () => {
    const resumo = calcularResumoFinanceiro([
      lancamento({ tipo: "receita", situacao: "pago", valorCentavos: 10_000 }),
      lancamento({ tipo: "receita", situacao: "pago", valorCentavos: 5_000 }),
      lancamento({ tipo: "despesa", situacao: "pago", valorCentavos: 4_000 }),
    ]);

    expect(resumo.receitasPagas).toBe(15_000);
    expect(resumo.despesasPagas).toBe(4_000);
    expect(resumo.saldo).toBe(11_000);
  });

  it("separa lançamentos pendentes das somas de valores pagos", () => {
    const resumo = calcularResumoFinanceiro([
      lancamento({ tipo: "receita", situacao: "pendente", valorCentavos: 8_000 }),
      lancamento({ tipo: "despesa", situacao: "pendente", valorCentavos: 3_000 }),
    ]);

    expect(resumo.receitasPagas).toBe(0);
    expect(resumo.despesasPagas).toBe(0);
    expect(resumo.receitasPendentes).toBe(8_000);
    expect(resumo.despesasPendentes).toBe(3_000);
    expect(resumo.saldo).toBe(0);
  });

  it("ignora lançamentos cancelados no resumo", () => {
    const resumo = calcularResumoFinanceiro([
      lancamento({ tipo: "receita", situacao: "cancelado", valorCentavos: 50_000 }),
      lancamento({ tipo: "receita", situacao: "pago", valorCentavos: 1_000 }),
    ]);

    expect(resumo.receitasPagas).toBe(1_000);
    expect(resumo.receitasPendentes).toBe(0);
  });

  it("retorna tudo zerado para uma lista vazia", () => {
    const resumo = calcularResumoFinanceiro([]);

    expect(resumo).toEqual({
      receitasPagas: 0,
      despesasPagas: 0,
      saldo: 0,
      receitasPendentes: 0,
      despesasPendentes: 0,
    });
  });
});
