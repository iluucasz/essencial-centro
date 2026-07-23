import { describe, expect, it } from "vitest";

import {
  dividirTextoEmTrechos,
  montarContextoAnexoAssistente,
  podeUsarAnexosAssistente,
  selecionarTrechosDocumento,
  validarArquivoPdf,
} from "./anexos";

describe("anexos do assistente", () => {
  it("autoriza anexos apenas para profissional", () => {
    expect(podeUsarAnexosAssistente("profissional")).toBe(true);
    expect(podeUsarAnexosAssistente("cliente")).toBe(false);
    expect(podeUsarAnexosAssistente("recepcao")).toBe(false);
    expect(podeUsarAnexosAssistente(null)).toBe(false);
  });

  it("valida que o arquivo enviado e um PDF dentro do limite", () => {
    expect(
      validarArquivoPdf({
        nome: "Biorressonancia.pdf",
        tamanhoBytes: 10_000,
        tipo: "application/pdf",
      }),
    ).toMatchObject({ valido: true, nomeArquivo: "Biorressonancia.pdf" });

    expect(
      validarArquivoPdf({ nome: "foto.png", tamanhoBytes: 10_000, tipo: "image/png" }),
    ).toMatchObject({ valido: false });

    expect(
      validarArquivoPdf({
        nome: "grande.pdf",
        tamanhoBytes: 21 * 1024 * 1024,
        tipo: "application/pdf",
      }),
    ).toMatchObject({ valido: false });
  });

  it("divide o texto longo em trechos com sobreposicao", () => {
    const texto = "a".repeat(1_200);
    const trechos = dividirTextoEmTrechos(texto, 500, 100);

    expect(trechos).toHaveLength(3);
    expect(trechos[1]?.inicio).toBe(400);
  });

  it("seleciona trechos relevantes para uma pergunta focada", () => {
    const texto = [
      "Inicio do documento com informacoes gerais. ".repeat(30),
      "Topico mineralograma: zinco baixo, magnesio baixo e cobre elevado. ".repeat(20),
      "Encerramento com orientacoes administrativas. ".repeat(30),
    ].join("\n");

    const trechos = selecionarTrechosDocumento({
      limiteCaracteres: 3_500,
      pergunta: "o que o PDF fala sobre magnesio e zinco?",
      texto,
    });

    expect(trechos.map((trecho) => trecho.texto).join("\n")).toContain("magnesio");
    expect(trechos.length).toBeLessThanOrEqual(2);
  });

  it("monta contexto do anexo com metadados e trechos do PDF", () => {
    const contexto = montarContextoAnexoAssistente({
      anexo: {
        nomeArquivo: "Biorressonancia.pdf",
        textoExtraido: "Resumo metabolico do exame. ".repeat(100),
        totalCaracteres: 2_800,
        totalPaginas: 12,
      },
      pergunta: "resuma o documento",
    });

    expect(contexto).toContain("Biorressonancia.pdf");
    expect(contexto).toContain("Páginas: 12");
    expect(contexto).toContain("Trecho 1 do PDF");
  });
});
