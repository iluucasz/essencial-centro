import { describe, expect, it } from "vitest";

import { personalizarMensagem, segmentarMensagemWhatsApp } from "./mensagens";

describe("personalizarMensagem", () => {
  it("substitui {nome} pelo nome informado", () => {
    expect(personalizarMensagem("Olá, {nome}! Tudo bem?", "Ana")).toBe("Olá, Ana! Tudo bem?");
  });

  it("substitui todas as ocorrências, não só a primeira", () => {
    expect(personalizarMensagem("{nome}, {nome}, você foi sorteada!", "Ana")).toBe(
      "Ana, Ana, você foi sorteada!",
    );
  });

  it("não altera o texto quando não há o token", () => {
    expect(personalizarMensagem("Mensagem sem variável nenhuma.", "Ana")).toBe(
      "Mensagem sem variável nenhuma.",
    );
  });

  it("aceita {nome}, {name} e variações em maiúsculas", () => {
    expect(personalizarMensagem("Olá, {NOME}! Hi, {name}!", "Ana")).toBe("Olá, Ana! Hi, Ana!");
  });
});

describe("segmentarMensagemWhatsApp", () => {
  it("identifica a formatação visual usada pelo WhatsApp sem manter os marcadores", () => {
    expect(segmentarMensagemWhatsApp("Temos *desconto* e _carinho_.")).toEqual([
      { texto: "Temos ", formato: "texto" },
      { texto: "desconto", formato: "negrito" },
      { texto: " e ", formato: "texto" },
      { texto: "carinho", formato: "italico" },
      { texto: ".", formato: "texto" },
    ]);
  });

  it("mantém marcador incompleto como texto comum", () => {
    expect(segmentarMensagemWhatsApp("Valor *especial")).toEqual([
      { texto: "Valor *especial", formato: "texto" },
    ]);
  });
});
