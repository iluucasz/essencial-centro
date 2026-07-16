import { describe, expect, it } from "vitest";

import { analisarMarkdownSimples } from "./markdown-simples";

describe("analisarMarkdownSimples", () => {
  it("retorna um único pedaço de texto quando não há markdown", () => {
    expect(analisarMarkdownSimples("Nenhum atendimento hoje.")).toEqual([
      { tipo: "texto", conteudo: "Nenhum atendimento hoje." },
    ]);
  });

  it("reconhece negrito", () => {
    expect(analisarMarkdownSimples("Saldo: **R$ 0,00**.")).toEqual([
      { tipo: "texto", conteudo: "Saldo: " },
      { tipo: "negrito", conteudo: "R$ 0,00" },
      { tipo: "texto", conteudo: "." },
    ]);
  });

  it("reconhece link", () => {
    expect(analisarMarkdownSimples("Veja [Thalia Eluan](/painel/clientes/abc-123).")).toEqual([
      { tipo: "texto", conteudo: "Veja " },
      { tipo: "link", texto: "Thalia Eluan", url: "/painel/clientes/abc-123" },
      { tipo: "texto", conteudo: "." },
    ]);
  });

  it("reconhece link mesmo com espaços acidentais em volta da url", () => {
    expect(analisarMarkdownSimples("Veja [Thalia Eluan] ( /painel/clientes/abc-123 ).")).toEqual([
      { tipo: "texto", conteudo: "Veja " },
      { tipo: "link", texto: "Thalia Eluan", url: "/painel/clientes/abc-123" },
      { tipo: "texto", conteudo: "." },
    ]);
  });

  it("reconhece link mesmo quando o modelo coloca negrito em volta", () => {
    expect(analisarMarkdownSimples("Veja **[Thalia Eluan](/painel/clientes/abc-123)**.")).toEqual([
      { tipo: "texto", conteudo: "Veja " },
      { tipo: "link", texto: "Thalia Eluan", url: "/painel/clientes/abc-123" },
      { tipo: "texto", conteudo: "." },
    ]);
  });

  it("remove negrito acidental dentro do texto do link", () => {
    expect(analisarMarkdownSimples("Veja [**Thalia Eluan**](/painel/clientes/abc-123).")).toEqual([
      { tipo: "texto", conteudo: "Veja " },
      { tipo: "link", texto: "Thalia Eluan", url: "/painel/clientes/abc-123" },
      { tipo: "texto", conteudo: "." },
    ]);
  });

  it("reconhece negrito e link misturados", () => {
    const saida = analisarMarkdownSimples(
      "**Atenção**: fale com [Thalia Eluan](/painel/clientes/abc-123) hoje.",
    );

    expect(saida).toEqual([
      { tipo: "negrito", conteudo: "Atenção" },
      { tipo: "texto", conteudo: ": fale com " },
      { tipo: "link", texto: "Thalia Eluan", url: "/painel/clientes/abc-123" },
      { tipo: "texto", conteudo: " hoje." },
    ]);
  });

  it("retorna lista vazia pra texto vazio", () => {
    expect(analisarMarkdownSimples("")).toEqual([]);
  });

  it("não trava com asterisco solto sem par", () => {
    expect(analisarMarkdownSimples("Isso é *só um asterisco*, não negrito.")).toEqual([
      { tipo: "texto", conteudo: "Isso é *só um asterisco*, não negrito." },
    ]);
  });
});
