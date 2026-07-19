import type { StatusAtivoPacoteFiltro, ValidadePacoteFiltro } from "./queries";
import { situacoesPagamento, type SituacaoPagamento } from "./schema";

type ValorParametro = string | string[] | undefined;

export const statusAtivoPacote = [
  "ativos",
  "inativos",
] as const satisfies readonly StatusAtivoPacoteFiltro[];

export const validadePacote = [
  "validos",
  "vencidos",
  "sem_validade",
] as const satisfies readonly ValidadePacoteFiltro[];

export function primeiroValorParametro(valor: ValorParametro) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export function textoFiltroPacote(valor: ValorParametro) {
  return primeiroValorParametro(valor)?.trim() ?? "";
}

export function normalizarSituacaoPagamentoPacote(valor: ValorParametro) {
  const normalizado = primeiroValorParametro(valor);

  return situacoesPagamento.includes(normalizado as SituacaoPagamento)
    ? (normalizado as SituacaoPagamento)
    : undefined;
}

export function normalizarAtivoPacote(valor: ValorParametro) {
  const normalizado = primeiroValorParametro(valor);

  return statusAtivoPacote.includes(normalizado as StatusAtivoPacoteFiltro)
    ? (normalizado as StatusAtivoPacoteFiltro)
    : undefined;
}

export function normalizarValidadePacote(valor: ValorParametro) {
  const normalizado = primeiroValorParametro(valor);

  return validadePacote.includes(normalizado as ValidadePacoteFiltro)
    ? (normalizado as ValidadePacoteFiltro)
    : undefined;
}
