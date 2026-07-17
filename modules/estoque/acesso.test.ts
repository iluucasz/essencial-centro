import { describe, expect, it } from "vitest";

import type { UsuarioSessao } from "@/modules/auth/rbac";

import { podeGerenciarEstoque } from "./acesso";

const profissional: UsuarioSessao = {
  id: "11111111-1111-4111-8111-111111111111",
  role: "profissional",
  ativo: true,
};

const recepcao: UsuarioSessao = {
  id: "22222222-2222-4222-8222-222222222222",
  role: "recepcao",
  ativo: true,
};

describe("acesso de estoque", () => {
  it("restringe edição e exclusão de produtos ao perfil profissional", () => {
    expect(podeGerenciarEstoque(profissional)).toBe(true);
    expect(podeGerenciarEstoque(recepcao)).toBe(false);
  });
});
