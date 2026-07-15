import { describe, expect, it } from "vitest";

import { assinaturaValida, podeAssinarDocumento } from "./assinatura";

describe("podeAssinarDocumento", () => {
  it("permite assinar um documento emitido", () => {
    expect(podeAssinarDocumento("emitido")).toBe(true);
  });

  it("bloqueia assinar um documento já assinado", () => {
    expect(podeAssinarDocumento("assinado")).toBe(false);
  });
});

describe("assinaturaValida", () => {
  it("rejeita ausente/vazia", () => {
    expect(assinaturaValida(null)).toBe(false);
    expect(assinaturaValida(undefined)).toBe(false);
    expect(assinaturaValida("")).toBe(false);
  });

  it("rejeita formato que não é PNG em base64", () => {
    expect(assinaturaValida("data:image/jpeg;base64,abc")).toBe(false);
    expect(assinaturaValida("não é uma data url")).toBe(false);
  });

  it("rejeita um canvas em branco (data URL curta demais)", () => {
    expect(assinaturaValida(`data:image/png;base64,${"a".repeat(50)}`)).toBe(false);
  });

  it("aceita uma assinatura com traço real (data URL longa)", () => {
    expect(assinaturaValida(`data:image/png;base64,${"a".repeat(1000)}`)).toBe(true);
  });
});
