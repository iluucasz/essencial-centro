import { describe, expect, it } from "vitest";

import { gerarHashSenha, verificarSenha } from "./senha";
import { definirPrimeiraSenhaSchema } from "./schema";

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

describe("definirPrimeiraSenhaSchema", () => {
  it("aceita senha de 8+ caracteres com confirmação igual", () => {
    expect(
      definirPrimeiraSenhaSchema.safeParse({
        novaSenha: "minhaSenha123",
        confirmarNovaSenha: "minhaSenha123",
      }).success,
    ).toBe(true);
  });

  it("recusa confirmação diferente", () => {
    const resultado = definirPrimeiraSenhaSchema.safeParse({
      novaSenha: "minhaSenha123",
      confirmarNovaSenha: "outraSenha123",
    });

    expect(resultado.success).toBe(false);
  });

  it("recusa senha curta — o login exige 8 caracteres", () => {
    expect(
      definirPrimeiraSenhaSchema.safeParse({ novaSenha: "curta", confirmarNovaSenha: "curta" })
        .success,
    ).toBe(false);
  });

  it("não pede a senha atual — a pessoa acabou de entrar com a provisória", () => {
    // Se o schema exigisse `senhaAtual`, o fluxo obrigatório de troca travaria na primeira entrada.
    const resultado = definirPrimeiraSenhaSchema.safeParse({
      novaSenha: "minhaSenha123",
      confirmarNovaSenha: "minhaSenha123",
    });

    expect(resultado.success).toBe(true);
  });
});
