import { describe, expect, it } from "vitest";

import { montarDocumentoBiorressonancia } from "./arquivamento";

const emitidoEm = new Date(Date.UTC(2026, 1, 14, 15, 0));

describe("montarDocumentoBiorressonancia", () => {
  it("guarda o resumo e cita o arquivo original no corpo", () => {
    const { titulo, conteudo } = montarDocumentoBiorressonancia({
      nomeArquivo: "Biorressonancia_ Katia Regina do Carmo 14-02-25.pdf",
      resumo: "Recomendação terapêutica: repetir em 3 meses.",
      emitidoEm,
    });

    expect(titulo).toBe("Biorressonância — 14/02/2026");
    expect(conteudo).toContain("Biorressonancia_ Katia Regina do Carmo 14-02-25.pdf");
    expect(conteudo).toContain("Recomendação terapêutica: repetir em 3 meses.");
  });

  it("ainda gera documento quando o resumo veio vazio — o PDF é o que importa", () => {
    const { conteudo } = montarDocumentoBiorressonancia({
      nomeArquivo: "boletim.pdf",
      resumo: "   ",
      emitidoEm,
    });

    expect(conteudo).toContain("Resumo não gerado");
    expect(conteudo).toContain("boletim.pdf");
  });

  it("trunca resumo gigante para caber na coluna", () => {
    const { conteudo } = montarDocumentoBiorressonancia({
      nomeArquivo: "boletim.pdf",
      resumo: "a".repeat(15_000),
      emitidoEm,
    });

    expect(conteudo.length).toBe(10_000);
  });
});
