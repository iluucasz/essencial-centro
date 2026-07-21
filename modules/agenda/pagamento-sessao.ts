import type { SituacaoPagamento } from "@/modules/pacotes/schema";

export type DadosValorSessao = {
  pacoteQuantidadeSessoes?: number | null;
  pacoteValorCentavos?: number | null;
  servicoValorCentavos?: number | null;
};

export type SituacaoPagamentoSessaoFormulario = "nao_lancar" | "pago" | "pendente";

export function calcularValorSugeridoSessao({
  pacoteQuantidadeSessoes,
  pacoteValorCentavos,
  servicoValorCentavos,
}: DadosValorSessao) {
  if (
    typeof pacoteValorCentavos === "number" &&
    pacoteValorCentavos > 0 &&
    typeof pacoteQuantidadeSessoes === "number" &&
    pacoteQuantidadeSessoes > 0
  ) {
    return Math.round(pacoteValorCentavos / pacoteQuantidadeSessoes);
  }

  return servicoValorCentavos ?? null;
}

export function situacaoInicialPagamentoSessao(
  situacaoContrato?: SituacaoPagamento | null,
): SituacaoPagamentoSessaoFormulario {
  return situacaoContrato === "pago" ? "nao_lancar" : "pago";
}
