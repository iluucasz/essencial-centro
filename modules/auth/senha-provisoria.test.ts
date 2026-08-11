import { describe, expect, it } from "vitest";

import {
  CARACTERES_AMBIGUOS,
  TAMANHO_SENHA_PROVISORIA,
  gerarSenhaProvisoria,
} from "./senha-provisoria";
import { gerarHashSenha, verificarSenha } from "./senha";

describe("gerarSenhaProvisoria", () => {
  it("tem o tamanho definido", () => {
    expect(gerarSenhaProvisoria()).toHaveLength(TAMANHO_SENHA_PROVISORIA);
    expect(gerarSenhaProvisoria(16)).toHaveLength(16);
  });

  it("não usa caractere ambíguo — a senha é ditada e digitada à mão", () => {
    // 400 amostras cobrem o alfabeto inteiro várias vezes; um caractere ambíguo apareceria.
    for (let i = 0; i < 400; i += 1) {
      for (const caractere of gerarSenhaProvisoria()) {
        expect(CARACTERES_AMBIGUOS).not.toContain(caractere);
      }
    }
  });

  it("não repete entre chamadas", () => {
    const amostras = new Set(Array.from({ length: 200 }, () => gerarSenhaProvisoria()));

    expect(amostras.size).toBe(200);
  });

  it("usa mais de um caractere do alfabeto — pega um gerador travado", () => {
    const distintos = new Set(gerarSenhaProvisoria(200));

    expect(distintos.size).toBeGreaterThan(10);
  });
});

describe("senha provisória com o hash real", () => {
  it("a senha gerada autentica pelo mesmo verificador do login", async () => {
    const senha = gerarSenhaProvisoria();
    const hash = await gerarHashSenha(senha);

    expect(await verificarSenha(senha, hash)).toBe(true);
    expect(await verificarSenha(senha.toLowerCase() + "x", hash)).toBe(false);
  });

  it("passa o mínimo de 8 caracteres que o login exige", () => {
    // Se o tamanho caísse abaixo de 8, `credenciaisEntradaSchema` recusaria a própria senha gerada.
    expect(TAMANHO_SENHA_PROVISORIA).toBeGreaterThanOrEqual(8);
  });
});
