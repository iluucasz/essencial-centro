import { describe, expect, it } from "vitest";

import {
  limitarLista,
  reshapeCliente,
  reshapeDocumento,
  reshapeMedicamento,
  reshapeSessao,
  serializarDatas,
  truncarTexto,
} from "./reshape";

/** Procura recursivamente por qualquer instância de Date no valor. */
function contemDate(valor: unknown): boolean {
  if (valor instanceof Date) return true;
  if (Array.isArray(valor)) return valor.some(contemDate);
  if (valor !== null && typeof valor === "object") return Object.values(valor).some(contemDate);

  return false;
}

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

describe("serializarDatas", () => {
  it("converte Date em string ISO", () => {
    expect(serializarDatas(new Date("2026-07-20T14:30:00.000Z"))).toBe("2026-07-20T14:30:00.000Z");
  });

  it("converte datas aninhadas em objetos e arrays", () => {
    const entrada = {
      medicamentos: [{ dataInicio: new Date("2026-01-02T00:00:00.000Z"), nome: "X" }],
      evolucaoMedidas: [{ itens: [{ data: new Date("2026-03-04T00:00:00.000Z"), valorCm: 30 }] }],
    };

    const saida = serializarDatas(entrada);

    expect(contemDate(saida)).toBe(false);
    expect(saida.medicamentos[0].dataInicio).toBe("2026-01-02T00:00:00.000Z");
    expect(saida.evolucaoMedidas[0].itens[0].data).toBe("2026-03-04T00:00:00.000Z");
  });

  it("preserva null, string e number sem alterar", () => {
    expect(serializarDatas(null)).toBeNull();
    expect(serializarDatas("texto")).toBe("texto");
    expect(serializarDatas(42)).toBe(42);
    expect(serializarDatas({ a: null, b: "x", c: 1 })).toEqual({ a: null, b: "x", c: 1 });
  });

  // Regressão: reshapeMedicamento devolve Date cru — a saída da ferramenta virava JSON no
  // histórico e o AI SDK rejeitava "received Date" no turno seguinte, derrubando o assistente.
  it("elimina os Date que reshapeMedicamento deixa passar", () => {
    const reshaped = reshapeMedicamento({
      nome: "Losartana",
      dosagem: "50mg",
      frequencia: "1x ao dia",
      profissionalPrescritor: "Dra. Ana",
      dataInicio: new Date("2026-05-01T00:00:00.000Z"),
      alergiaRelacionada: null,
      alertaInteracao: null,
      fonteAlerta: null,
      verificadoEm: new Date("2026-05-02T00:00:00.000Z"),
      verificadoPorNome: "Ana",
      criadoEm: new Date("2026-05-03T00:00:00.000Z"),
    });

    expect(contemDate(reshaped)).toBe(true);
    expect(contemDate(serializarDatas(reshaped))).toBe(false);
  });
});
