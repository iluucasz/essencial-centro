import { randomBytes } from "node:crypto";

/**
 * Token do link público de ficha (enviado por WhatsApp). Aleatório forte e inadivinhável, uso único
 * (limpo ao preencher) e com expiração. Lógica pura/testável — a URL absoluta fica em url-publica.ts
 * (depende de `headers()`), server-only.
 */
export const DIAS_VALIDADE_TOKEN_FICHA = 14;

export function gerarTokenFicha(): string {
  return randomBytes(32).toString("base64url");
}

export function expiracaoTokenFicha(agora: Date = new Date()): Date {
  return new Date(agora.getTime() + DIAS_VALIDADE_TOKEN_FICHA * 24 * 60 * 60 * 1000);
}

export function tokenFichaExpirado(expiraEm: Date | null, agora: Date = new Date()): boolean {
  return !expiraEm || expiraEm.getTime() <= agora.getTime();
}
