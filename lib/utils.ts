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

const formatadorInstanteBrasilia = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * O servidor roda em UTC (Vercel), mas `agendamento.inicio` e datas "de hoje" são tratados em
 * todo o app como horário de parede de Brasília gravado direto nos campos UTC de um `Date` (sem
 * conversão de fuso — mais simples pra um produto de fuso único). Um `new Date()` cru representa
 * o instante real e não pode ser comparado/derivado direto contra esse esquema: usar sempre esta
 * função no lugar de `new Date()` sempre que o resultado for "agora"/"hoje" para o negócio (fila
 * de lembretes, o que é "hoje" na agenda, prompt da IA etc.) — nunca pra timestamps de auditoria
 * (`criadoEm`, `atualizadoEm`), que devem continuar sendo o instante real.
 */
export function agoraBrasilia(): Date {
  const partes = formatadorInstanteBrasilia.formatToParts(new Date());
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((parte) => parte.type === tipo)?.value);

  return new Date(
    Date.UTC(
      valor("year"),
      valor("month") - 1,
      valor("day"),
      valor("hour"),
      valor("minute"),
      valor("second"),
    ),
  );
}
