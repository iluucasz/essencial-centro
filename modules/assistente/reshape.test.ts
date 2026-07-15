import { describe, expect, it } from "vitest";

import {
  limitarLista,
  reshapeCliente,
  reshapeDocumento,
  reshapeSessao,
  truncarTexto,
} from "./reshape";

describe("truncarTexto", () => {
  it("retorna null quando o texto é null", () => {
    expect(truncarTexto(null, 10)).toBeNull();
  });

  it("não altera texto dentro do limite", () => {
    expect(truncarTexto("abc", 10)).toBe("abc");
  });

  it("corta e adiciona reticências quando excede o limite", () => {
    expect(truncarTexto("abcdefghij", 5)).toBe("abcde…");
  });
});

describe("limitarLista", () => {
  it("corta a lista no limite informado", () => {
    expect(limitarLista([1, 2, 3, 4, 5], 2)).toEqual([1, 2]);
  });

  it("não altera lista menor que o limite", () => {
    expect(limitarLista([1, 2], 5)).toEqual([1, 2]);
  });
});

describe("reshapeCliente", () => {
  it("mantém id/nome/email/telefone e monta a url do perfil, descartando o resto", () => {
    const saida = reshapeCliente({
      id: "1",
      nome: "Thalia",
      email: "thalia@example.com",
      telefone: "21999999999",
    });

    expect(Object.keys(saida).sort()).toEqual(["email", "id", "nome", "telefone", "url"]);
    expect(saida.url).toBe("/painel/clientes/1");
  });
});

describe("reshapeDocumento — garantia LGPD", () => {
  const docComAssinatura = {
    tipo: "contrato_prestacao_servicos",
    titulo: "Contrato",
    conteudo: "Conteúdo do contrato assinado, ".repeat(30),
    status: "assinado",
    assinadoEm: new Date("2026-01-10"),
    criadoEm: new Date("2026-01-01"),
    assinaturaImagemDataUrl: "data:image/png;base64,AAAA",
    assinaturaIp: "203.0.113.5",
    assinaturaUserAgent: "Mozilla/5.0",
    conteudoHash: "sha256:abcdef",
    id: "doc-1",
    clienteId: "cliente-1",
  };

  it("nunca inclui assinatura, IP, user-agent ou hash no resultado enviado à IA", () => {
    const saida = reshapeDocumento(docComAssinatura);

    expect("assinaturaImagemDataUrl" in saida).toBe(false);
    expect("assinaturaIp" in saida).toBe(false);
    expect("assinaturaUserAgent" in saida).toBe(false);
    expect("conteudoHash" in saida).toBe(false);
    expect("id" in saida).toBe(false);
    expect("clienteId" in saida).toBe(false);
  });

  it("trunca o conteúdo em vez de mandar o documento inteiro", () => {
    const saida = reshapeDocumento(docComAssinatura);

    expect(saida.conteudoResumo?.endsWith("…")).toBe(true);
  });
});

describe("reshapeSessao — garantia LGPD", () => {
  const sessaoCompleta = {
    id: "sessao-1",
    clienteId: "cliente-1",
    servicoId: "servico-1",
    profissionalId: "prof-1",
    agendamentoId: "agenda-1",
    pacoteId: "pacote-1",
    criadoPorId: "prof-1",
    atualizadoPorId: "prof-1",
    dataHora: new Date("2026-01-10"),
    duracaoMinutos: 60,
    regiaoTratada: "Abdômen",
    condicaoAntes: "Edema leve",
    relatoCliente: "Sentindo dor moderada.",
    escalaDorAntes: 6,
    escalaDorDepois: 3,
    avaliacaoProfissional: "Boa evolução",
    equipamentosUtilizados: "Manthus",
    parametrosUtilizados: "Frequência 40kHz",
    produtosAplicados: "Creme X",
    reacoesObservadas: "Nenhuma",
    observacoesInternas: "Cliente sensível",
    orientacoesPosAtendimento: "Hidratar bastante",
    proximaSessaoRecomendada: new Date("2026-01-17"),
    presencaConfirmada: true,
  };

  it("nunca inclui FKs cruas nem campos clínicos internos não necessários", () => {
    const saida = reshapeSessao(sessaoCompleta);

    for (const campo of [
      "id",
      "clienteId",
      "servicoId",
      "profissionalId",
      "agendamentoId",
      "pacoteId",
      "criadoPorId",
      "atualizadoPorId",
      "equipamentosUtilizados",
      "parametrosUtilizados",
      "produtosAplicados",
      "reacoesObservadas",
      "observacoesInternas",
    ]) {
      expect(campo in saida).toBe(false);
    }
  });

  it("mantém os campos relevantes pra evolução do tratamento", () => {
    const saida = reshapeSessao(sessaoCompleta);

    expect(saida.escalaDorAntes).toBe(6);
    expect(saida.escalaDorDepois).toBe(3);
    expect(saida.regiaoTratada).toBe("Abdômen");
  });
});
