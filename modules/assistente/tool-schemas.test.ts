import { describe, expect, it } from "vitest";

import { buscarClientesInputSchema } from "./tool-schemas";

describe("buscarClientesInputSchema", () => {
  it("aceita busca omitida para listar clientes recentes", () => {
    expect(buscarClientesInputSchema.safeParse({}).success).toBe(true);
  });

  it("aceita busca vazia para listar clientes recentes", () => {
    expect(buscarClientesInputSchema.safeParse({ busca: "" }).success).toBe(true);
  });

  it("aceita busca só com espaços depois do trim", () => {
    const resultado = buscarClientesInputSchema.safeParse({ busca: "   " });

    expect(resultado.success).toBe(true);
    expect(resultado.data).toEqual({ busca: "" });
  });

  it("mantém limite de abuso no texto de busca", () => {
    expect(buscarClientesInputSchema.safeParse({ busca: "a".repeat(101) }).success).toBe(false);
  });
});
