import { describe, expect, it } from "vitest";

import { filtrarSessaoParaCliente, podeGerenciarSessoes } from "./acesso";
import type { UsuarioSessao } from "@/modules/auth/rbac";
import type { Sessao } from "./schema";

const sessaoCompleta = {
  id: "s1",
  clienteId: "c1",
  servicoId: "sv1",
  profissionalId: "u1",
  agendamentoId: null,
  pacoteId: null,
  dataHora: new Date(),
  duracaoMinutos: 60,
  regiaoTratada: "Abdômen",
  condicaoAntes: "Relatou inchaço",
  relatoCliente: "Sentiu leve desconforto",
  escalaDorAntes: 3,
  escalaDorDepois: 1,
  avaliacaoProfissional: "Boa resposta ao protocolo",
  equipamentosUtilizados: "Radiofrequência",
  parametrosUtilizados: "40W, 20min",
  produtosAplicados: "Gel condutor",
  reacoesObservadas: "Vermelhidão leve, esperada",
  observacoesInternas: "Cliente com pendência financeira no pacote",
  orientacoesPosAtendimento: "Beber bastante água",
  proximaSessaoRecomendada: null,
  presencaConfirmada: true,
  criadoPorId: "u1",
  atualizadoPorId: "u1",
  criadoEm: new Date(),
  atualizadoEm: new Date(),
} satisfies Sessao;

describe("filtrarSessaoParaCliente", () => {
  it("remove os campos de avaliação/observação profissional", () => {
    const filtrada = filtrarSessaoParaCliente(sessaoCompleta);

    expect(filtrada.relatoCliente).toBe("Sentiu leve desconforto");
    expect(filtrada.orientacoesPosAtendimento).toBe("Beber bastante água");
    expect("avaliacaoProfissional" in filtrada).toBe(false);
    expect("observacoesInternas" in filtrada).toBe(false);
    expect(JSON.stringify(filtrada)).not.toContain("pendência financeira");
  });
});

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

describe("podeGerenciarSessoes", () => {
  it("restringe criação, edição e exclusão de sessões ao perfil profissional", () => {
    expect(podeGerenciarSessoes(profissional)).toBe(true);
    expect(podeGerenciarSessoes(recepcao)).toBe(false);
    expect(podeGerenciarSessoes(cliente)).toBe(false);
  });
});
