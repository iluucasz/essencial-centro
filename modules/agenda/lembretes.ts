import type { StatusAgendamento } from "./schema";

const HORAS_ANTECEDENCIA_HORAS_ANTES = 3;

function horasAte(inicio: Date, agora: Date) {
  return (inicio.getTime() - agora.getTime()) / (1000 * 60 * 60);
}

/**
 * Diferença em DIAS DE CALENDÁRIO (não horas) entre duas datas — ambas já em horário de parede nos
 * campos UTC (`agendamento.inicio` e `agoraBrasilia()`), então `getUTC*` já dá o dia certo em
 * Brasília sem conversão extra.
 */
function diferencaEmDiasCalendario(data: Date, referencia: Date) {
  const diaDeData = Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
  const diaDeReferencia = Date.UTC(
    referencia.getUTCFullYear(),
    referencia.getUTCMonth(),
    referencia.getUTCDate(),
  );

  return Math.round((diaDeData - diaDeReferencia) / (1000 * 60 * 60 * 24));
}

type AgendamentoParaLembrete = {
  status: StatusAgendamento;
  inicio: Date;
};

/**
 * "O atendimento é amanhã" — dia de calendário, não uma janela rolante de 24h. Antes disparava pra
 * qualquer atendimento a menos de 24h, então um atendimento marcado pra HOJE à noite (ex.: 12h de
 * distância pela manhã) recebia a mensagem "Lembrete: atendimento amanhã" mesmo sendo hoje. Comparar
 * o dia de calendário resolve isso e continua idempotente/independente da frequência do cron: dispara
 * na primeira execução do dia anterior e nunca mais, graças ao carimbo `lembreteDiaAnteriorEm`.
 */
export function precisaLembreteDiaAnterior(
  agendamento: AgendamentoParaLembrete & { lembreteDiaAnteriorEm: Date | null },
  agora: Date,
) {
  if (agendamento.status !== "marcado") return false;
  if (agendamento.lembreteDiaAnteriorEm !== null) return false;

  return diferencaEmDiasCalendario(agendamento.inicio, agora) === 1;
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
