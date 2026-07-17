import { describe, expect, it } from "vitest";

import type { UsuarioSessao } from "@/modules/auth/rbac";

import { podeGerenciarServicos } from "./acesso";

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

describe("acesso de serviços", () => {
  it("restringe edição e exclusão de serviços ao perfil profissional", () => {
    expect(podeGerenciarServicos(profissional)).toBe(true);
    expect(podeGerenciarServicos(recepcao)).toBe(false);
  });
});
