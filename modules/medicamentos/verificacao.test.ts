import { describe, expect, it } from "vitest";

import { contarPendentesVerificacao, precisaVerificacao } from "./verificacao";

describe("precisaVerificacao", () => {
  it("precisa quando ainda não foi verificado", () => {
    expect(precisaVerificacao(null)).toBe(true);
  });

  it("não precisa quando já foi verificado", () => {
    expect(precisaVerificacao(new Date("2026-07-15T00:00:00.000Z"))).toBe(false);
  });
});

describe("contarPendentesVerificacao", () => {
  it("conta só os não verificados", () => {
    const total = contarPendentesVerificacao([
      { verificadoEm: null },
      { verificadoEm: new Date("2026-07-15T00:00:00.000Z") },
      { verificadoEm: null },
    ]);

    expect(total).toBe(2);
  });

  it("retorna 0 para lista vazia", () => {
    expect(contarPendentesVerificacao([])).toBe(0);
  });
});
