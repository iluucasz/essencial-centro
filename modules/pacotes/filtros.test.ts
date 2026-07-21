import { describe, expect, it } from "vitest";

import {
  normalizarAtivoPacote,
  normalizarSituacaoPagamentoPacote,
  textoFiltroPacote,
} from "./filtros";

describe("filtros de pacotes", () => {
  it("normaliza textos de busca vindos da URL", () => {
    expect(textoFiltroPacote("  Thalia  ")).toBe("Thalia");
    expect(textoFiltroPacote(["Drenagem", "ignorado"])).toBe("Drenagem");
    expect(textoFiltroPacote(undefined)).toBe("");
  });

  it("aceita apenas situações de pagamento válidas", () => {
    expect(normalizarSituacaoPagamentoPacote("pago")).toBe("pago");
    expect(normalizarSituacaoPagamentoPacote("cancelado")).toBeUndefined();
  });

  it("aceita apenas filtros estruturados válidos", () => {
    expect(normalizarAtivoPacote("ativos")).toBe("ativos");
    expect(normalizarAtivoPacote("todos")).toBeUndefined();
  });
});
