import { describe, expect, it } from "vitest";

import {
  analisarBlocos,
  analisarBlocosResumo,
  extrairNomeClienteResumo,
  removerMarcadoresCitacao,
  sanitizarTextoPdf,
  segmentarInline,
} from "./conteudo-resumo";

const HIFEN_NAO_SEPARAVEL = String.fromCodePoint(0x2011);
const ESPACO_FINO = String.fromCodePoint(0x202f);
const SUBSCRITO_2 = String.fromCodePoint(0x2082);
const RETICENCIAS = String.fromCodePoint(0x2026);
const ASPA_ESQUERDA = String.fromCodePoint(0x201c);
const ASPA_DIREITA = String.fromCodePoint(0x201d);
const TRAVESSAO = String.fromCodePoint(0x2013);
const EMOJI = String.fromCodePoint(0x1f600);

function cabeEmLatin1(texto: string) {
  return [...texto].every((ch) => (ch.codePointAt(0) ?? 0) <= 0xff);
}

describe("sanitizarTextoPdf", () => {
  it("garante que todo caractere do resultado cabe em Latin-1 (invariante do jsPDF)", () => {
    const entrada = `3${HIFEN_NAO_SEPARAVEL}6${ESPACO_FINO}meses O${SUBSCRITO_2} ${EMOJI} colágeno`;

    expect(cabeEmLatin1(sanitizarTextoPdf(entrada))).toBe(true);
  });

  it("preserva acentos do português", () => {
    const entrada = "avaliação de colágeno hepático e função endócrina";

    expect(sanitizarTextoPdf(entrada)).toBe(entrada);
  });

  it("troca hífen não separável por '-' e espaço fino por espaço normal", () => {
    const entrada = `Repetir em 3${HIFEN_NAO_SEPARAVEL}6${ESPACO_FINO}meses`;

    expect(sanitizarTextoPdf(entrada)).toBe("Repetir em 3-6 meses");
  });

  it("converte subscrito, reticências, aspas curvas e travessão", () => {
    const entrada = `consumo de O${SUBSCRITO_2}${RETICENCIAS} ${ASPA_ESQUERDA}risco${ASPA_DIREITA} 60${TRAVESSAO}anos`;

    expect(sanitizarTextoPdf(entrada)).toBe('consumo de O2... "risco" 60-anos');
  });

  it("descarta caracteres fora de Latin-1 como emoji", () => {
    expect(sanitizarTextoPdf(`a${EMOJI}b`)).toBe("ab");
  });
});

describe("segmentarInline", () => {
  it("marca o trecho em negrito e mantém o valor sem negrito", () => {
    const segmentos = segmentarInline("**Cliente:** Katia Regina");

    expect(segmentos[0]).toEqual({ texto: "Cliente:", negrito: true });
    expect(segmentos.at(-1)).toEqual({ texto: " Katia Regina", negrito: false });
  });

  it("preserva a url do link para o chat linkar", () => {
    const segmentos = segmentarInline("Veja [Katia](/painel/clientes/1) aqui");

    expect(segmentos).toContainEqual({ texto: "Katia", negrito: false, url: "/painel/clientes/1" });
  });
});

describe("removerMarcadoresCitacao", () => {
  it("remove marcadores 【...】 que o modelo injeta", () => {
    expect(removerMarcadoresCitacao("Viscosidade: 72,708 (+++)【0†L1-L4】")).toBe(
      "Viscosidade: 72,708 (+++)",
    );
  });
});

