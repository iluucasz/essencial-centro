import { describe, expect, it } from "vitest";

import {
  limitarLista,
  reshapeAgendamento,
  reshapeAnalise,
  reshapeCliente,
  reshapeDocumento,
  reshapeMedicamento,
  reshapeResumoEvolucao,
  reshapeResumoFinanceiro,
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

describe("reshapeResumoFinanceiro", () => {
  // Regressão: relatorio_periodo mandava o resumo cru (centavos) pro modelo, que apresentou
  // "receitasPagas: 53000" como "R$ 53.000,00" numa resposta real — 100x o valor verdadeiro
  // (R$ 530,00). Toda outra ferramenta financeira já converte pra `valorReais`; esta faltava.
  it("converte todos os campos de centavos para reais", () => {
    const saida = reshapeResumoFinanceiro({
      receitasPagas: 53000,
      despesasPagas: 6000000,
      saldo: -5947000,
      receitasPendentes: 10000,
      despesasPendentes: 0,
    });

    expect(saida).toEqual({
      receitasPagasReais: 530,
      despesasPagasReais: 60000,
      saldoReais: -59470,
      receitasPendentesReais: 100,
      despesasPendentesReais: 0,
    });
  });

  it("nunca deixa um campo em centavos (sem sufixo Reais) escapar pro modelo", () => {
    const saida = reshapeResumoFinanceiro({
      receitasPagas: 1,
      despesasPagas: 1,
      saldo: 0,
      receitasPendentes: 1,
      despesasPendentes: 1,
    });

    for (const chave of Object.keys(saida)) {
      expect(chave.endsWith("Reais")).toBe(true);
    }
  });
});

describe("reshapeAgendamento", () => {
  // Regressão: só mandar `inicio` (ISO com "Z") deixava o modelo livre pra "ajustar" fuso por
  // conta própria — numa resposta real ele subtraiu 3h de um agendamento às 21h e disse "18h
  // (horário local ajustado)", quando 21h já era o horário certo (dado gravado como horário de
  // parede de Brasília direto no campo UTC, sem conversão — mesma convenção da tela de agenda,
  // que lê com timeZone "UTC"). O campo `horario` pronto tira essa conta do modelo.
  it("formata o horário com os mesmos dígitos do campo UTC, sem aplicar fuso", () => {
    const saida = reshapeAgendamento({
      inicio: new Date("2026-09-07T21:00:00.000Z"),
      duracaoMinutos: 8,
      status: "marcado",
      modalidade: "presencial",
      clienteNome: "Thalia Eluan",
      servicoNome: "Drenagem Linfática Facial",
      profissionalNome: "Edvania",
    });

    expect(saida.horario).toBe("21:00");
  });

  it("preserva minutos não-redondos", () => {
    const saida = reshapeAgendamento({
      inicio: new Date("2026-09-01T22:33:00.000Z"),
      duracaoMinutos: 60,
      status: "marcado",
      modalidade: "presencial",
      clienteNome: "Thalia Eluan",
      servicoNome: "test2",
      profissionalNome: "Edvania",
    });

    expect(saida.horario).toBe("22:33");
  });

  // Regressão: pedindo os "próximos 14 dias" (fora da semana atual), o modelo calculou o dia da
  // semana de cabeça e chamou 15/09/2026 (terça) de "Segunda" — mesma classe de erro do horário
  // "ajustado", resolvida do mesmo jeito: manda o valor certo pronto.
  it("devolve o dia da semana por extenso, sem depender do modelo calcular", () => {
    expect(
      reshapeAgendamento({
        inicio: new Date("2026-09-15T20:00:00.000Z"),
        duracaoMinutos: 60,
        status: "marcado",
        modalidade: "presencial",
        clienteNome: "Thalia Eluan",
        servicoNome: "test2",
        profissionalNome: "Edvania",
      }).diaSemana,
    ).toBe("terça-feira");
  });
});

describe("reshapeResumoEvolucao", () => {
  // Regressão: `mediaVariacao` cru (depois - antes) é negativo quando a dor CAI dentro da sessão
  // (bom sinal) — mas numa resposta real o modelo leu esse negativo como "indica piora", o
  // oposto do que o número mede, mesmo com `melhoraGeral` (o sinal de tendência correto) já
  // calculado ao lado. O campo renomeado deixa o sentido explícito no nome, sem o modelo adivinhar.
  it("inverte o sinal de mediaVariacao para uma queda de dor ficar positiva", () => {
    const saida = reshapeResumoEvolucao({
      totalSessoes: 5,
      evolucaoDor: {
        dorInicial: 2,
        dorAtual: 5,
        mediaVariacao: -1.2,
        totalRegistros: 5,
        melhoraGeral: false,
      },
      evolucaoMedidas: null,
      fotos: [],
      pacotes: [],
    });

    expect(saida.evolucaoDor).toEqual({
      dorInicial: 2,
      dorAtual: 5,
      houveMelhoraGeralDaDorInicialParaAtual: false,
      mediaDeQuantoADorCaiDentroDeCadaSessao: 1.2,
      totalRegistrosComDor: 5,
    });
  });

  it("não quebra quando não há nenhum registro de dor", () => {
    const saida = reshapeResumoEvolucao({
      totalSessoes: 0,
      evolucaoDor: null,
      evolucaoMedidas: null,
      fotos: [],
      pacotes: [],
    });

    expect(saida.evolucaoDor).toBeNull();
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

describe("reshapeAnalise", () => {
  it("trunca o texto da análise em vez de mandar tudo, e mantém status de revisão", () => {
    const saida = reshapeAnalise({
      tipo: "exame",
      titulo: "Hemograma completo",
      temArquivo: true,
      analiseIa: "Achado relevante. ".repeat(50),
      observacaoProfissional: null,
      status: "rascunho",
      revisadoEm: null,
      criadoEm: new Date("2026-08-01T00:00:00.000Z"),
    });

    expect(saida.status).toBe("rascunho");
    expect(saida.resumoAnaliseIa?.endsWith("…")).toBe(true);
    expect(saida.resumoAnaliseIa?.length).toBeLessThan("Achado relevante. ".repeat(50).length);
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
