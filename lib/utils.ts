import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina classes condicionais e resolve conflitos do Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Variação percentual de `atual` em relação a `anterior`, arredondada.
 * Retorna `null` quando não há base de comparação válida (evita "+Infinity%").
 */
export function calcularVariacaoPercentual(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual === 0 ? 0 : null;

  return Math.round(((atual - anterior) / anterior) * 100);
}

export function primeiroDiaDoMes(data: Date) {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), 1));
}

export function ultimoDiaDoMes(data: Date) {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}
