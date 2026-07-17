import { describe, expect, it } from "vitest";

import { podeAlternarAtivoDe } from "./gestao";

describe("podeAlternarAtivoDe", () => {
  it("permite alternar o status de outro usuário", () => {
    expect(podeAlternarAtivoDe("usuario-alvo", "usuario-atual")).toBe(true);
  });

  it("recusa alternar o próprio status", () => {
    expect(podeAlternarAtivoDe("mesmo-id", "mesmo-id")).toBe(false);
  });
});
