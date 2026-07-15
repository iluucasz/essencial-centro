export type RegistroMedida = {
  data: Date;
  valorCm: number;
};

export type EvolucaoMedida = {
  inicial: number;
  atual: number;
  diferencaCm: number;
  reducao: boolean;
  dataInicial: Date;
  dataAtual: Date;
  totalMedicoes: number;
};

/**
 * Compara a primeira medição registrada (inicial) com a mais recente (atual) de uma mesma
 * região+lado. Reaproveitado pelo futuro módulo `evolucao` (gráfico/tabela comparativa).
 */
export function calcularEvolucaoMedida(registros: RegistroMedida[]): EvolucaoMedida | null {
  if (registros.length === 0) return null;

  const ordenados = [...registros].sort((a, b) => a.data.getTime() - b.data.getTime());
  const primeiro = ordenados[0];
  const ultimo = ordenados[ordenados.length - 1];
  const diferencaCm = Math.round((ultimo.valorCm - primeiro.valorCm) * 10) / 10;

  return {
    inicial: primeiro.valorCm,
    atual: ultimo.valorCm,
    diferencaCm,
    reducao: diferencaCm < 0,
    dataInicial: primeiro.data,
    dataAtual: ultimo.data,
    totalMedicoes: ordenados.length,
  };
}
