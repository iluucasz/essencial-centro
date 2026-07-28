import { describe, expect, it } from "vitest";

import { camposModeloSchema } from "./campos";
import { modelosSemente } from "./modelos-semente";

/**
 * A semente é inserida por SQL cru (`scripts/seed-modelos-ficha.ts`), sem passar pelas Server
 * Actions — então nada valida os campos em runtime. Este teste é o portão: um `id` duplicado no
 * mesmo modelo quebra as keys do React em `formulario-dinamico.tsx` e faz um campo sobrescrever o
 * outro nas respostas.
 */
describe("modelosSemente", () => {
  it("tem slug único por modelo", () => {
    const slugs = modelosSemente.map((modelo) => modelo.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(modelosSemente.map((modelo) => [modelo.slug, modelo] as const))(
    "%s passa por camposModeloSchema",
    (_slug, modelo) => {
      const resultado = camposModeloSchema.safeParse(modelo.campos);

      expect(resultado.error?.issues ?? []).toEqual([]);
      expect(resultado.success).toBe(true);
    },
  );
});
