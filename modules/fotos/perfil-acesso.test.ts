import { describe, expect, it } from "vitest";

import type { UsuarioSessao } from "@/modules/auth/rbac";

import {
  podeAlterarFotoPerfilCliente,
  podeAlterarFotoUsuario,
  podeVerFotoUsuario,
} from "./perfil-acesso";

const profissional: UsuarioSessao = {
  id: "usuario-profissional",
  role: "profissional",
  ativo: true,
};

const recepcao: UsuarioSessao = {
  id: "usuario-recepcao",
  role: "recepcao",
  ativo: true,
};

const cliente: UsuarioSessao = {
  id: "usuario-cliente",
  role: "cliente",
  clienteId: "cliente-1",
  ativo: true,
};

describe("acesso de fotos de perfil", () => {
  it("permite alterar foto do cliente apenas pela equipe do painel", () => {
    expect(podeAlterarFotoPerfilCliente(profissional)).toBe(true);
    expect(podeAlterarFotoPerfilCliente(recepcao)).toBe(true);
    expect(podeAlterarFotoPerfilCliente(cliente)).toBe(false);
  });

  it("restringe alteração de foto de usuário ao perfil profissional", () => {
    expect(podeAlterarFotoUsuario(profissional)).toBe(true);
    expect(podeAlterarFotoUsuario(recepcao)).toBe(false);
    expect(podeAlterarFotoUsuario(cliente)).toBe(false);
  });

  it("permite ver foto de usuário própria ou por profissional", () => {
    expect(podeVerFotoUsuario(profissional, "outro-usuario")).toBe(true);
    expect(podeVerFotoUsuario(recepcao, recepcao.id)).toBe(true);
    expect(podeVerFotoUsuario(recepcao, profissional.id)).toBe(false);
    expect(podeVerFotoUsuario(cliente, cliente.id)).toBe(true);
    expect(podeVerFotoUsuario(cliente, recepcao.id)).toBe(false);
  });
});
