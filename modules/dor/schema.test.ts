import { describe, expect, it } from "vitest";

import { registrarDorSchema } from "./schema";

/** Campos como chegam do `<form>`: tudo string, campo vazio é `""` e não `undefined`. */
function doFormulario(parcial: Record<string, unknown> = {}) {
  return {
    regiao: "lombar",
    lado: "",
    intensidade: "7",
    anterior: false,
    alturaNormalizada: "0.58",
    xNormalizado: "0",
    observacao: "",
    ...parcial,
  };
}

describe("registrarDorSchema", () => {
  /**
   * Bug real: em região de linha média o `lado` sai do formulário como "" e a validação rejeitava
   * com "Revise o ponto de dor" — nenhuma dor de lombar, peito ou abdômen conseguia ser salva.
   */
  it("aceita lado vazio em região de linha média", () => {
    const resultado = registrarDorSchema.safeParse(doFormulario());

    expect(resultado.success).toBe(true);
    expect(resultado.data?.lado).toBeNull();
  });

  it("aceita lado ausente e lado nulo", () => {
    expect(registrarDorSchema.safeParse(doFormulario({ lado: undefined })).success).toBe(true);
    expect(registrarDorSchema.safeParse(doFormulario({ lado: null })).success).toBe(true);
  });

  it("guarda o lado em região bilateral", () => {
    const resultado = registrarDorSchema.safeParse(
      doFormulario({ regiao: "ombro", lado: "direito" }),
    );

    expect(resultado.data?.lado).toBe("direito");
  });

  it("descarta lado enviado em região de linha média — não grava 'lombar direita'", () => {
    const resultado = registrarDorSchema.safeParse(doFormulario({ lado: "direito" }));

    expect(resultado.data?.lado).toBeNull();
  });

  it("recusa lado inventado", () => {
    expect(registrarDorSchema.safeParse(doFormulario({ lado: "meio" })).success).toBe(false);
  });

  it("converte a intensidade de string e recusa fora de 0–10", () => {
    expect(registrarDorSchema.safeParse(doFormulario({ intensidade: "0" })).data?.intensidade).toBe(
      0,
    );
    expect(
      registrarDorSchema.safeParse(doFormulario({ intensidade: "10" })).data?.intensidade,
    ).toBe(10);
    expect(registrarDorSchema.safeParse(doFormulario({ intensidade: "11" })).success).toBe(false);
    expect(registrarDorSchema.safeParse(doFormulario({ intensidade: "-1" })).success).toBe(false);
    expect(registrarDorSchema.safeParse(doFormulario({ intensidade: "4.5" })).success).toBe(false);
  });

  it("trata observação vazia como ausente", () => {
    expect(registrarDorSchema.safeParse(doFormulario()).data?.observacao).toBeUndefined();
    expect(
      registrarDorSchema.safeParse(doFormulario({ observacao: "  piora à noite  " })).data
        ?.observacao,
    ).toBe("piora à noite");
  });

  it("recusa coordenadas fora do espaço normalizado", () => {
    expect(registrarDorSchema.safeParse(doFormulario({ alturaNormalizada: "1.5" })).success).toBe(
      false,
    );
    expect(registrarDorSchema.safeParse(doFormulario({ xNormalizado: "-2" })).success).toBe(false);
  });
});
