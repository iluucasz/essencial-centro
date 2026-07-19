import { describe, expect, it } from "vitest";

import type { UsuarioSessao } from "@/modules/auth/rbac";

import { podeGerenciarMedicamentos } from "./acesso";

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

describe("podeGerenciarMedicamentos", () => {
  it("restringe criação, edição e exclusão de medicamentos ao perfil profissional", () => {
    expect(podeGerenciarMedicamentos(profissional)).toBe(true);
    expect(podeGerenciarMedicamentos(recepcao)).toBe(false);
    expect(podeGerenciarMedicamentos(cliente)).toBe(false);
  });
});
