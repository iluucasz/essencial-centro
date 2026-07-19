import { describe, expect, it } from "vitest";

import {
  normalizarCategoriaLancamento,
  normalizarDataFimLancamento,
  normalizarDataInicioLancamento,
  normalizarFormaPagamentoLancamento,
  normalizarSituacaoLancamento,
  normalizarTipoLancamento,
  textoFiltroLancamento,
} from "./filtros";

describe("filtros de lançamentos", () => {
  it("normaliza textos de busca vindos da URL", () => {
    expect(textoFiltroLancamento("  aluguel  ")).toBe("aluguel");
    expect(textoFiltroLancamento(["pix", "ignorado"])).toBe("pix");
    expect(textoFiltroLancamento(undefined)).toBe("");
  });

  it("aceita apenas tipos válidos", () => {
    expect(normalizarTipoLancamento("receita")).toBe("receita");
    expect(normalizarTipoLancamento("lucro")).toBeUndefined();
  });

  it("aceita apenas categorias válidas", () => {
    expect(normalizarCategoriaLancamento("aluguel")).toBe("aluguel");
    expect(normalizarCategoriaLancamento("categoria_inexistente")).toBeUndefined();
  });

  it("aceita apenas situações válidas", () => {
    expect(normalizarSituacaoLancamento("pago")).toBe("pago");
    expect(normalizarSituacaoLancamento("atrasado")).toBeUndefined();
  });

  it("aceita apenas formas de pagamento válidas", () => {
    expect(normalizarFormaPagamentoLancamento("pix")).toBe("pix");
    expect(normalizarFormaPagamentoLancamento("boleto")).toBeUndefined();
  });

  it("normaliza data de início no começo do dia em UTC", () => {
    const data = normalizarDataInicioLancamento("2026-07-01");

    expect(data?.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("normaliza data de fim no fim do dia em UTC", () => {
    const data = normalizarDataFimLancamento("2026-07-31");

    expect(data?.toISOString()).toBe("2026-07-31T23:59:59.999Z");
  });

  it("retorna undefined para datas ausentes ou inválidas", () => {
    expect(normalizarDataInicioLancamento(undefined)).toBeUndefined();
    expect(normalizarDataFimLancamento("data-invalida")).toBeUndefined();
  });
});
