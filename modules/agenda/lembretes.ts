import type { StatusAgendamento } from "./schema";

const HORAS_ANTECEDENCIA_DIA_ANTERIOR = 24;
const HORAS_ANTECEDENCIA_HORAS_ANTES = 3;

function horasAte(inicio: Date, agora: Date) {
  return (inicio.getTime() - agora.getTime()) / (1000 * 60 * 60);
}

type AgendamentoParaLembrete = {
  status: StatusAgendamento;
  inicio: Date;
};

/**
 * "Já dentro da janela e ainda não avisado" — não uma faixa estreita de horário. Isso torna o
 * disparo independente da frequência real do cron: ele dispara na primeira execução após cruzar
 * o limiar e nunca de novo, graças ao carimbo `lembrete*Em` (idempotente por construção).
 */
export function precisaLembreteDiaAnterior(
  agendamento: AgendamentoParaLembrete & { lembreteDiaAnteriorEm: Date | null },
  agora: Date,
) {
  if (agendamento.status !== "marcado") return false;
  if (agendamento.lembreteDiaAnteriorEm !== null) return false;

  const horas = horasAte(agendamento.inicio, agora);

  return horas > 0 && horas <= HORAS_ANTECEDENCIA_DIA_ANTERIOR;
}

export function precisaLembreteHorasAntes(
  agendamento: AgendamentoParaLembrete & { lembreteHorasAntesEm: Date | null },
  agora: Date,
) {
  if (agendamento.status !== "marcado") return false;
  if (agendamento.lembreteHorasAntesEm !== null) return false;

  const horas = horasAte(agendamento.inicio, agora);

  return horas > 0 && horas <= HORAS_ANTECEDENCIA_HORAS_ANTES;
}
