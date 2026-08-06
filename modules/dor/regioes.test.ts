import { describe, expect, it } from "vitest";

import {
  descreverRegiao,
  faixaIntensidade,
  regiaoDoPonto,
  regiaoEhBilateral,
  regioesDor,
  rotulosRegiaoDor,
  type RegiaoDor,
} from "./regioes";

/**
 * As fronteiras de região são números calibrados contra a malha (`scripts/verificar-regioes-dor.ts`).
 * Errar aqui não quebra a tela — só grava "lombar" onde a profissional clicou no glúteo. Estes testes
 * fixam as fronteiras que importam clinicamente.
 */

/** Ponto no eixo central do corpo (longe dos braços) na altura pedida. */
function central(altura: number, normalAnterior = true) {
  return regiaoDoPonto({ altura, x: 0.1, normalAnterior });
}

describe("regiaoDoPonto — eixo central", () => {
  it("separa cabeça, cervical e tronco por altura", () => {
    expect(central(0.95).regiao).toBe("cabeca");
    expect(central(0.84).regiao).toBe("cervical");
    expect(central(0.7).regiao).toBe("peito");
  });

  it("usa a normal da superfície para decidir anterior vs. posterior", () => {
    expect(central(0.7, true).regiao).toBe("peito");
    expect(central(0.7, false).regiao).toBe("dorsal");

    expect(central(0.58, true).regiao).toBe("abdomen");
    expect(central(0.58, false).regiao).toBe("lombar");

    expect(central(0.5, true).regiao).toBe("quadril");
    expect(central(0.5, false).regiao).toBe("gluteo");
  });

  it("desce a perna na ordem anatômica", () => {
    expect(central(0.4).regiao).toBe("coxa");
    expect(central(0.28).regiao).toBe("joelho");
    expect(central(0.18).regiao).toBe("panturrilha");
    expect(central(0.06).regiao).toBe("tornozelo");
    expect(central(0.01).regiao).toBe("pe");
  });
});

describe("regiaoDoPonto — membro superior", () => {
  it("não confunde tronco com braço na mesma altura", () => {
    // Na cintura o tronco termina em |x|≈0,4 e o braço só retoma em ~0,70.
    expect(regiaoDoPonto({ altura: 0.58, x: 0.3, normalAnterior: false }).regiao).toBe("lombar");
    expect(regiaoDoPonto({ altura: 0.58, x: 0.8, normalAnterior: false }).regiao).toBe("antebraco");
  });

  it("separa ombro, braço, antebraço e mão por altura", () => {
    const fora = 0.9;
    expect(regiaoDoPonto({ altura: 0.78, x: fora, normalAnterior: true }).regiao).toBe("ombro");
    expect(regiaoDoPonto({ altura: 0.66, x: fora, normalAnterior: true }).regiao).toBe("braco");
    expect(regiaoDoPonto({ altura: 0.52, x: fora, normalAnterior: true }).regiao).toBe("antebraco");
    expect(regiaoDoPonto({ altura: 0.44, x: fora, normalAnterior: true }).regiao).toBe("mao");
  });

  it("na cabeça nenhum x vira braço — os braços não alcançam essa altura", () => {
    expect(regiaoDoPonto({ altura: 0.95, x: 0.99, normalAnterior: true }).regiao).toBe("cabeca");
  });

  it("abaixo da coxa alta nenhum x vira mão — as mãos já terminaram", () => {
    expect(regiaoDoPonto({ altura: 0.2, x: 0.99, normalAnterior: true }).regiao).toBe(
      "panturrilha",
    );
  });
});

describe("regiaoDoPonto — lado do paciente", () => {
  it("inverte o eixo conforme a face observada (o lado é o do PACIENTE, não o de quem olha)", () => {
    // De frente pro modelo, a direita dele está à nossa esquerda (x negativo).
    expect(regiaoDoPonto({ altura: 0.78, x: -0.9, normalAnterior: true }).lado).toBe("direito");
    expect(regiaoDoPonto({ altura: 0.78, x: 0.9, normalAnterior: true }).lado).toBe("esquerdo");

    // Vendo as costas, inverte.
    expect(regiaoDoPonto({ altura: 0.78, x: -0.9, normalAnterior: false }).lado).toBe("esquerdo");
    expect(regiaoDoPonto({ altura: 0.78, x: 0.9, normalAnterior: false }).lado).toBe("direito");
  });

  it("região de linha média não tem lado", () => {
    expect(central(0.58, false).lado).toBeNull();
    expect(central(0.7).lado).toBeNull();
    expect(central(0.95).lado).toBeNull();
  });

  it("glúteo e coxa têm lado; lombar e abdômen não", () => {
    expect(regiaoDoPonto({ altura: 0.5, x: 0.2, normalAnterior: false }).lado).not.toBeNull();
    expect(regiaoDoPonto({ altura: 0.4, x: 0.2, normalAnterior: true }).lado).not.toBeNull();
    expect(regiaoDoPonto({ altura: 0.58, x: 0.2, normalAnterior: false }).lado).toBeNull();
  });
});

describe("regiaoDoPonto — robustez", () => {
  it("limita altura fora de 0..1 em vez de devolver região inválida", () => {
    expect(regioesDor).toContain(regiaoDoPonto({ altura: -3, x: 0, normalAnterior: true }).regiao);
    expect(regioesDor).toContain(regiaoDoPonto({ altura: 9, x: 0, normalAnterior: true }).regiao);
    expect(regiaoDoPonto({ altura: -3, x: 0, normalAnterior: true }).regiao).toBe("pe");
    expect(regiaoDoPonto({ altura: 9, x: 0, normalAnterior: true }).regiao).toBe("cabeca");
  });

  it("toda região do vocabulário tem rótulo em pt-BR", () => {
    for (const regiao of regioesDor) {
      expect(rotulosRegiaoDor[regiao]).toBeTruthy();
    }
  });
});

describe("descreverRegiao", () => {
  it("inclui o lado só em região bilateral", () => {
    expect(descreverRegiao("ombro", "direito")).toBe("Ombro direito");
    expect(descreverRegiao("lombar", null)).toBe("Lombar");
    // Lado enviado por engano numa região de linha média é ignorado, não concatenado.
    expect(descreverRegiao("lombar", "direito")).toBe("Lombar");
  });

  it("regiões de linha média não são bilaterais", () => {
    const linhaMedia: RegiaoDor[] = ["cabeca", "cervical", "peito", "abdomen", "dorsal", "lombar"];
    for (const regiao of linhaMedia) expect(regiaoEhBilateral(regiao)).toBe(false);
  });
});

describe("faixaIntensidade", () => {
  it("classifica a escala 0–10 nas faixas da EVA", () => {
    expect(faixaIntensidade(0).chave).toBe("sem_dor");
    expect(faixaIntensidade(3).chave).toBe("leve");
    expect(faixaIntensidade(6).chave).toBe("moderada");
    expect(faixaIntensidade(9).chave).toBe("intensa");
    expect(faixaIntensidade(10).chave).toBe("maxima");
  });
});
