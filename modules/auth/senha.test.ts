import { describe, expect, it } from "vitest";

import { gerarHashSenha, verificarSenha } from "./senha";

describe("senha", () => {
  it("gera hash e valida a senha correta", async () => {
    const hash = await gerarHashSenha("senha-segura-123");

    await expect(verificarSenha("senha-segura-123", hash)).resolves.toBe(true);
  });

  it("recusa senha incorreta e hash inválido", async () => {
    const hash = await gerarHashSenha("senha-segura-123");

    await expect(verificarSenha("outra-senha-123", hash)).resolves.toBe(false);
    await expect(verificarSenha("senha-segura-123", "hash-invalido")).resolves.toBe(false);
  });
});
