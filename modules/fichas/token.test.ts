import { describe, expect, it } from "vitest";

import { expiracaoTokenFicha, gerarTokenFicha, tokenFichaExpirado } from "./token";

describe("token de ficha pública", () => {
  it("gera tokens únicos, longos e no formato base64url", () => {
    const a = gerarTokenFicha();
    const b = gerarTokenFicha();

    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("considera expirado quando não há data ou o prazo já passou", () => {
    const agora = new Date("2026-07-22T12:00:00.000Z");

    expect(tokenFichaExpirado(null, agora)).toBe(true);
    expect(tokenFichaExpirado(new Date("2026-07-21T12:00:00.000Z"), agora)).toBe(true);
    expect(tokenFichaExpirado(new Date("2026-07-23T12:00:00.000Z"), agora)).toBe(false);
  });

  it("expira em 14 dias por padrão", () => {
    const agora = new Date("2026-07-01T00:00:00.000Z");
    const expiraEm = expiracaoTokenFicha(agora);

    expect(tokenFichaExpirado(expiraEm, agora)).toBe(false);
    expect(tokenFichaExpirado(expiraEm, new Date("2026-07-20T00:00:00.000Z"))).toBe(true);
  });
});
