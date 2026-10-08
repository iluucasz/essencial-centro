import { describe, expect, it } from "vitest";

import { aplicarFiltroCliente, aplicarFiltroTagCliente, normalizarFiltroCliente } from "./filtro";

const clientes = [
  {
    id: "1",
    email: "a@x.com",
    telefone: null,
    objetivoTratamento: "Emagrecimento",
    tag: "VIP",
  },
  { id: "2", email: null, telefone: null, objetivoTratamento: null, tag: null },
  {
    id: "3",
    email: null,
    telefone: "11999999999",
    objetivoTratamento: "  ",
    tag: "  ",
  },
];

describe("normalizarFiltroCliente", () => {
  it("aceita um filtro válido", () => {
    expect(normalizarFiltroCliente("com-contato")).toBe("com-contato");
  });

  it("cai em 'todos' para valor inválido ou ausente", () => {
    expect(normalizarFiltroCliente("qualquer-coisa")).toBe("todos");
    expect(normalizarFiltroCliente(undefined)).toBe("todos");
  });
});

describe("aplicarFiltroTagCliente", () => {
  it("filtra pela tag exata sem diferenciar maiúsculas", () => {
    expect(aplicarFiltroTagCliente(clientes, "vip").map((c) => c.id)).toEqual(["1"]);
  });

  it("não filtra quando nenhuma tag foi escolhida", () => {
    expect(aplicarFiltroTagCliente(clientes, undefined)).toBe(clientes);
  });
});

describe("aplicarFiltroCliente", () => {
  it("'todos' não filtra nada", () => {
    expect(aplicarFiltroCliente(clientes, "todos")).toHaveLength(3);
  });

  it("'com-contato' exige e-mail ou telefone", () => {
    const resultado = aplicarFiltroCliente(clientes, "com-contato");

    expect(resultado.map((c) => c.id)).toEqual(["1", "3"]);
  });

  it("'sem-contato' exclui quem tem e-mail ou telefone", () => {
    const resultado = aplicarFiltroCliente(clientes, "sem-contato");

    expect(resultado.map((c) => c.id)).toEqual(["2"]);
  });

  it("'com-objetivo' exige texto não vazio (após trim)", () => {
    const resultado = aplicarFiltroCliente(clientes, "com-objetivo");

    expect(resultado.map((c) => c.id)).toEqual(["1"]);
  });

  it("'sem-objetivo' inclui nulo e string em branco", () => {
    const resultado = aplicarFiltroCliente(clientes, "sem-objetivo");

    expect(resultado.map((c) => c.id)).toEqual(["2", "3"]);
  });

  it("filtra clientes com e sem tag, ignorando texto em branco", () => {
    expect(aplicarFiltroCliente(clientes, "com-tag").map((c) => c.id)).toEqual(["1"]);
    expect(aplicarFiltroCliente(clientes, "sem-tag").map((c) => c.id)).toEqual(["2", "3"]);
  });
});
