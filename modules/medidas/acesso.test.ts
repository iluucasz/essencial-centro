import { describe, expect, it } from "vitest";

import type { UsuarioSessao } from "@/modules/auth/rbac";

import { podeGerenciarMedidas } from "./acesso";

const profissional: UsuarioSessao = {
  id: "u-profissional",
  role: "profissional",
  ativo: true,
};

const recepcao: UsuarioSessao = {
  id: "u-recepcao",
  role: "recepcao",
  ativo: true,
};

const cliente: UsuarioSessao = {
  id: "u-cliente",
  role: "cliente",
  clienteId: "c1",
  ativo: true,
};

describe("podeGerenciarMedidas", () => {
  it("restringe criação, edição e exclusão de medidas ao perfil profissional", () => {
    expect(podeGerenciarMedidas(profissional)).toBe(true);
    expect(podeGerenciarMedidas(recepcao)).toBe(false);
    expect(podeGerenciarMedidas(cliente)).toBe(false);
  });
});
