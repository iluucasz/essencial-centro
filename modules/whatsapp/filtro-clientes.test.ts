import { describe, expect, it } from "vitest";

import { filtrarClientesCampanha } from "./filtro-clientes";

const clientes = [
  { id: "1", nome: "Ana Souza", tag: "Pós-operatório" },
  { id: "2", nome: "Beatriz Lima", tag: "VIP" },
  { id: "3", nome: "Carla Mendes", tag: null },
];

describe("filtrarClientesCampanha", () => {
  it("encontra destinatários por nome ou por tag sem diferenciar maiúsculas", () => {
    expect(filtrarClientesCampanha(clientes, "beatriz").map((c) => c.id)).toEqual(["2"]);
    expect(filtrarClientesCampanha(clientes, "pÓs-OPERATÓRIO").map((c) => c.id)).toEqual(["1"]);
  });

  it("mantém todos os clientes quando a busca está vazia", () => {
    expect(filtrarClientesCampanha(clientes, "  ")).toBe(clientes);
  });
});
