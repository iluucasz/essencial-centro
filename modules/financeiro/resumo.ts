import type { SituacaoLancamento, TipoLancamento } from "./schema";

export type LancamentoParaResumo = {
  tipo: TipoLancamento;
  situacao: SituacaoLancamento;
  valorCentavos: number;
};

export type ResumoFinanceiro = {
  receitasPagas: number;
  despesasPagas: number;
  saldo: number;
  receitasPendentes: number;
  despesasPendentes: number;
};

export function calcularResumoFinanceiro(lancamentos: LancamentoParaResumo[]): ResumoFinanceiro {
  let receitasPagas = 0;
  let despesasPagas = 0;
  let receitasPendentes = 0;
  let despesasPendentes = 0;

  for (const lancamento of lancamentos) {
    if (lancamento.situacao === "cancelado") continue;

    if (lancamento.tipo === "receita") {
      if (lancamento.situacao === "pago") receitasPagas += lancamento.valorCentavos;
      else receitasPendentes += lancamento.valorCentavos;
    } else {
      if (lancamento.situacao === "pago") despesasPagas += lancamento.valorCentavos;
      else despesasPendentes += lancamento.valorCentavos;
    }
  }

  return {
    receitasPagas,
    despesasPagas,
    saldo: receitasPagas - despesasPagas,
    receitasPendentes,
    despesasPendentes,
  };
}
