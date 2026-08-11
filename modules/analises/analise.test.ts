import { describe, expect, it } from "vitest";

import {
  analiseUtilizavel,
  montarPromptAnalise,
  montarPromptRefinamento,
  rotulosStatusRevisao,
  rotulosTipoAnalise,
  statusRevisao,
  tipoExigeArquivo,
  tiposAnalise,
  tituloPadrao,
} from "./analise";

/**
 * O prompt é a única coisa que impede a IA de virar "diagnóstico automático" num prontuário. Se
 * alguém enxugar essas instruções, nada quebra na tela — só o registro clínico fica pior. Estes
 * testes fixam o que não pode sumir.
 */
describe("montarPromptAnalise — política clínica", () => {
  it.each(tiposAnalise)("em %s proíbe diagnóstico e prescrição", (tipo) => {
    const prompt = montarPromptAnalise({
      tipo,
      primeiroNomeCliente: "Ana",
      material: "conteúdo do material",
    });

    expect(prompt).toContain("apoio à decisão");
    expect(prompt.toLowerCase()).toContain("não feche diagnóstico");
    expect(prompt.toLowerCase()).toContain("não prescreva");
  });

  it.each(tiposAnalise)("em %s proíbe inventar valor ausente", (tipo) => {
    const prompt = montarPromptAnalise({
      tipo,
      primeiroNomeCliente: "Ana",
      material: "conteúdo",
    });

    expect(prompt).toContain("não consta no material");
  });

  it.each(tiposAnalise)("em %s proíbe calcular interação por conta própria", (tipo) => {
    // Mesma restrição de `modules/medicamentos`: o sistema nunca calcula interação.
    const prompt = montarPromptAnalise({ tipo, primeiroNomeCliente: "Ana", material: "x" });

    expect(prompt).toContain("Não calcule interação medicamentosa");
  });

  it("avisa que biorressonância não é exame laboratorial", () => {
    const prompt = montarPromptAnalise({
      tipo: "biorressonancia",
      primeiroNomeCliente: "Ana",
      material: "boletim",
    });

    expect(prompt).toContain("não é exame laboratorial");
  });

  it("na recomendação deixa explícito que não é prescrição", () => {
    const prompt = montarPromptAnalise({
      tipo: "recomendacao",
      primeiroNomeCliente: "Ana",
      material: "histórico",
    });

    expect(prompt).toContain("Nada aqui é prescrição");
    expect(prompt).toContain("O que não dá para concluir");
  });
});

describe("montarPromptAnalise — montagem", () => {
  it("inclui o material entre delimitadores, pra não se misturar com a instrução", () => {
    const prompt = montarPromptAnalise({
      tipo: "exame",
      primeiroNomeCliente: "Ana",
      material: "Hemoglobina 10,2 g/dL",
    });

    expect(prompt).toContain("---\nHemoglobina 10,2 g/dL\n---");
  });

  it("usa só o primeiro nome — não despeja o cadastro no prompt", () => {
    const prompt = montarPromptAnalise({
      tipo: "exame",
      primeiroNomeCliente: "Ana",
      material: "x",
    });

    expect(prompt).toContain("Cliente: Ana.");
  });

  it("anexa o contexto clínico quando informado", () => {
    const prompt = montarPromptAnalise({
      tipo: "exame",
      primeiroNomeCliente: "Ana",
      material: "x",
      contextoClinico: "- Alergias: dipirona",
    });

    expect(prompt).toContain("Já registrado no prontuário desta cliente:");
    expect(prompt).toContain("- Alergias: dipirona");
  });

  it("omite o bloco de contexto quando vazio, em vez de deixar cabeçalho solto", () => {
    const prompt = montarPromptAnalise({
      tipo: "exame",
      primeiroNomeCliente: "Ana",
      material: "x",
      contextoClinico: "   ",
    });

    expect(prompt).not.toContain("Já registrado no prontuário");
  });
});

