import { describe, expect, it } from "vitest";

import type { UsuarioSessao } from "@/modules/auth/rbac";

import { podeEditarPacotes, podeExcluirPacotes } from "./acesso";

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

const cliente: UsuarioSessao = {
  id: "33333333-3333-4333-8333-333333333333",
  role: "cliente",
  ativo: true,
};

describe("acesso de pacotes", () => {
  it("permite edição operacional e restringe exclusão ao perfil profissional", () => {
    expect(podeEditarPacotes(profissional)).toBe(true);
    expect(podeEditarPacotes(recepcao)).toBe(true);
    expect(podeEditarPacotes(cliente)).toBe(false);

    expect(podeExcluirPacotes(profissional)).toBe(true);
    expect(podeExcluirPacotes(recepcao)).toBe(false);
    expect(podeExcluirPacotes(cliente)).toBe(false);
  });
});
