import { describe, expect, it } from "vitest";

import { editarModeloFichaSchema, salvarModeloFichaSchema } from "./schema";

const campoValido = {
  id: "queixa",
  tipo: "texto_curto" as const,
  rotulo: "Queixa principal",
  obrigatorio: true,
  quemPreenche: "cliente" as const,
};

describe("salvarModeloFichaSchema", () => {
  it("valida um modelo com nome e ao menos um campo", () => {
    const resultado = salvarModeloFichaSchema.safeParse({
      nome: "Anamnese estética",
      campos: [campoValido],
    });

    expect(resultado.success).toBe(true);
  });

  it("recusa nome curto e recusa modelo sem campos", () => {
    expect(salvarModeloFichaSchema.safeParse({ nome: "A", campos: [campoValido] }).success).toBe(
      false,
    );
    expect(salvarModeloFichaSchema.safeParse({ nome: "Anamnese", campos: [] }).success).toBe(false);
  });
});

describe("editarModeloFichaSchema", () => {
  it("exige o id do modelo para edição", () => {
    const base = { nome: "Anamnese", campos: [campoValido] };

    expect(editarModeloFichaSchema.safeParse(base).success).toBe(false);
    expect(
      editarModeloFichaSchema.safeParse({ ...base, id: "3c10b9ff-0e1b-468a-a9b0-a888ee0e44b1" })
        .success,
    ).toBe(true);
  });
});
