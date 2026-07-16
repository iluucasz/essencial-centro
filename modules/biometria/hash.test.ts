import { describe, expect, it } from "vitest";

import { calcularHashTemplate } from "./hash";

describe("calcularHashTemplate", () => {
  it("é determinístico — mesmo template gera o mesmo hash", () => {
    expect(calcularHashTemplate("dGVtcGxhdGUtZmFrZQ==")).toBe(
      calcularHashTemplate("dGVtcGxhdGUtZmFrZQ=="),
    );
  });

  it("templates diferentes geram hashes diferentes", () => {
    expect(calcularHashTemplate("template-a")).not.toBe(calcularHashTemplate("template-b"));
  });

  it("retorna um hash SHA-256 (64 caracteres hexadecimais)", () => {
    expect(calcularHashTemplate("qualquer coisa")).toMatch(/^[a-f0-9]{64}$/);
  });
});
