export type VariacaoDor = {
  variacao: number;
  melhora: boolean;
  pioraSignificativa: boolean;
};

/**
 * Compara a escala de dor (0–10) antes/depois de uma sessão. Reaproveitado pelo futuro módulo
 * `evolucao` para o gráfico de evolução de dor por período.
 */
export function calcularVariacaoDor(
  escalaDorAntes: number | null | undefined,
  escalaDorDepois: number | null | undefined,
): VariacaoDor | null {
  if (escalaDorAntes === null || escalaDorAntes === undefined) return null;
  if (escalaDorDepois === null || escalaDorDepois === undefined) return null;

  const variacao = escalaDorDepois - escalaDorAntes;

  return {
    variacao,
    melhora: variacao < 0,
    pioraSignificativa: variacao >= 3,
  };
}
