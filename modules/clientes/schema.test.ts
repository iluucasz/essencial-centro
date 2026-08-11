import { describe, expect, it } from "vitest";

import { criarClienteSchema } from "./schema";

describe("criarClienteSchema", () => {
  it("valida um cadastro mínimo com consentimento de dados", () => {
    const resultado = criarClienteSchema.safeParse({
      nome: "Maria da Silva",
      dataNascimento: "1990-05-20",
      email: "maria@example.com",
      consentimentoDados: true,
      consentimentoImagem: false,
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.nome).toBe("Maria da Silva");
      expect(resultado.data.dataNascimento).toBeInstanceOf(Date);
    }
  });

  it("recusa nascimento futuro e cadastro sem consentimento de dados", () => {
    const futuro = new Date();
    futuro.setFullYear(futuro.getFullYear() + 1);

    const resultado = criarClienteSchema.safeParse({
      nome: "Maria Souza",
      dataNascimento: futuro,
      consentimentoDados: false,
      consentimentoImagem: false,
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      const campos = resultado.error.flatten().fieldErrors;
      expect(campos.dataNascimento?.[0]).toContain("futuro");
      expect(campos.consentimentoDados?.[0]).toContain("consentimento");
    }
  });
});

describe("criarClienteSchema — nome", () => {
  it("exige nome e sobrenome, não aceita uma palavra só", () => {
    const resultado = criarClienteSchema.safeParse({
      nome: "Maria",
      dataNascimento: "1990-05-20",
      consentimentoDados: true,
      consentimentoImagem: false,
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.flatten().fieldErrors.nome?.[0]).toContain("sobrenome");
    }
  });

  it("padroniza a capitalização do nome", () => {
    const resultado = criarClienteSchema.safeParse({
      nome: "lucas SILVA santos",
      dataNascimento: "1990-05-20",
      consentimentoDados: true,
      consentimentoImagem: false,
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.nome).toBe("Lucas Silva Santos");
    }
  });
});
