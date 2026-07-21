import { encontrarConflito, type IntervaloAgendamento } from "@/modules/agenda/sobreposicao";

import type { FrequenciaRecorrencia } from "./schema";

export type EntradaRecorrencia = {
  frequencia: FrequenciaRecorrencia;
  /** Dia da semana alvo (0=domingo … 6=sábado) — usado quando `frequencia = "semanal"`. */
  diaSemana: number | null;
  /** Dia do mês alvo (1–31) — usado quando `frequencia = "mensal"`. */
  diaDoMes: number | null;
  hora: number;
  minuto: number;
  /** Primeiro dia a partir do qual buscar ocorrências (parede, hora 00:00 nos campos UTC). */
  dataInicio: Date;
  quantidade: number;
};

/** Teto de segurança para nunca varrer o calendário indefinidamente ao procurar dias válidos. */
const MAX_ITERACOES = 5000;

function comHorario(ano: number, mes: number, dia: number, hora: number, minuto: number): Date {
  return new Date(Date.UTC(ano, mes, dia, hora, minuto));
}

function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

function gerarSemanal(entrada: EntradaRecorrencia): Date[] {
  const { diaSemana, hora, minuto, dataInicio, quantidade } = entrada;
  if (diaSemana === null) return [];

  const ocorrencias: Date[] = [];
  const cursor = new Date(
    Date.UTC(dataInicio.getUTCFullYear(), dataInicio.getUTCMonth(), dataInicio.getUTCDate()),
  );

  let iteracoes = 0;
  while (ocorrencias.length < quantidade && iteracoes < MAX_ITERACOES) {
    if (cursor.getUTCDay() === diaSemana) {
      ocorrencias.push(
        comHorario(
          cursor.getUTCFullYear(),
          cursor.getUTCMonth(),
          cursor.getUTCDate(),
          hora,
          minuto,
        ),
      );
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    } else {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    iteracoes += 1;
  }

  return ocorrencias;
}

function gerarMensal(entrada: EntradaRecorrencia): Date[] {
  const { diaDoMes, hora, minuto, dataInicio, quantidade } = entrada;
  if (diaDoMes === null) return [];

  const ocorrencias: Date[] = [];
  let ano = dataInicio.getUTCFullYear();
  let mes = dataInicio.getUTCMonth();

  // Se o dia alvo do mês inicial já passou, começa no mês seguinte.
  if (dataInicio.getUTCDate() > diaDoMes) {
    mes += 1;
  }

  let iteracoes = 0;
  while (ocorrencias.length < quantidade && iteracoes < MAX_ITERACOES) {
    // Meses sem o dia alvo (ex.: 31 em fevereiro) são pulados, não empurrados para outro dia.
    if (diaDoMes <= diasNoMes(ano, mes)) {
      ocorrencias.push(comHorario(ano, mes, diaDoMes, hora, minuto));
    }
    mes += 1;
    if (mes > 11) {
      mes = 0;
      ano += 1;
    }
    iteracoes += 1;
  }

  return ocorrencias;
}

/**
 * Expande a configuração da série em `quantidade` datas concretas (parede de Brasília gravada nos
 * campos UTC, mesma convenção de `modules/agenda`). Função pura e determinística — o consumo de
 * sessão e os lembretes acontecem depois, por agendamento já materializado.
 */
export function gerarOcorrencias(entrada: EntradaRecorrencia): Date[] {
  if (entrada.quantidade <= 0) return [];

  return entrada.frequencia === "semanal" ? gerarSemanal(entrada) : gerarMensal(entrada);
}

/**
 * Datas das ocorrências que caem em cima de um agendamento já existente da profissional. No modo
 * "bloquear tudo", basta uma para a criação inteira ser recusada. As ocorrências entre si nunca
 * conflitam (caem sempre em dias distintos), então só cruzamos contra os `existentes`.
 */
export function ocorrenciasEmConflito(
  ocorrencias: IntervaloAgendamento[],
  existentes: IntervaloAgendamento[],
): Date[] {
  return ocorrencias
    .filter((ocorrencia) => encontrarConflito(ocorrencia, existentes) !== null)
    .map((ocorrencia) => ocorrencia.inicio);
}
