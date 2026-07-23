import { describe, expect, it } from "vitest";

import {
  deveGerarDocumentoResumoPdf,
  montarDocumentoResumoPdf,
  removerConviteContinuacao,
} from "./documentos-resumo";

describe("documento de resumo de PDF do assistente", () => {
  it("gera documento no primeiro anexo automático e quando a pergunta pede resumo", () => {
    expect(
      deveGerarDocumentoResumoPdf({
        pergunta: "quero um resumo geral do relatorio",
        possuiAnexo: true,
      }),
    ).toBe(true);

    expect(
      deveGerarDocumentoResumoPdf({
        pergunta: "me fala sobre potassio",
        possuiAnexo: true,
      }),
    ).toBe(false);

    expect(
      deveGerarDocumentoResumoPdf({
        pergunta: "o que o documento fala sobre potassio?",
        possuiAnexo: true,
      }),
    ).toBe(false);

    expect(
      deveGerarDocumentoResumoPdf({
        pergunta: "gere um documento de resumo do relatorio",
        possuiAnexo: true,
      }),
    ).toBe(true);

    // Primeira interação automática ao anexar → já oferece o resumo completo para baixar.
    expect(
      deveGerarDocumentoResumoPdf({
        pergunta:
          'Anexei o PDF "relatorio.pdf". Faça um resumo completo e organizado do documento.',
        possuiAnexo: true,
      }),
    ).toBe(true);

    expect(
      deveGerarDocumentoResumoPdf({
        pergunta: "quero um resumo geral",
        possuiAnexo: false,
      }),
    ).toBe(false);
  });

  it("monta um arquivo PDF com nome seguro para download", () => {
    const documento = montarDocumentoResumoPdf({
      conteudo: "Conteudo do resumo.",
      nomeArquivo: "Biorressonancia_ Katia Regina do Carmo 14-02-25.pdf",
    });

    expect(documento.titulo).toContain("Biorressonancia_ Katia Regina do Carmo 14-02-25.pdf");
    expect(documento.nomeDownload).toBe(
      "Biorressonancia_-Katia-Regina-do-Carmo-14-02-25-resumo.pdf",
    );
    expect(documento.conteudo).toContain("# Resumo do PDF");
    expect(documento.conteudo).toContain("Conteudo do resumo.");
  });

  it("remove o convite de próximos passos do fim do resumo, preservando o conteúdo", () => {
    const conteudo = [
      "Boletim de biorressonância de 14/02/2025.",
      "",
      "- **Cardiovascular:** viscosidade do sangue acima da faixa.",
      "",
      "Como você gostaria de seguir: visão geral, leitura por assunto, pontos de atenção ou dúvida específica?",
    ].join("\n");

    expect(removerConviteContinuacao(conteudo)).toBe(
      [
        "Boletim de biorressonância de 14/02/2025.",
        "",
        "- **Cardiovascular:** viscosidade do sangue acima da faixa.",
      ].join("\n"),
    );

    const documento = montarDocumentoResumoPdf({ conteudo, nomeArquivo: "exame.pdf" });

    expect(documento.conteudo).toContain("Cardiovascular");
    expect(documento.conteudo).not.toContain("Como você gostaria de seguir");
    expect(documento.conteudo.trim().endsWith("?")).toBe(false);
  });

  it("não remove um fecho legítimo do resumo que por acaso termina em pergunta", () => {
    const conteudo = "Recomenda-se investigar: os valores hepáticos justificam novos exames?";

    expect(removerConviteContinuacao(conteudo)).toBe(conteudo);
  });
});
