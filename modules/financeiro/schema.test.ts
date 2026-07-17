import { describe, expect, it } from "vitest";

import { criarLancamentoSchema } from "./schema";

const lancamentoValido = {
  tipo: "receita",
  categoria: "pacote",
  descricao: "",
  valorCentavos: "120,00",
  data: "2026-07-17",
  formaPagamento: "pix",
  situacao: "pago",
  clienteId: "",
  pacoteId: "",
};

describe("criarLancamentoSchema", () => {
  it("aceita apenas categorias e formas de pagamento previstas", () => {
    expect(criarLancamentoSchema.safeParse(lancamentoValido).success).toBe(true);

    expect(
      criarLancamentoSchema.safeParse({ ...lancamentoValido, categoria: "texto livre" }).success,
    ).toBe(false);

    expect(
      criarLancamentoSchema.safeParse({ ...lancamentoValido, formaPagamento: "dinheiro" }).success,
    ).toBe(false);
  });
});
