import { describe, expect, it } from "vitest";

import { caminhoPortalSessao, montarNotificacaoSessaoConcluida } from "./notificacao";

describe("caminhoPortalSessao", () => {
  it("aponta para a sessão específica, não só a lista", () => {
    expect(caminhoPortalSessao("abc-123")).toBe("/portal/sessoes?sessao=abc-123");
  });
});

describe("montarNotificacaoSessaoConcluida", () => {
  it("monta a mensagem com região, dor e orientações quando tudo está preenchido", () => {
    const { titulo, mensagem } = montarNotificacaoSessaoConcluida({
      regiaoTratada: "Rosto",
      escalaDorAntes: 6,
      escalaDorDepois: 3,
      orientacoesPosAtendimento: "Evitar sol por 48h.",
    });

    expect(titulo).toBe("Sua sessão foi registrada");
    expect(mensagem).toContain("Área tratada: Rosto.");
    expect(mensagem).toContain("Dor antes/depois: 6 → 3.");
    expect(mensagem).toContain("Orientações: Evitar sol por 48h.");
  });

  it("cai num texto genérico quando nenhum campo client-facing foi preenchido", () => {
    const { mensagem } = montarNotificacaoSessaoConcluida({
      regiaoTratada: null,
      escalaDorAntes: null,
      escalaDorDepois: null,
      orientacoesPosAtendimento: null,
    });

    expect(mensagem).toBe("Confira os detalhes no portal.");
  });

  // Regressão: só um dos dois (antes OU depois) não é comparação válida — omitir em vez de
  // mostrar "6 → null".
  it("omite a comparação de dor quando só um dos dois lados está preenchido", () => {
    const { mensagem } = montarNotificacaoSessaoConcluida({
      regiaoTratada: null,
      escalaDorAntes: 6,
      escalaDorDepois: null,
      orientacoesPosAtendimento: null,
    });

    expect(mensagem).not.toContain("Dor antes/depois");
  });

  it("nunca inclui campos internos (avaliação/observações da profissional) — não estão no tipo aceito", () => {
    const { mensagem } = montarNotificacaoSessaoConcluida({
      regiaoTratada: "Rosto",
      escalaDorAntes: null,
      escalaDorDepois: null,
      orientacoesPosAtendimento: null,
    });

    expect(mensagem).not.toContain("avaliacaoProfissional");
    expect(mensagem).not.toContain("observacoesInternas");
  });
});
