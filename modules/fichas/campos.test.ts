import { describe, expect, it } from "vitest";

import {
  camposModeloSchema,
  camposVisiveisParaCliente,
  validarRespostasModelo,
  valoresIniciais,
  type CampoModelo,
} from "./campos";

function campo(parcial: Partial<CampoModelo> & Pick<CampoModelo, "id" | "tipo" | "rotulo">) {
  return {
    obrigatorio: false,
    quemPreenche: "cliente" as const,
    ...parcial,
  } as CampoModelo;
}

describe("validarRespostasModelo", () => {
  it("exige campo de texto obrigatório e aceita quando preenchido", () => {
    const campos = [
      campo({ id: "queixa", tipo: "texto_curto", rotulo: "Queixa", obrigatorio: true }),
    ];

    expect(validarRespostasModelo(campos, { queixa: "" }).ok).toBe(false);
    expect(validarRespostasModelo(campos, { queixa: "Dor lombar" })).toMatchObject({
      ok: true,
      dados: { queixa: "Dor lombar" },
    });
  });

  it("coage número e rejeita opção fora da lista", () => {
    const campos = [
      campo({ id: "idade", tipo: "numero", rotulo: "Idade" }),
      campo({
        id: "fototipo",
        tipo: "selecao_unica",
        rotulo: "Fototipo",
        obrigatorio: true,
        opcoes: ["I", "II", "III"],
      }),
    ];

    const ok = validarRespostasModelo(campos, { idade: "60", fototipo: "II" });
    expect(ok).toMatchObject({ ok: true, dados: { idade: 60, fototipo: "II" } });

    expect(validarRespostasModelo(campos, { idade: "60", fototipo: "X" }).ok).toBe(false);
    expect(validarRespostasModelo(campos, { idade: "60", fototipo: "" }).ok).toBe(false);
  });

  it("seleção múltipla obrigatória exige ao menos uma opção válida", () => {
    const campos = [
      campo({
        id: "sistemas",
        tipo: "selecao_multipla",
        rotulo: "Sistemas",
        obrigatorio: true,
        opcoes: ["Coração", "Diabetes"],
      }),
    ];

    expect(validarRespostasModelo(campos, { sistemas: [] }).ok).toBe(false);
    expect(validarRespostasModelo(campos, { sistemas: ["Coração"] }).ok).toBe(true);
    expect(validarRespostasModelo(campos, { sistemas: ["Outro"] }).ok).toBe(false);
  });

  it("sim/não com detalhe exige o detalhe quando 'Sim' e obrigatório", () => {
    const campos = [
      campo({
        id: "cirurgia",
        tipo: "sim_nao",
        rotulo: "Fez cirurgia?",
        obrigatorio: true,
        detalheSeSim: true,
      }),
    ];

    expect(validarRespostasModelo(campos, { cirurgia: { valor: true, detalhe: "" } }).ok).toBe(
      false,
    );
    expect(
      validarRespostasModelo(campos, { cirurgia: { valor: true, detalhe: "Apendicite 2020" } }).ok,
    ).toBe(true);
    expect(validarRespostasModelo(campos, { cirurgia: { valor: false, detalhe: "" } }).ok).toBe(
      true,
    );
  });

  it("aceite obrigatório precisa ser verdadeiro", () => {
    const campos = [campo({ id: "termo", tipo: "aceite", rotulo: "Aceito", obrigatorio: true })];

    expect(validarRespostasModelo(campos, { termo: false }).ok).toBe(false);
    expect(validarRespostasModelo(campos, { termo: true }).ok).toBe(true);
  });

  it("ignora campos de layout (seção/parágrafo) na validação e nos valores iniciais", () => {
    const campos = [
      campo({ id: "titulo", tipo: "secao", rotulo: "Dados pessoais" }),
      campo({ id: "nome", tipo: "texto_curto", rotulo: "Nome" }),
    ];

    expect(Object.keys(valoresIniciais(campos))).toEqual(["nome"]);
    expect(validarRespostasModelo(campos, { nome: "Ana" }).ok).toBe(true);
  });
});

