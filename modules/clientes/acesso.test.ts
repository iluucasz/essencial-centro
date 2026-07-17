import { describe, expect, it } from "vitest";

import { ErroAutorizacao, type UsuarioSessao } from "@/modules/auth/rbac";

import { filtrarClienteParaUsuario, podeExcluirClientes, removerCamposInternos } from "./acesso";
import type { Cliente } from "./schema";

const clienteBase: Cliente = {
  id: "11111111-1111-4111-8111-111111111111",
  nome: "Maria da Silva",
  dataNascimento: new Date("1990-05-20T00:00:00.000Z"),
  telefone: "11999999999",
  email: "maria@example.com",
  endereco: "Rua das Flores, 123",
  contatoEmergenciaNome: "Ana",
  contatoEmergenciaTelefone: "11888888888",
  profissao: "Designer",
  objetivoTratamento: "Alívio de dor",
  alergias: "Nenhuma",
  medicamentos: "Nenhum",
  condicoesSaude: "Sem condições informadas",
  cirurgias: null,
  contraindicacoes: null,
  consentimentoDados: true,
  consentimentoImagem: false,
  consentimentoBiometria: false,
  consentimentoBiometriaEm: null,
  observacoesInternas: "Anotação clínica interna",
  criadoPorId: "22222222-2222-4222-8222-222222222222",
  atualizadoPorId: "22222222-2222-4222-8222-222222222222",
  criadoEm: new Date("2026-01-01T00:00:00.000Z"),
  atualizadoEm: new Date("2026-01-01T00:00:00.000Z"),
};

const profissional: UsuarioSessao = {
  id: "22222222-2222-4222-8222-222222222222",
  role: "profissional",
  ativo: true,
};

const recepcao: UsuarioSessao = {
  id: "66666666-6666-4666-8666-666666666666",
  role: "recepcao",
  ativo: true,
};

const clienteDono: UsuarioSessao = {
  id: "33333333-3333-4333-8333-333333333333",
  role: "cliente",
  clienteId: clienteBase.id,
  ativo: true,
};

const outroCliente: UsuarioSessao = {
  id: "44444444-4444-4444-8444-444444444444",
  role: "cliente",
  clienteId: "55555555-5555-4555-8555-555555555555",
  ativo: true,
};

describe("acesso de clientes", () => {
  it("remove observações internas do DTO visível ao cliente", () => {
    const seguro = removerCamposInternos(clienteBase);

    expect("observacoesInternas" in seguro).toBe(false);
  });

  it("profissional vê dados completos e cliente vê apenas o próprio cadastro sem internos", () => {
    expect(filtrarClienteParaUsuario(clienteBase, profissional)).toHaveProperty(
      "observacoesInternas",
      "Anotação clínica interna",
    );

    const visivelCliente = filtrarClienteParaUsuario(clienteBase, clienteDono);
    expect("observacoesInternas" in visivelCliente).toBe(false);
    expect(visivelCliente.id).toBe(clienteBase.id);
  });

  it("bloqueia cliente tentando acessar cadastro de outra pessoa", () => {
    expect(() => filtrarClienteParaUsuario(clienteBase, outroCliente)).toThrow(ErroAutorizacao);
  });

  it("restringe exclusão de cliente ao perfil profissional", () => {
    expect(podeExcluirClientes(profissional)).toBe(true);
    expect(podeExcluirClientes(recepcao)).toBe(false);
    expect(podeExcluirClientes(clienteDono)).toBe(false);
  });
});
