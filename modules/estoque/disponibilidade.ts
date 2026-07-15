export function calcularQuantidadeDisponivel(quantidadeInicial: number, saidas: number) {
  return Math.max(quantidadeInicial - saidas, 0);
}

/** Sem estoque mínimo definido, nunca avisa — o produto não pede controle de nível. */
export function deveAvisarEstoqueBaixo(disponivel: number, estoqueMinimo: number | null) {
  if (estoqueMinimo === null) return false;

  return disponivel <= estoqueMinimo;
}

const DIAS_ANTECEDENCIA_VENCIMENTO = 30;

export type StatusValidade = "vencido" | "proximo_vencimento" | "ok" | "sem_validade";

export function calcularStatusValidade(
  validade: Date | null,
  hoje: Date = new Date(),
): StatusValidade {
  if (!validade) return "sem_validade";

  const diasRestantes = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) return "vencido";
  if (diasRestantes <= DIAS_ANTECEDENCIA_VENCIMENTO) return "proximo_vencimento";

  return "ok";
}
