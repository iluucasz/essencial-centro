import { describe, expect, it } from "vitest";

import { ancoraClassificaCorreto, ancorasDaFace, ancorasDor, chaveAncora } from "./ancoras";
import { descreverRegiao, regiaoEhBilateral } from "./regioes";

/**
 * As âncoras são a interação principal: cada uma grava a região que declara. Uma coordenada fora da
 * faixa gravaria "glúteo" onde a tela mostra "lombar" — erro silencioso e clínico. Estes testes
 * amarram a tabela às faixas de `regioes.ts`.
 */
describe("ancorasDor", () => {
  it.each(ancorasDor.map((a) => [descreverRegiao(a.regiao, a.lado), a.anterior, a] as const))(
    "%s (anterior=%s) cai na região que declara",
    (_rotulo, _anterior, ancora) => {
      expect(ancoraClassificaCorreto(ancora)).toBe(true);
    },
  );

  it("não repete a mesma região na mesma face", () => {
    const vistas = ancorasDor.map((a) => `${chaveAncora(a)}:${a.anterior}`);

    expect(new Set(vistas).size).toBe(vistas.length);
  });

  it("toda âncora bilateral tem lado, e nenhuma de linha média tem", () => {
    for (const ancora of ancorasDor) {
      if (regiaoEhBilateral(ancora.regiao)) {
        expect(ancora.lado, `${ancora.regiao} deveria ter lado`).not.toBeNull();
      } else {
        expect(ancora.lado, `${ancora.regiao} não deveria ter lado`).toBeNull();
      }
    }
  });

  it("mantém as coordenadas dentro do espaço normalizado", () => {
    for (const ancora of ancorasDor) {
      expect(ancora.altura).toBeGreaterThanOrEqual(0);
      expect(ancora.altura).toBeLessThanOrEqual(1);
      expect(Math.abs(ancora.x)).toBeLessThanOrEqual(1);
    }
  });

  it("cobre as duas faces e os dois lados", () => {
    expect(ancorasDor.some((a) => a.anterior)).toBe(true);
    expect(ancorasDor.some((a) => !a.anterior)).toBe(true);
    expect(ancorasDor.some((a) => a.lado === "direito")).toBe(true);
    expect(ancorasDor.some((a) => a.lado === "esquerdo")).toBe(true);
  });

  it("toda região bilateral é alcançável dos dois lados", () => {
    // Não exige espelho exato: a malha é assimétrica (uma mão desce mais que a outra, e o ombro
    // direito é mais largo), então as coordenadas geradas diferem de lado a lado — e a mão só tem
    // superfície alcançável numa face por lado. O que precisa valer é os dois lados existirem.
    const bilaterais = ancorasDor.filter((ancora) => ancora.lado);
    const porRegiao = new Map<string, Set<string>>();

    for (const ancora of bilaterais) {
      if (!porRegiao.has(ancora.regiao)) porRegiao.set(ancora.regiao, new Set());
      porRegiao.get(ancora.regiao)!.add(ancora.lado!);
    }

    for (const [regiao, lados] of porRegiao) {
      expect([...lados].sort(), `${regiao} precisa dos dois lados`).toEqual([
        "direito",
        "esquerdo",
      ]);
    }
  });

  it("numera cada face de cima pra baixo, sem repetir número", () => {
    for (const anterior of [true, false]) {
      const daFace = ancorasDaFace(anterior);

      expect(daFace.length).toBeGreaterThan(10);
      expect(daFace.every((a) => a.anterior === anterior)).toBe(true);
      expect(daFace.map((a) => a.numero)).toEqual(daFace.map((_, i) => i + 1));

      // Ordem decrescente de altura: o número 1 fica na parte mais alta do corpo.
      for (let i = 1; i < daFace.length; i++) {
        expect(daFace[i]!.altura).toBeLessThanOrEqual(daFace[i - 1]!.altura);
      }
    }
  });

  it("as duas faces juntas cobrem toda a tabela", () => {
    expect(ancorasDaFace(true).length + ancorasDaFace(false).length).toBe(ancorasDor.length);
  });
});
