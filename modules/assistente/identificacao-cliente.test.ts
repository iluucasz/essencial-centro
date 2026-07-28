import { describe, expect, it } from "vitest";

import { encontrarClienteDoDocumento } from "./identificacao-cliente";

const clientes = [
  { id: "c1", nome: "Katia Regina do Carmo" },
  { id: "c2", nome: "Adriana Souza Lima" },
  { id: "c3", nome: "Marcos Vinicius Alves" },
];

describe("encontrarClienteDoDocumento", () => {
  it("acha o cliente pelo nome no arquivo do boletim de biorressonância", () => {
    const correspondencia = encontrarClienteDoDocumento({
      clientes,
      nomeArquivo: "Biorressonancia_ Katia Regina do Carmo 14-02-25.pdf",
      texto: "Boletim de análise.",
    });

    expect(correspondencia?.cliente.id).toBe("c1");
    expect(correspondencia?.confianca).toBe(1);
    expect(correspondencia?.ambigua).toBe(false);
  });

  it("acha pelo cabeçalho do PDF mesmo com o arquivo sem nome e com acentuação diferente", () => {
    const correspondencia = encontrarClienteDoDocumento({
      clientes,
      nomeArquivo: "relatorio-001.pdf",
      texto: "Paciente: KÁTIA REGINA DO CARMO\nData: 14/02/2025",
    });

    expect(correspondencia?.cliente.id).toBe("c1");
  });

  it("não confunde nomes que são substring de outros", () => {
    const correspondencia = encontrarClienteDoDocumento({
      clientes: [{ id: "c9", nome: "Ana" }],
      nomeArquivo: "Biorressonancia_ Adriana Souza Lima.pdf",
      texto: "Paciente: Adriana Souza Lima",
    });

    expect(correspondencia).toBeNull();
  });

  it("ignora o texto do corpo e olha só o cabeçalho de identificação", () => {
    const corpoLongo = "conteúdo clínico irrelevante. ".repeat(200);

    const correspondencia = encontrarClienteDoDocumento({
      clientes,
      nomeArquivo: "boletim.pdf",
      texto: `Paciente: Adriana Souza Lima\n${corpoLongo}Marcos Vinicius Alves`,
    });

    expect(correspondencia?.cliente.id).toBe("c2");
  });

  it("retorna null quando ninguém passa da confiança mínima", () => {
    const correspondencia = encontrarClienteDoDocumento({
      clientes,
      nomeArquivo: "boletim-sem-identificacao.pdf",
      texto: "Documento sem nome de paciente.",
    });

    expect(correspondencia).toBeNull();
  });

  it("não pontua com um único termo solto do nome", () => {
    const correspondencia = encontrarClienteDoDocumento({
      clientes,
      nomeArquivo: "boletim.pdf",
      texto: "Encaminhado por Regina, recepcionista.",
    });

    expect(correspondencia).toBeNull();
  });

  it("marca ambígua quando dois clientes homônimos empatam", () => {
    const correspondencia = encontrarClienteDoDocumento({
      clientes: [
        { id: "c1", nome: "Katia Regina do Carmo" },
        { id: "c2", nome: "Katia Regina do Carmo" },
      ],
      nomeArquivo: "Biorressonancia_ Katia Regina do Carmo.pdf",
      texto: "",
    });

    expect(correspondencia?.ambigua).toBe(true);
  });
});
