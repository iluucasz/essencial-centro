import { describe, expect, it } from "vitest";

import { respostaEhPergunta, respostaEhRecusaDeEscrita } from "./sugestoes";

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
