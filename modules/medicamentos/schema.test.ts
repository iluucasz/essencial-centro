import { describe, expect, it } from "vitest";

import { criarMedicamentoInformadoSchema, editarMedicamentoInformadoSchema } from "./schema";

const baseMedicamento = {
  clienteId: "11111111-1111-4111-8111-111111111111",
  nome: "Dipirona",
  dosagem: "500 mg",
};

describe("criarMedicamentoInformadoSchema", () => {
  it("valida medicamento informado mínimo", () => {
    expect(criarMedicamentoInformadoSchema.safeParse(baseMedicamento).success).toBe(true);
  });

  it("exige nome com pelo menos 2 caracteres", () => {
    expect(
      criarMedicamentoInformadoSchema.safeParse({ ...baseMedicamento, nome: "A" }).success,
    ).toBe(false);
  });
});

describe("editarMedicamentoInformadoSchema", () => {
  it("exige o id do medicamento para edição", () => {
    const semId = editarMedicamentoInformadoSchema.safeParse(baseMedicamento);
    const comId = editarMedicamentoInformadoSchema.safeParse({
      ...baseMedicamento,
      id: "22222222-2222-4222-8222-222222222222",
    });

    expect(semId.success).toBe(false);
    expect(comId.success).toBe(true);
  });
});
