import { describe, expect, it } from "vitest";

import { filtrarFichaParaCliente, podeGerenciarFichas } from "./acesso";
import type { UsuarioSessao } from "@/modules/auth/rbac";
import type { Ficha } from "./schema";

const fichaCompleta = {
  id: "f1",
  clienteId: "c1",
  servicoId: null,
  tipo: "estetica_corporal",
  status: "assinada",
  versao: 1,
  versaoAnteriorId: null,
  respostas: {
    relato: { objetivoTratamento: "Redução de medidas" },
    avaliacaoProfissional: {
      observacoesInternas: "Cliente relatou desconforto financeiro para continuar o tratamento",
      diagnosticoEstetico: "Fibrose leve",
    },
    compartilhado: { orientacoes: "Beber bastante água" },
  },
  aceiteTermosEm: new Date(),
  autorizacaoImagemEm: null,
  criadoPorId: "u1",
  atualizadoPorId: "u1",
  criadoEm: new Date(),
  atualizadoEm: new Date(),
} as unknown as Ficha;

describe("filtrarFichaParaCliente", () => {
  it("remove a avaliação profissional, mantendo relato e área compartilhada", () => {
    const filtrada = filtrarFichaParaCliente(fichaCompleta);
    const respostas = filtrada.respostas as Record<string, unknown>;

    expect(respostas.relato).toEqual({ objetivoTratamento: "Redução de medidas" });
    expect(respostas.compartilhado).toEqual({ orientacoes: "Beber bastante água" });
    expect(respostas.avaliacaoProfissional).toBeUndefined();
    expect(JSON.stringify(filtrada)).not.toContain("desconforto financeiro");
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

describe("podeGerenciarFichas", () => {
  it("restringe criação, edição e exclusão de fichas ao perfil profissional", () => {
    expect(podeGerenciarFichas(profissional)).toBe(true);
    expect(podeGerenciarFichas(recepcao)).toBe(false);
    expect(podeGerenciarFichas(cliente)).toBe(false);
  });
});
