import { describe, expect, it } from "vitest";

import { criarSessaoSchema, editarSessaoSchema } from "./schema";

const baseSessao = {
  clienteId: "11111111-1111-4111-8111-111111111111",
  servicoId: "22222222-2222-4222-8222-222222222222",
  presencaConfirmada: true,
};

describe("criarSessaoSchema", () => {
  it("valida uma sessão mínima", () => {
    expect(criarSessaoSchema.safeParse(baseSessao).success).toBe(true);
  });

  it("limita escala de dor entre 0 e 10", () => {
    expect(criarSessaoSchema.safeParse({ ...baseSessao, escalaDorAntes: "11" }).success).toBe(
      false,
    );
  });
});

describe("editarSessaoSchema", () => {
  it("exige o id da sessão para edição", () => {
    const semId = editarSessaoSchema.safeParse(baseSessao);
    const comId = editarSessaoSchema.safeParse({
      ...baseSessao,
      id: "33333333-3333-4333-8333-333333333333",
    });

    expect(semId.success).toBe(false);
    expect(comId.success).toBe(true);
  });
});
