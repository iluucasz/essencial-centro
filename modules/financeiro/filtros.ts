import {
  categoriasLancamento,
  formasPagamentoLancamento,
  situacoesLancamento,
  tiposLancamento,
  type CategoriaLancamento,
  type FormaPagamentoLancamento,
  type SituacaoLancamento,
  type TipoLancamento,
} from "./schema";

type ValorParametro = string | string[] | undefined;

export function primeiroValorParametro(valor: ValorParametro) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export function textoFiltroLancamento(valor: ValorParametro) {
  return primeiroValorParametro(valor)?.trim() ?? "";
}

export function normalizarTipoLancamento(valor: ValorParametro) {
  const normalizado = primeiroValorParametro(valor);

  return tiposLancamento.includes(normalizado as TipoLancamento)
    ? (normalizado as TipoLancamento)
    : undefined;
}

export function normalizarCategoriaLancamento(valor: ValorParametro) {
  const normalizado = primeiroValorParametro(valor);

  return categoriasLancamento.includes(normalizado as CategoriaLancamento)
    ? (normalizado as CategoriaLancamento)
    : undefined;
}

export function normalizarSituacaoLancamento(valor: ValorParametro) {
  const normalizado = primeiroValorParametro(valor);

  return situacoesLancamento.includes(normalizado as SituacaoLancamento)
    ? (normalizado as SituacaoLancamento)
    : undefined;
}

export function normalizarFormaPagamentoLancamento(valor: ValorParametro) {
  const normalizado = primeiroValorParametro(valor);

  return formasPagamentoLancamento.includes(normalizado as FormaPagamentoLancamento)
    ? (normalizado as FormaPagamentoLancamento)
    : undefined;
}

function parseDataUtc(valor: string | undefined, sufixoHorario: string) {
  if (!valor) return undefined;

  const data = new Date(`${valor}T${sufixoHorario}`);

  return Number.isNaN(data.getTime()) ? undefined : data;
}

export function normalizarDataInicioLancamento(valor: ValorParametro) {
  return parseDataUtc(primeiroValorParametro(valor), "00:00:00.000Z");
}

export function normalizarDataFimLancamento(valor: ValorParametro) {
  return parseDataUtc(primeiroValorParametro(valor), "23:59:59.999Z");
}
