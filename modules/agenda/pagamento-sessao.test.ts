import { describe, expect, it } from "vitest";

import { calcularValorSugeridoSessao, situacaoInicialPagamentoSessao } from "./pagamento-sessao";

describe("calcularValorSugeridoSessao", () => {
  it("divide o valor do contrato pela quantidade de sessões", () => {
    expect(
      calcularValorSugeridoSessao({
        pacoteQuantidadeSessoes: 20,
        pacoteValorCentavos: 200_00,
        servicoValorCentavos: 150_00,
      }),
    ).toBe(10_00);
  });

  it("usa o valor do serviço quando o agendamento é avulso", () => {
    expect(
      calcularValorSugeridoSessao({
        pacoteQuantidadeSessoes: null,
        pacoteValorCentavos: null,
        servicoValorCentavos: 180_00,
      }),
    ).toBe(180_00);
  });
});

describe("situacaoInicialPagamentoSessao", () => {
  it("não lança cobrança extra quando o contrato já está pago", () => {
    expect(situacaoInicialPagamentoSessao("pago")).toBe("nao_lancar");
  });

  it("sugere registrar pagamento quando o contrato está pendente ou parcial", () => {
    expect(situacaoInicialPagamentoSessao("pendente")).toBe("pago");
    expect(situacaoInicialPagamentoSessao("parcial")).toBe("pago");
  });
});
