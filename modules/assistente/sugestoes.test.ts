import { describe, expect, it } from "vitest";

import {
  gerarSugestoesAssistente,
  respostaEhPergunta,
  respostaEhRecusaDeEscrita,
  respostaPedeNomeCliente,
} from "./sugestoes";

describe("respostaEhPergunta", () => {
  it("reconhece resposta terminada em ?", () => {
    expect(respostaEhPergunta("Qual o nome do cliente?")).toBe(true);
  });

  it("ignora espaço em branco no final antes do ?", () => {
    expect(respostaEhPergunta("Qual o nome do cliente? ")).toBe(true);
  });

  it("não reconhece resposta declarativa como pergunta", () => {
    expect(respostaEhPergunta("Existe um cliente chamado Thalia Eluan.")).toBe(false);
  });

  it("não reconhece resposta que só cita um ? no meio do texto", () => {
    expect(respostaEhPergunta('Você perguntou "tem cliente?" e a resposta é sim.')).toBe(false);
  });
});

describe("respostaPedeNomeCliente", () => {
  it("reconhece resposta pedindo o nome do cliente mesmo sem terminar em interrogação", () => {
    expect(
      respostaPedeNomeCliente(
        "Qual cliente você gostaria de ver o resumo de evolução? Por favor, informe o nome ou parte do nome dele.",
      ),
    ).toBe(true);
  });

  it("não reconhece uma resposta comum sobre cliente como pedido de nome", () => {
    expect(respostaPedeNomeCliente("Encontrei a cliente Thalia Eluan.")).toBe(false);
  });
});

describe("respostaEhRecusaDeEscrita", () => {
  it("reconhece recusa de registrar", () => {
    expect(
      respostaEhRecusaDeEscrita(
        "Eu não consigo registrar ou alterar informações diretamente. Inclua essa observação na tela de edição.",
      ),
    ).toBe(true);
  });

  it("reconhece recusa de agendar", () => {
    expect(
      respostaEhRecusaDeEscrita("Não posso agendar nada por aqui — use a tela de agenda."),
    ).toBe(true);
  });

  it("não reconhece uma resposta de 'não encontrado' comum como recusa de escrita", () => {
    expect(respostaEhRecusaDeEscrita("Não consigo encontrar nenhum cliente com esse nome.")).toBe(
      false,
    );
  });

  it("não reconhece uma resposta normal, sem negação, como recusa de escrita", () => {
    expect(respostaEhRecusaDeEscrita("A cliente tem 3 sessões registradas.")).toBe(false);
  });
});

describe("gerarSugestoesAssistente", () => {
  it("usa apenas clientes reais quando a resposta pede o nome do cliente", async () => {
    const sugestoes = await gerarSugestoesAssistente({
      buscarClientesParaSugestao: async () => [{ nome: "Thalia Eluan" }],
      pergunta: "Mostre o resumo de evolução de um cliente",
      resposta:
        "Qual cliente você gostaria de ver o resumo de evolução? Por favor, informe o nome ou parte do nome dele.",
    });

    expect(sugestoes).toEqual(["Thalia Eluan"]);
    expect(sugestoes).not.toContain("João Silva");
    expect(sugestoes).not.toContain("Maria Oliveira");
    expect(sugestoes).not.toContain("Carlos");
  });

  it("não inventa clientes quando não há cliente real para sugerir", async () => {
    await expect(
      gerarSugestoesAssistente({
        buscarClientesParaSugestao: async () => [],
        pergunta: "Mostre o resumo de evolução de um cliente",
        resposta: "Qual cliente você gostaria de ver o resumo de evolução?",
      }),
    ).resolves.toEqual([]);
  });

  it("gera sugestões determinísticas sem nomes próprios fictícios", async () => {
    await expect(
      gerarSugestoesAssistente({
        pergunta: "Encontrei a cliente Thalia",
        resposta: "A cliente tem 3 sessões registradas.",
      }),
    ).resolves.toEqual([
      "Mostre as sessões recentes dessa cliente",
      "Quais pacotes ativos ela tem?",
      "Quais medicamentos estão registrados?",
    ]);
  });
});
