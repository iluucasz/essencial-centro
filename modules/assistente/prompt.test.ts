import { describe, expect, it } from "vitest";

import { montarPromptSistema } from "./prompt";

describe("montarPromptSistema", () => {
  it("interpola nome da profissional e data", () => {
    const prompt = montarPromptSistema({
      dataAtual: new Date("2026-07-15T12:00:00.000Z"),
      nomeProfissional: "Ana Souza",
    });

    expect(prompt).toContain("Ana Souza");
    expect(prompt).toContain("2026");
  });

  it("permite recomendações de apoio com salvaguardas (disclaimer, porquê, alergias)", () => {
    const prompt = montarPromptSistema({
      dataAtual: new Date("2026-07-15T12:00:00.000Z"),
      nomeProfissional: "Ana Souza",
    });

    expect(prompt).toContain("apoio à decisão");
    expect(prompt).toContain(
      "a decisão final e a avaliação clínica são exclusivas da profissional",
    );
    expect(prompt.toLowerCase()).toContain("alergia");
    expect(prompt.toLowerCase()).toContain("medicament");
  });

  it("instrui a sempre usar ferramentas antes de responder fatos", () => {
    const prompt = montarPromptSistema({
      dataAtual: new Date("2026-07-15T12:00:00.000Z"),
      nomeProfissional: "Ana Souza",
    });

    expect(prompt).toContain("nunca invente");
  });

  it("instrui a linkar o nome do cliente com a url de buscar_clientes", () => {
    const prompt = montarPromptSistema({
      dataAtual: new Date("2026-07-15T12:00:00.000Z"),
      nomeProfissional: "Ana Souza",
    });

    expect(prompt).toContain("[Nome do Cliente](url)");
    expect(prompt).toContain("Nunca invente uma url");
  });

  it("instrui a consultar clientes quando a pergunta fala de um cliente sem nome", () => {
    const prompt = montarPromptSistema({
      dataAtual: new Date("2026-07-15T12:00:00.000Z"),
      nomeProfissional: "Ana Souza",
    });

    expect(prompt).toContain("chame buscar_clientes sem busca");
    expect(prompt).toContain("Exatamente 1 cliente cadastrado");
    expect(prompt).toContain("Nunca mostre nomes fictícios");
  });

  it("descreve a navegação real de medicamentos sem inventar menu de pacientes", () => {
    const prompt = montarPromptSistema({
      dataAtual: new Date("2026-07-15T12:00:00.000Z"),
      nomeProfissional: "Ana Souza",
    });

    expect(prompt).toContain('Nunca chame o item "Clientes" de "Pacientes"');
    expect(prompt).toContain("não é um item do menu lateral");
    expect(prompt).toContain("Medicamentos informados e alertas de segurança");
    expect(prompt).toContain("menu Clientes");
  });

  it("proíbe a IA de escrever a lista de próximas perguntas dentro da resposta", () => {
    const prompt = montarPromptSistema({
      dataAtual: new Date("2026-07-15T12:00:00.000Z"),
      nomeProfissional: "Ana Souza",
    });

    expect(prompt).toContain("Nunca termine a resposta com uma lista");
    expect(prompt).toContain("não termine com frases genéricas de disponibilidade");
  });

  it("ativa instruções especiais quando existe PDF anexado", () => {
    const prompt = montarPromptSistema({
      contextoAnexo: "Arquivo PDF ativo: exame.pdf",
      dataAtual: new Date("2026-07-15T12:00:00.000Z"),
      nomeProfissional: "Ana Souza",
    });

    expect(prompt).toContain("Modo de análise de PDF ativo");
    expect(prompt).toContain("browser_search");
    expect(prompt).toContain("Arquivo PDF ativo: exame.pdf");
    // O sujeito do PDF não é cliente cadastrado por padrão — não vira link de perfil.
    expect(prompt).toContain("sujeito do documento");
    expect(prompt).toContain("NUNCA como link de perfil");
    expect(prompt).toContain("nunca exponha seu raciocínio interno");
    expect(prompt).toContain("relatório completo e bem organizado");
    expect(prompt).toContain("# Resumo do relatório anexado");
    expect(prompt).toContain("## Achados por área ou sistema");
    expect(prompt).toContain("Sugestões de acompanhamento para a profissional");
    expect(prompt).toContain("Não diga apenas que fez uma leitura inicial");
    expect(prompt).toContain('Não termine respostas de PDF com "estou à disposição"');
  });
});
