export type ProgressoPacote = {
  quantidadeSessoes: number;
  sessoesRealizadas: number;
  sessoesRestantes: number;
  percentualConcluido: number;
};

/** Realizadas nunca excedem o contratado no cálculo de restantes/percentual (evita negativo/>100%). */
export function calcularProgressoPacote(
  quantidadeSessoes: number,
  sessoesRealizadas: number,
): ProgressoPacote {
  const realizadasClamp = Math.min(Math.max(sessoesRealizadas, 0), quantidadeSessoes);
  const sessoesRestantes = quantidadeSessoes - realizadasClamp;
  const percentualConcluido =
    quantidadeSessoes > 0 ? Math.round((realizadasClamp / quantidadeSessoes) * 100) : 0;

  return {
    quantidadeSessoes,
    sessoesRealizadas: realizadasClamp,
    sessoesRestantes,
    percentualConcluido,
  };
}

/** Avisa o cliente quando resta só 1 sessão (última chance de renovar) ou o pacote acabou. */
export function deveAvisarPacoteAcabando(sessoesRestantes: number): boolean {
  return sessoesRestantes <= 1;
}