describe("camposModeloSchema", () => {
  it("recusa ids duplicados e modelo sem nenhum campo de resposta", () => {
    expect(
      camposModeloSchema.safeParse([
        campo({ id: "x", tipo: "texto_curto", rotulo: "A" }),
        campo({ id: "x", tipo: "texto_curto", rotulo: "B" }),
      ]).success,
    ).toBe(false);

    expect(
      camposModeloSchema.safeParse([campo({ id: "s", tipo: "secao", rotulo: "Só seção" })]).success,
    ).toBe(false);
  });

  it("exige opções em campos de seleção", () => {
    expect(
      camposModeloSchema.safeParse([campo({ id: "s", tipo: "selecao_unica", rotulo: "Sel" })])
        .success,
    ).toBe(false);

    expect(
      camposModeloSchema.safeParse([
        campo({ id: "s", tipo: "selecao_unica", rotulo: "Sel", opcoes: ["A"] }),
      ]).success,
    ).toBe(true);
  });
});

describe("camposVisiveisParaCliente", () => {
  it("oculta campos só da profissional e mantém seções e campos do cliente", () => {
    const campos = [
      campo({ id: "sec", tipo: "secao", rotulo: "Seção" }),
      campo({ id: "queixa", tipo: "texto_curto", rotulo: "Queixa" }),
      campo({
        id: "obs",
        tipo: "texto_longo",
        rotulo: "Observações internas",
        quemPreenche: "profissional",
      }),
    ];

    expect(camposVisiveisParaCliente(campos).map((c) => c.id)).toEqual(["sec", "queixa"]);
  });
});

/**
 * `selecao_imagem` grava o RÓTULO da opção, não a URL — se a imagem for trocada depois, a resposta
 * antiga continua legível. Estes testes fixam isso e a validação do modelo.
 */
describe("selecao_imagem", () => {
  const bristol = campo({
    id: "bristol",
    tipo: "selecao_imagem",
    rotulo: "Qual se parece mais com o seu?",
    opcoesImagem: [
      { rotulo: "Tipo 1", imagem: "https://blob.example.com/t1.png", descricao: "Bolinhas duras." },
      { rotulo: "Tipo 4", imagem: "https://blob.example.com/t4.png" },
    ],
  });

  it("aceita o rótulo de uma opção e recusa valor fora da lista", () => {
    expect(validarRespostasModelo([bristol], { bristol: "Tipo 4" })).toMatchObject({
      ok: true,
      dados: { bristol: "Tipo 4" },
    });
    expect(validarRespostasModelo([bristol], { bristol: "Tipo 9" }).ok).toBe(false);
  });

  it("recusa a URL como resposta — o que vale é o rótulo", () => {
    expect(
      validarRespostasModelo([bristol], { bristol: "https://blob.example.com/t4.png" }).ok,
    ).toBe(false);
  });

  it("aceita vazio quando não é obrigatório e exige escolha quando é", () => {
    expect(validarRespostasModelo([bristol], { bristol: "" }).ok).toBe(true);

    const exigido = { ...bristol, obrigatorio: true };
    expect(validarRespostasModelo([exigido], { bristol: "" }).ok).toBe(false);
    expect(validarRespostasModelo([exigido], { bristol: "Tipo 1" }).ok).toBe(true);
  });

  it("começa vazio no formulário", () => {
    expect(valoresIniciais([bristol])).toEqual({ bristol: "" });
  });

  it("exige ao menos duas opções — escolha com uma só não é escolha", () => {
    const comUma = camposModeloSchema.safeParse([
      { ...bristol, opcoesImagem: [bristol.opcoesImagem![0]] },
    ]);
    expect(comUma.success).toBe(false);

    expect(camposModeloSchema.safeParse([{ ...bristol, opcoesImagem: [] }]).success).toBe(false);
    expect(camposModeloSchema.safeParse([bristol]).success).toBe(true);
  });

  it("recusa rótulo repetido, que tornaria a resposta ambígua", () => {
    const repetido = camposModeloSchema.safeParse([
      {
        ...bristol,
        opcoesImagem: [
          { rotulo: "Tipo 1", imagem: "https://blob.example.com/a.png" },
          { rotulo: "Tipo 1", imagem: "https://blob.example.com/b.png" },
        ],
      },
    ]);

    expect(repetido.success).toBe(false);
  });

  it("recusa opção sem imagem válida", () => {
    const semUrl = camposModeloSchema.safeParse([
      {
        ...bristol,
        opcoesImagem: [
          { rotulo: "Tipo 1", imagem: "nao-e-url" },
          { rotulo: "Tipo 4", imagem: "https://blob.example.com/t4.png" },
        ],
      },
    ]);

    expect(semUrl.success).toBe(false);
  });

  it("é visível ao cliente como qualquer campo de audiência cliente", () => {
    expect(camposVisiveisParaCliente([bristol])).toHaveLength(1);
    expect(camposVisiveisParaCliente([{ ...bristol, quemPreenche: "profissional" }])).toHaveLength(
      0,
    );
  });
});
