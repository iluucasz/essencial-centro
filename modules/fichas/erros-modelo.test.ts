import { describe, expect, it } from "vitest";

import { descreverErrosDoModelo } from "./erros-modelo";
import { salvarModeloFichaSchema } from "./schema";

/**
 * O construtor mostra uma caixa vermelha só. Com 22 campos na tela, "Revise os dados do modelo." não
 * dá pra agir — a mensagem precisa dizer QUAL campo e POR QUÊ. `flatten().fieldErrors` não serve
 * porque perde tudo que está dentro de `campos[i]`.
 */
function erroDe(entrada: unknown) {
  const parsed = salvarModeloFichaSchema.safeParse(entrada);
  if (parsed.success) throw new Error("esperava erro de validação");

  return parsed.error;
}

const campoValido = {
  id: "c1",
  tipo: "texto_curto" as const,
  rotulo: "Queixa",
  obrigatorio: false,
  quemPreenche: "cliente" as const,
};

describe("descreverErrosDoModelo", () => {
  it("aponta o número e o título do campo com problema", () => {
    const campos = [
      campoValido,
      {
        ...campoValido,
        id: "c2",
        tipo: "selecao_imagem" as const,
        rotulo: "Qual imagem se parece com a sua?",
        opcoesImagem: [{ rotulo: "Tipo 1", imagem: "https://blob.example.com/t1.png" }],
      },
    ];

    const mensagem = descreverErrosDoModelo(
      erroDe({ nome: "Modelo", descricao: "", ativo: true, campos }),
      campos,
    );

    expect(mensagem).toContain("Campo 2");
    expect(mensagem).toContain("Qual imagem se parece com a sua?");
    expect(mensagem).toContain("ao menos duas opções");
  });

  it("não devolve mais a mensagem genérica quando há problema conhecido", () => {
    const campos = [
      {
        ...campoValido,
        tipo: "selecao_imagem" as const,
        opcoesImagem: [{ rotulo: "Só uma", imagem: "https://blob.example.com/a.png" }],
      },
    ];

    const mensagem = descreverErrosDoModelo(
      erroDe({ nome: "Modelo", descricao: "", ativo: true, campos }),
      campos,
    );

    expect(mensagem).not.toBe("Revise os dados do modelo.");
  });

  it("rotula problema fora da lista de campos pelo nome amigável", () => {
    const mensagem = descreverErrosDoModelo(
      erroDe({ nome: "", descricao: "", ativo: true, campos: [campoValido] }),
      [campoValido],
    );

    expect(mensagem).toContain("Nome do modelo");
  });

  it("não repete a mesma linha quando a regra dispara por item", () => {
    const campos = [
      {
        ...campoValido,
        tipo: "selecao_imagem" as const,
        opcoesImagem: [
          { rotulo: "Igual", imagem: "https://blob.example.com/a.png" },
          { rotulo: "Igual", imagem: "https://blob.example.com/b.png" },
        ],
      },
    ];

    const mensagem = descreverErrosDoModelo(
      erroDe({ nome: "Modelo", descricao: "", ativo: true, campos }),
      campos,
    );

    const linhas = mensagem.split("\n");
    expect(new Set(linhas).size).toBe(linhas.length);
  });

  it("limita o tamanho e avisa quantos pontos sobraram", () => {
    // Seis campos sem título: seis problemas distintos, mostra 4 e resume o resto.
    const campos = Array.from({ length: 6 }, (_, i) => ({
      ...campoValido,
      id: `c${i}`,
      rotulo: `Campo ${i}`,
      tipo: "selecao_unica" as const,
      opcoes: [],
    }));

    const mensagem = descreverErrosDoModelo(
      erroDe({ nome: "Modelo", descricao: "", ativo: true, campos }),
      campos,
    );

    expect(mensagem.split("\n").length).toBeLessThanOrEqual(5);
    expect(mensagem).toContain("outro");
  });
});
