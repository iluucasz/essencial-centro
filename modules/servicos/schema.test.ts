import { describe, expect, it } from "vitest";

import { criarServicoSchema } from "./schema";

describe("criarServicoSchema", () => {
  it("valida um cadastro mínimo e converte o valor em centavos", () => {
    const resultado = criarServicoSchema.safeParse({
      nome: "Drenagem linfática",
      grupo: "massoterapia",
      duracaoMinutos: "60",
      valorCentavos: "150,00",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.duracaoMinutos).toBe(60);
      expect(resultado.data.valorCentavos).toBe(15000);
    }
  });

  it("aceita serviço sem valor definido", () => {
    const resultado = criarServicoSchema.safeParse({
      nome: "Avaliação inicial",
      grupo: "estetica_corporal",
      duracaoMinutos: 30,
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.valorCentavos).toBeUndefined();
    }
  });

  it("recusa duração fora do intervalo e grupo inválido", () => {
    const resultado = criarServicoSchema.safeParse({
      nome: "Serviço teste",
      grupo: "grupo_inexistente",
      duracaoMinutos: 600,
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      const campos = resultado.error.flatten().fieldErrors;
      expect(campos.duracaoMinutos?.[0]).toContain("8 horas");
      expect(campos.grupo?.[0]).toBeTruthy();
    }
  });
});
