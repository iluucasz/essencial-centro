import { describe, expect, it } from "vitest";

import { calcularHashConteudo } from "./hash";

describe("calcularHashConteudo", () => {
  it("é determinístico — mesmo conteúdo gera o mesmo hash", () => {
    expect(calcularHashConteudo("Termo de responsabilidade")).toBe(
      calcularHashConteudo("Termo de responsabilidade"),
    );
  });

  it("conteúdos diferentes geram hashes diferentes", () => {
    expect(calcularHashConteudo("versão A")).not.toBe(calcularHashConteudo("versão B"));
  });

  it("retorna um hash SHA-256 (64 caracteres hexadecimais)", () => {
    expect(calcularHashConteudo("qualquer coisa")).toMatch(/^[a-f0-9]{64}$/);
  });
});
