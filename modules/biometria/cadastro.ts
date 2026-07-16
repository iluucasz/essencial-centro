import { randomInt } from "node:crypto";

export const CODIGO_CADASTRO_TTL_MINUTOS = 5;
/** O projeto de referência capturava a qualidade do cadastro mas nunca rejeitava com base nela —
 * cadastros ruins sempre eram salvos. Esta é a correção: exigir qualidade mínima no cadastro. */
export const QUALIDADE_MINIMA_CADASTRO = 50;

export function codigoValido(
  codigo: { expiraEm: Date; consumidoEm: Date | null },
  agora: Date,
): boolean {
  return codigo.consumidoEm === null && agora < codigo.expiraEm;
}

export function qualidadeCadastroValida(qualidade: number): boolean {
  return qualidade >= QUALIDADE_MINIMA_CADASTRO;
}

export function gerarCodigoNumerico(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
