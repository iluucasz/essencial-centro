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

  it("contém a regra inegociável sobre medicamentos", () => {
    const prompt = montarPromptSistema({
      dataAtual: new Date("2026-07-15T12:00:00.000Z"),
      nomeProfissional: "Ana Souza",
    });

    expect(prompt).toContain("NUNCA sugere, recomenda, calcula ou avalia");
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
});
