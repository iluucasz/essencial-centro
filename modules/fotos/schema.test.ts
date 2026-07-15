import { describe, expect, it } from "vitest";

import { criarFotoSchema, TAMANHO_MAXIMO_BYTES } from "./schema";

const clienteId = "b1f6f2a0-1c1a-4a9a-9f1a-1c1a4a9a9f1a";

function arquivoFake(nome: string, tipo: string, tamanho: number) {
  return new File([new Uint8Array(tamanho)], nome, { type: tipo });
}

describe("criarFotoSchema", () => {
  it("aceita uma imagem JPEG dentro do limite de tamanho", () => {
    const resultado = criarFotoSchema.safeParse({
      clienteId,
      regiao: "Abdômen",
      arquivo: arquivoFake("foto.jpg", "image/jpeg", 1024),
    });

    expect(resultado.success).toBe(true);
  });

  it("recusa arquivo maior que o limite permitido", () => {
    const resultado = criarFotoSchema.safeParse({
      clienteId,
      regiao: "Abdômen",
      arquivo: arquivoFake("foto.jpg", "image/jpeg", TAMANHO_MAXIMO_BYTES + 1),
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toContain("4MB");
    }
  });

  it("recusa formato não suportado (ex.: PDF)", () => {
    const resultado = criarFotoSchema.safeParse({
      clienteId,
      regiao: "Abdômen",
      arquivo: arquivoFake("documento.pdf", "application/pdf", 1024),
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toContain("suportado");
    }
  });

  it("recusa arquivo vazio", () => {
    const resultado = criarFotoSchema.safeParse({
      clienteId,
      regiao: "Abdômen",
      arquivo: arquivoFake("vazio.jpg", "image/jpeg", 0),
    });

    expect(resultado.success).toBe(false);
  });
});
