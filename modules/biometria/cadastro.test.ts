import { describe, expect, it } from "vitest";

import { QUALIDADE_MINIMA_CADASTRO, qualidadeCadastroValida } from "./cadastro";

describe("qualidadeCadastroValida", () => {
  it("aceita qualidade exatamente no mínimo", () => {
    expect(qualidadeCadastroValida(QUALIDADE_MINIMA_CADASTRO)).toBe(true);
  });

  it("rejeita qualidade abaixo do mínimo", () => {
    expect(qualidadeCadastroValida(QUALIDADE_MINIMA_CADASTRO - 1)).toBe(false);
  });
});
