import { describe, expect, it } from "vitest";

import { criarMedidaSchema, editarMedidaSchema } from "./schema";

const baseMedida = {
  clienteId: "11111111-1111-4111-8111-111111111111",
  regiao: "coxa",
  lado: "direito",
  valorCm: "58.5",
};

describe("criarMedidaSchema", () => {
  it("valida medida bilateral com lado informado", () => {
    expect(criarMedidaSchema.safeParse(baseMedida).success).toBe(true);
  });

  it("exige lado para coxa e braço", () => {
    expect(criarMedidaSchema.safeParse({ ...baseMedida, lado: "" }).success).toBe(false);
  });

  it("recusa lado em região central", () => {
    expect(
      criarMedidaSchema.safeParse({ ...baseMedida, regiao: "linha_umbigo", lado: "direito" })
        .success,
    ).toBe(false);
  });
});

describe("editarMedidaSchema", () => {
  it("exige o id da medida para edição", () => {
    const semId = editarMedidaSchema.safeParse(baseMedida);
    const comId = editarMedidaSchema.safeParse({
      ...baseMedida,
      id: "22222222-2222-4222-8222-222222222222",
    });

    expect(semId.success).toBe(false);
    expect(comId.success).toBe(true);
  });
});