describe("analisarBlocos", () => {
  it("interpreta títulos, listas e tabelas e remove citações e réguas", () => {
    const conteudo = [
      "## Achados por área【0†L1】",
      "- Viscosidade do sangue: 72,708【0†L2-L4】",
      "| Marcador | Valor |",
      "|---|---|",
      "| Olhos | 5,813 |",
      "---",
      "> Atenção: apenas apoio.",
    ].join("\n");
    const blocos = analisarBlocos(conteudo);

    expect(blocos[0]).toEqual({ tipo: "titulo", nivel: 2, texto: "Achados por área" });
    expect(blocos[1]).toMatchObject({ tipo: "lista" });
    expect(blocos.find((bloco) => bloco.tipo === "tabela")).toMatchObject({
      colunas: ["Marcador", "Valor"],
      linhas: [["Olhos", "5,813"]],
    });
    // régua "---" não vira bloco; citação sumiu do texto da lista.
    const lista = blocos[1];
    expect(lista.tipo === "lista" && lista.segmentos.map((s) => s.texto).join("")).not.toContain(
      "†",
    );
    expect(blocos.at(-1)).toMatchObject({ tipo: "paragrafo" });
  });

  it("mantém a tabela inteira mesmo com linhas em branco entre as linhas", () => {
    const conteudo = [
      "| Marcador | Valor |",
      "",
      "|---|---|",
      "",
      "| Olhos | 5,813 |",
      "",
      "| Dentes | 8,061 |",
    ].join("\n");
    const tabelas = analisarBlocos(conteudo).filter((bloco) => bloco.tipo === "tabela");

    expect(tabelas).toHaveLength(1);
    expect(tabelas[0]).toMatchObject({
      colunas: ["Marcador", "Valor"],
      linhas: [
        ["Olhos", "5,813"],
        ["Dentes", "8,061"],
      ],
    });
  });
});

describe("extrairNomeClienteResumo", () => {
  it("extrai o nome do cliente do rótulo em negrito", () => {
    expect(extrairNomeClienteResumo("**Cliente:** Katia Regina do Carmo")).toBe(
      "Katia Regina do Carmo",
    );
  });

  it("corta em vírgula quando o nome vem junto com idade/medidas", () => {
    expect(
      extrairNomeClienteResumo(
        "# Resumo\n\n## Identificação\n**Cliente:** Katia Regina do Carmo, 60 anos, 151 cm, 69 kg",
      ),
    ).toBe("Katia Regina do Carmo");
  });

  it("retorna null quando não há rótulo de cliente", () => {
    expect(extrairNomeClienteResumo("## Resumo geral\n- Achado qualquer")).toBeNull();
  });
});

describe("analisarBlocosResumo", () => {
  it("remove a numeração das seções e ignora o título duplicado do documento", () => {
    const blocos = analisarBlocosResumo(
      "# Resumo do PDF: exame.pdf\n\n## 1. Identificação e contexto\n\n- Avaliação multiparamétrica",
      "Resumo do PDF: exame.pdf",
    );
    const titulos = blocos.filter((bloco) => bloco.tipo === "titulo");

    expect(titulos).toHaveLength(1);
    expect(titulos[0]).toMatchObject({ nivel: 2, texto: "Identificação e contexto" });
    expect(blocos.some((bloco) => bloco.tipo === "titulo" && /\d/.test(bloco.texto))).toBe(false);
  });

  it("mantém cada rótulo em negrito em seu próprio parágrafo (não gruda linhas)", () => {
    const blocos = analisarBlocosResumo(
      "**Cliente:** Katia Regina, 60 anos\n**Data do exame:** 14/02/2025",
      "Resumo",
    );
    const paragrafos = blocos.filter((bloco) => bloco.tipo === "paragrafo");

    expect(paragrafos).toHaveLength(2);
    expect(paragrafos[0].tipo === "paragrafo" && paragrafos[0].segmentos[0]).toEqual({
      texto: "Cliente:",
      negrito: true,
    });
    expect(paragrafos[1].tipo === "paragrafo" && paragrafos[1].segmentos[0]).toEqual({
      texto: "Data do exame:",
      negrito: true,
    });
  });

  it("interpreta uma tabela markdown descartando a linha separadora", () => {
    const blocos = analisarBlocosResumo(
      "| Área | Ação recomendada |\n|------|------------------|\n| Cardiovascular | Solicitar perfil lipídico |",
      "Resumo",
    );
    const tabela = blocos.find((bloco) => bloco.tipo === "tabela");

    expect(tabela).toMatchObject({
      tipo: "tabela",
      colunas: ["Área", "Ação recomendada"],
      linhas: [["Cardiovascular", "Solicitar perfil lipídico"]],
    });
  });

  it("ignora réguas horizontais ---", () => {
    const blocos = analisarBlocosResumo("Primeiro achado\n\n---\n\nSegundo achado", "Resumo");
    const paragrafos = blocos.filter((bloco) => bloco.tipo === "paragrafo");

    expect(paragrafos).toHaveLength(2);
  });
});
