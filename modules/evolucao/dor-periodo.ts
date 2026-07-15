export type PontoDor = {
  data: Date;
  dorAntes: number | null;
  dorDepois: number | null;
};

export type EvolucaoDorPeriodo = {
  dorInicial: number;
  dorAtual: number;
  mediaVariacao: number;
  totalRegistros: number;
  melhoraGeral: boolean;
};

/**
 * Agrega a dor relatada em várias sessões (docs/context/00-produto.md "Comparação de dor":
 * dor inicial, dor após cada sessão, média da evolução). Diferente de
 * modules/sessoes/evolucao-dor.ts, que compara antes/depois de UMA sessão — aqui é a série
 * completa ao longo do tratamento.
 */
export function calcularEvolucaoDorPeriodo(pontos: PontoDor[]): EvolucaoDorPeriodo | null {
  const comDor = pontos.filter((p) => p.dorAntes !== null || p.dorDepois !== null);

  if (comDor.length === 0) return null;

  const ordenados = [...comDor].sort((a, b) => a.data.getTime() - b.data.getTime());
  const primeiro = ordenados[0];
  const ultimo = ordenados[ordenados.length - 1];

  const dorInicial = primeiro.dorAntes ?? primeiro.dorDepois;
  const dorAtual = ultimo.dorDepois ?? ultimo.dorAntes;

  if (dorInicial === null || dorAtual === null) return null;

  const variacoes = ordenados
    .filter(
      (p): p is { data: Date; dorAntes: number; dorDepois: number } =>
        p.dorAntes !== null && p.dorDepois !== null,
    )
    .map((p) => p.dorDepois - p.dorAntes);

  const mediaVariacao =
    variacoes.length > 0
      ? Math.round((variacoes.reduce((soma, v) => soma + v, 0) / variacoes.length) * 10) / 10
      : 0;

  return {
    dorInicial,
    dorAtual,
    mediaVariacao,
    totalRegistros: ordenados.length,
    melhoraGeral: dorAtual < dorInicial,
  };
}
