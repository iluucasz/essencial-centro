import { describe, expect, it } from "vitest";

import { montarJanelaContexto } from "./contexto";

describe("montarJanelaContexto", () => {
  it("não corta quando está dentro do limite", () => {
    const mensagens = [1, 2, 3];

    expect(montarJanelaContexto(mensagens, 5)).toEqual([1, 2, 3]);
  });

  it("mantém só as últimas N mensagens quando excede o limite", () => {
    const mensagens = [1, 2, 3, 4, 5];

    expect(montarJanelaContexto(mensagens, 2)).toEqual([4, 5]);
  });

  it("não altera o array original", () => {
    const mensagens = [1, 2, 3, 4, 5];
    montarJanelaContexto(mensagens, 2);

    expect(mensagens).toEqual([1, 2, 3, 4, 5]);
  });

  it("usa o limite padrão quando nenhum é informado", () => {
    const mensagens = Array.from({ length: 30 }, (_, i) => i);

    expect(montarJanelaContexto(mensagens)).toHaveLength(20);
  });
});
