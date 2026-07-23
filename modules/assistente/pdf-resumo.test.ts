import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";

import { montarDocumentoResumoPdf } from "./documentos-resumo";
import { montarPdfResumo } from "./pdf-resumo";

const HIFEN_NAO_SEPARAVEL = String.fromCodePoint(0x2011);
const ESPACO_FINO = String.fromCodePoint(0x202f);
const SUBSCRITO_2 = String.fromCodePoint(0x2082);

/**
 * Um resumo que reúne todos os defeitos do print: tipografia Unicode invisível, tabela markdown,
 * seções numeradas pelo modelo e régua horizontal. Se o renderizador estiver certo, nada disso cai
 * no fallback UTF-16 do jsPDF (que sai como "l e t r a   e s p a ç a d a" e estoura a margem).
 */
const conteudoProblematico = [
  "# Resumo do relatório anexado",
  "",
  "**Cliente:** Katia Regina do Carmo, 60 anos",
  `**Consumo de O${SUBSCRITO_2}:** dentro da faixa`,
  "",
  "## 1. Identificação e contexto",
  "",
  `- Repetir biorressonância em 3${HIFEN_NAO_SEPARAVEL}6${ESPACO_FINO}meses para observar tendências.`,
  "",
  "## 6. Sugestões de acompanhamento para a profissional",
  "",
  "| Área | Ação recomendada |",
  "|------|------------------|",
  "| Cardiovascular | Solicitar perfil lipídico completo |",
  "",
  "---",
].join("\n");

describe("montarPdfResumo", () => {
  it("não gera nenhuma linha com texto letra-espaçada (fallback UTF-16 do jsPDF)", () => {
    const documento = montarDocumentoResumoPdf({
      conteudo: conteudoProblematico,
      nomeArquivo: "Biorressonancia_ Katia Regina do Carmo 14-02-25.pdf",
    });
    const pdf = new jsPDF({ format: "a4", unit: "mm" });

    montarPdfResumo(pdf, documento);

    const bruto = pdf.output() as string;
    const operadoresTexto = bruto.match(/\((?:[^()\\]|\\.)*\)\s*Tj/g) ?? [];
    const linhasEspacadas = operadoresTexto.filter((operador) => / \S \S \S \S \S/.test(operador));

    expect(operadoresTexto.length).toBeGreaterThan(0);
    expect(linhasEspacadas).toEqual([]);
  });

  it("renderiza várias páginas sem lançar erro para conteúdo longo", () => {
    const secoesLongas = Array.from({ length: 8 }, (_, indice) =>
      [
        `## Seção de teste ${indice + 1}`,
        ...Array.from({ length: 6 }, (_, item) => `- Achado ${item + 1} da seção ${indice + 1}.`),
      ].join("\n"),
    ).join("\n\n");
    const documento = montarDocumentoResumoPdf({
      conteudo: secoesLongas,
      nomeArquivo: "relatorio-longo.pdf",
    });
    const pdf = new jsPDF({ format: "a4", unit: "mm" });

    expect(() => montarPdfResumo(pdf, documento)).not.toThrow();
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