describe("montarPromptRefinamento", () => {
  const base = {
    tipo: "exame" as const,
    analiseAtual: "## Resumo\nFerritina abaixo da referência.",
    instrucao: "Seja mais objetiva nos itens alterados.",
  };

  it("reenvia a política — a instrução da profissional não pode furar a regra", () => {
    const prompt = montarPromptRefinamento({ ...base, material: "Ferritina 8 ng/mL" });

    expect(prompt).toContain("apoio à decisão");
    expect(prompt.toLowerCase()).toContain("não feche diagnóstico");
  });

  it("reenvia o material de origem — sem ele o modelo inventaria o valor que não lembra", () => {
    const prompt = montarPromptRefinamento({ ...base, material: "Ferritina 8 ng/mL" });

    expect(prompt).toContain("Ferritina 8 ng/mL");
    expect(prompt).toContain("a única fonte de fato");
  });

  it("quando o material não existe mais, proíbe explicitamente acrescentar dado novo", () => {
    const prompt = montarPromptRefinamento({ ...base, material: null });

    expect(prompt).toContain("não está mais disponível");
    expect(prompt).toContain("não");
    expect(prompt).toContain("acrescente dado novo");
  });

  it("manda devolver a análise inteira, não um comentário sobre a mudança", () => {
    const prompt = montarPromptRefinamento({ ...base, material: "x" });

    expect(prompt).toContain("Reescreva a análise INTEIRA");
    expect(prompt).toContain("nem explique o que mudou");
    expect(prompt).toContain("pronta para substituir a anterior");
  });

  it("separa análise atual e instrução em blocos distintos", () => {
    const prompt = montarPromptRefinamento({ ...base, material: "x" });

    expect(prompt).toContain("Análise atual:");
    expect(prompt).toContain("Ajuste pedido pela profissional:");
    expect(prompt).toContain(base.instrucao);
  });
});

describe("tipoExigeArquivo", () => {
  it("exige PDF em exame e biorressonância, e não na recomendação", () => {
    expect(tipoExigeArquivo("exame")).toBe(true);
    expect(tipoExigeArquivo("biorressonancia")).toBe(true);
    expect(tipoExigeArquivo("recomendacao")).toBe(false);
  });
});

describe("tituloPadrao", () => {
  it("usa o nome do arquivo sem a extensão", () => {
    expect(tituloPadrao("exame", "hemograma-marco.pdf")).toBe("hemograma-marco");
    expect(tituloPadrao("exame", "LAUDO.PDF")).toBe("LAUDO");
  });

  it("cai no rótulo do tipo quando não há arquivo", () => {
    expect(tituloPadrao("recomendacao")).toBe(rotulosTipoAnalise.recomendacao);
    expect(tituloPadrao("exame", "   ")).toBe(rotulosTipoAnalise.exame);
  });

  it("limita o tamanho do título", () => {
    expect(tituloPadrao("exame", `${"a".repeat(400)}.pdf`).length).toBeLessThanOrEqual(160);
  });
});

describe("statusRevisao", () => {
  it("nasce rascunho e vira revisada só com data", () => {
    expect(statusRevisao(null)).toBe("rascunho");
    expect(statusRevisao(undefined)).toBe("rascunho");
    expect(statusRevisao(new Date())).toBe("revisada");
  });

  it("o rótulo de rascunho deixa claro que não foi revisado", () => {
    expect(rotulosStatusRevisao.rascunho.toLowerCase()).toContain("não revisado");
  });
});

describe("analiseUtilizavel", () => {
  it("recusa vazio e resposta curta demais pra ser análise", () => {
    // A Groq às vezes devolve vazio por estourar o teto raciocinando; guardar isso viraria um
    // registro clínico em branco no prontuário.
    expect(analiseUtilizavel(null)).toBe(false);
    expect(analiseUtilizavel("")).toBe(false);
    expect(analiseUtilizavel("   ")).toBe(false);
    expect(analiseUtilizavel("Ok.")).toBe(false);
  });

  it("aceita uma análise de tamanho plausível", () => {
    expect(analiseUtilizavel("## Resumo\nExame com hemoglobina abaixo da referência.")).toBe(true);
  });
});
