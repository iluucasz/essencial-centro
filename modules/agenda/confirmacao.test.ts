import { describe, expect, it } from "vitest";

import {
  DIAS_VALIDADE_TOKEN_CONFIRMACAO,
  descreverSessao,
  expiracaoTokenConfirmacao,
  gerarTokenConfirmacao,
  linhaDaSessao,
  mensagemConfirmadoComSucesso,
  mensagemPedidoConfirmacao,
  mensagemQrDoDia,
  mensagemRecusaRegistrada,
  podeResponder,
  responderConfirmacaoSchema,
  situacaoDoContrato,
  tokenConfirmacaoExpirado,
} from "./confirmacao";

const AGORA = new Date("2026-08-04T12:00:00.000Z");

/*
  04/08/2026 é uma terça. Horário de PAREDE gravado nos campos UTC, que é como `agendamento.inicio`
  guarda a hora (ver `interpretarDataHoraParede`): 14:00 na tela = 14:00Z na coluna.
*/
const SESSOES = [
  { inicio: new Date("2026-08-04T14:00:00.000Z"), duracaoMinutos: 60 },
  { inicio: new Date("2026-08-06T14:00:00.000Z"), duracaoMinutos: 60 },
];

describe("token de confirmação", () => {
  it("gera token longo e diferente a cada chamada", () => {
    const a = gerarTokenConfirmacao();
    const b = gerarTokenConfirmacao();

    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(24);
    // base64url: seguro em URL, sem `+`, `/` ou `=`.
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("expira no prazo definido", () => {
    const expira = expiracaoTokenConfirmacao(AGORA);
    const dias = (expira.getTime() - AGORA.getTime()) / (24 * 60 * 60 * 1000);

    expect(dias).toBe(DIAS_VALIDADE_TOKEN_CONFIRMACAO);
  });

  it("trata ausência de data como expirado — sem data não há prazo a respeitar", () => {
    expect(tokenConfirmacaoExpirado(null, AGORA)).toBe(true);
    expect(tokenConfirmacaoExpirado(undefined, AGORA)).toBe(true);
    expect(tokenConfirmacaoExpirado(new Date("2026-08-03T00:00:00.000Z"), AGORA)).toBe(true);
    expect(tokenConfirmacaoExpirado(new Date("2026-08-10T00:00:00.000Z"), AGORA)).toBe(false);
  });
});

describe("situacaoDoContrato", () => {
  const base = {
    tokenConfirmacao: "abc",
    tokenExpiraEm: new Date("2026-08-10T00:00:00.000Z"),
    confirmadoEm: null,
    recusadoEm: null,
    agora: AGORA,
  };

  it("pendente quando o token vale e ninguém respondeu", () => {
    expect(situacaoDoContrato(base)).toEqual({ estado: "pendente" });
    expect(podeResponder(situacaoDoContrato(base))).toBe(true);
  });

  it("sem token é inválido", () => {
    expect(situacaoDoContrato({ ...base, tokenConfirmacao: null })).toEqual({ estado: "invalido" });
  });

  it("mostra a resposta já dada mesmo depois do prazo — não vira 'expirado'", () => {
    const confirmado = situacaoDoContrato({
      ...base,
      tokenExpiraEm: new Date("2026-08-01T00:00:00.000Z"),
      confirmadoEm: new Date("2026-07-30T00:00:00.000Z"),
    });

    expect(confirmado.estado).toBe("confirmado");

    const recusado = situacaoDoContrato({
      ...base,
      tokenExpiraEm: new Date("2026-08-01T00:00:00.000Z"),
      recusadoEm: new Date("2026-07-30T00:00:00.000Z"),
    });

    expect(recusado.estado).toBe("recusado");
  });

  it("expirado só quando ninguém respondeu e o prazo passou", () => {
    expect(
      situacaoDoContrato({ ...base, tokenExpiraEm: new Date("2026-08-01T00:00:00.000Z") }),
    ).toEqual({ estado: "expirado" });
  });

  it("não deixa responder em nenhum estado que não seja pendente", () => {
    for (const estado of ["confirmado", "recusado", "expirado", "invalido"] as const) {
      expect(podeResponder({ estado, em: AGORA } as never)).toBe(false);
    }
  });
});

describe("linhaDaSessao", () => {
  it("formata sem depender da pontuação do Intl, que muda com a versão do ICU", () => {
    expect(descreverSessao(SESSOES[0]!)).toBe("ter 04/08 às 14:00");
  });

  it("traz dia da semana, data e hora no fuso de Brasília", () => {
    const linha = linhaDaSessao(SESSOES[0]!, 0);

    // Se o formatador convertesse pra Brasília, sairia 11:00 e a pessoa chegaria 3h antes.
    expect(linha).toContain("14:00");
    expect(linha).toContain("04/08");
    expect(linha).toMatch(/^1\. ter/);
  });

  it("numera a partir de 1, não de 0", () => {
    expect(linhaDaSessao(SESSOES[1]!, 1)).toMatch(/^2\./);
  });
});

describe("mensagemPedidoConfirmacao", () => {
  const mensagem = mensagemPedidoConfirmacao({
    primeiroNome: "Natalia",
    servicoNome: "Drenagem linfática",
    sessoes: SESSOES,
    url: "https://exemplo.com/confirmar/abc",
  });

  it("lista TODAS as sessões — é o que a pergunta pede pra conferir", () => {
    expect(mensagem).toContain("1. ter 04/08 às 14:00");
    expect(mensagem).toContain("2. qui 06/08 às 14:00");
  });

  it("inclui nome, serviço, duração e o link", () => {
    expect(mensagem).toContain("Natalia");
    expect(mensagem).toContain("Drenagem linfática");
    expect(mensagem).toContain("60 min");
    expect(mensagem).toContain("https://exemplo.com/confirmar/abc");
  });

  it("diz como recusar — sem isso o cliente só saberia confirmar", () => {
    expect(mensagem.toLowerCase()).toContain("recusar");
  });

  it("fala no singular quando é uma sessão só", () => {
    const uma = mensagemPedidoConfirmacao({
      primeiroNome: "Ana",
      servicoNome: "Massagem",
      sessoes: [SESSOES[0]!],
      url: "https://exemplo.com/confirmar/x",
    });

    expect(uma).toContain("seu atendimento");
    expect(uma).not.toContain("suas 1 sessões");
    expect(uma).toContain("Confira a data");
  });
});

describe("mensagemConfirmadoComSucesso", () => {
  const mensagem = mensagemConfirmadoComSucesso({ primeiroNome: "Natalia", sessoes: SESSOES });

  it("confirma e promete o que a clínica combinou", () => {
    expect(mensagem).toContain("Confirmado com sucesso");
    expect(mensagem).toContain("1 dia antes");
    expect(mensagem).toContain("QR Code");
    expect(mensagem.toLowerCase()).toContain("recepção");
  });

  it("lembra a próxima sessão sem o número da lista", () => {
    expect(mensagem).toContain("ter 04/08 às 14:00");
    expect(mensagem).not.toContain("1. ter");
  });

  it("não quebra quando não há sessão", () => {
    const vazio = mensagemConfirmadoComSucesso({ primeiroNome: "Ana", sessoes: [] });

    expect(vazio).toContain("Confirmado com sucesso");
    expect(vazio).not.toContain("undefined");
  });
});

describe("mensagens de recusa e do dia", () => {
  it("na recusa avisa que a clínica vai remarcar, sem cobrança", () => {
    const mensagem = mensagemRecusaRegistrada("Natalia");

    expect(mensagem).toContain("Natalia");
    expect(mensagem.toLowerCase()).toContain("remarcar");
  });

  it("a mensagem do dia leva o link do QR e manda apresentar na recepção", () => {
    const mensagem = mensagemQrDoDia({
      primeiroNome: "Natalia",
      hora: "14:00",
      urlQr: "https://exemplo.com/portal/agendamentos",
    });

    expect(mensagem).toContain("hoje às 14:00");
    expect(mensagem).toContain("https://exemplo.com/portal/agendamentos");
    expect(mensagem.toLowerCase()).toContain("recepção");
  });
});

describe("responderConfirmacaoSchema", () => {
  it("aceita motivo ausente (null) — é o caso real ao confirmar direto, sem abrir o textarea de recusa", () => {
    // Regressão: FormData.get("motivo") devolve null (campo não existe no DOM ao confirmar), não "".
    // `.optional()` do Zod só aceita undefined; sem tratar null, TODA confirmação falhava.
    const resultado = responderConfirmacaoSchema.safeParse({
      token: "abc123",
      resposta: "confirmar",
      motivo: null,
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.motivo).toBeUndefined();
    }
  });

  it("aceita motivo em branco (recusa sem explicação)", () => {
    const resultado = responderConfirmacaoSchema.safeParse({
      token: "abc123",
      resposta: "recusar",
      motivo: "   ",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.motivo).toBeUndefined();
    }
  });

  it("aceita motivo preenchido, aparado nas pontas", () => {
    const resultado = responderConfirmacaoSchema.safeParse({
      token: "abc123",
      resposta: "recusar",
      motivo: "  só consigo à tarde  ",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.motivo).toBe("só consigo à tarde");
    }
  });

  it("recusa resposta fora de confirmar/recusar", () => {
    expect(
      responderConfirmacaoSchema.safeParse({ token: "abc123", resposta: "talvez", motivo: null })
        .success,
    ).toBe(false);
  });

  it("recusa token vazio", () => {
    expect(
      responderConfirmacaoSchema.safeParse({ token: "", resposta: "confirmar", motivo: null })
        .success,
    ).toBe(false);
  });
});
