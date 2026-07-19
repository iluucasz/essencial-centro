import { describe, expect, it } from "vitest";

import {
  extrairEnderecoCliente,
  formatarCep,
  montarEnderecoCliente,
  normalizarCep,
} from "./endereco";

describe("endereco do cliente", () => {
  it("normaliza e formata CEP", () => {
    expect(normalizarCep("01001-000")).toBe("01001000");
    expect(formatarCep("01001000")).toBe("01001-000");
  });

  it("monta endereco padronizado a partir dos campos separados", () => {
    expect(
      montarEnderecoCliente({
        cep: "01001000",
        logradouro: "Praca da Se",
        numero: "100",
        complemento: "sala 2",
        bairro: "Se",
        cidade: "Sao Paulo",
        uf: "sp",
      }),
    ).toBe("Praca da Se, 100, sala 2 - Se - Sao Paulo/SP - CEP 01001-000");
  });

  it("extrai endereco salvo no padrao novo", () => {
    expect(
      extrairEnderecoCliente("Praca da Se, 100, sala 2 - Se - Sao Paulo/SP - CEP 01001-000"),
    ).toEqual({
      cep: "01001-000",
      logradouro: "Praca da Se",
      numero: "100",
      complemento: "sala 2",
      bairro: "Se",
      cidade: "Sao Paulo",
      uf: "SP",
    });
  });

  it("aproveita endereco antigo simples sem apagar ao editar", () => {
    expect(extrairEnderecoCliente("Rua das Flores, 123")).toMatchObject({
      logradouro: "Rua das Flores",
      numero: "123",
    });
  });
});
