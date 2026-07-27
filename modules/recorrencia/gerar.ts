import { encontrarConflito, type IntervaloAgendamento } from "@/modules/agenda/sobreposicao";

import type { PadraoRepeticao } from "./schema";

export type EntradaRecorrencia = {
  frequencia: PadraoRepeticao;
  /** Dia da semana alvo (0=domingo … 6=sábado) — usado quando `frequencia = "semanal"`. */
  diaSemana: number | null;
  /**
   * Dias da semana alvo (0=domingo … 6=sábado) — usado quando `frequencia = "dias_semana"`.
   * Ex.: `[1, 3, 5]` para segunda, quarta e sexta na mesma série.
   */
  diasSemana?: number[];
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
const UM_DIA_MS = 24 * 60 * 60 * 1000;

function comHorario(ano: number, mes: number, dia: number, hora: number, minuto: number): Date {
  return new Date(Date.UTC(ano, mes, dia, hora, minuto));
}

function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

function inicioDoDia(data: Date): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
}

/**
 * Varre o calendário dia a dia a partir de `dataInicio` e materializa os dias que passam no filtro,
 * sempre no mesmo horário. Base de "semanal", "dias da semana escolhidos" e "dia sim, dia não".
 */
function gerarVarrendoDias(entrada: EntradaRecorrencia, aceitar: (dia: Date) => boolean): Date[] {
  const { hora, minuto, dataInicio, quantidade } = entrada;
  const ocorrencias: Date[] = [];
  const cursor = inicioDoDia(dataInicio);

  let iteracoes = 0;
  while (ocorrencias.length < quantidade && iteracoes < MAX_ITERACOES) {
    if (aceitar(cursor)) {
      ocorrencias.push(
        comHorario(
          cursor.getUTCFullYear(),
          cursor.getUTCMonth(),
          cursor.getUTCDate(),
          hora,
          minuto,
        ),
      );
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    iteracoes += 1;
  }

  return ocorrencias;
}

function gerarSemanal(entrada: EntradaRecorrencia): Date[] {
  if (entrada.diaSemana === null) return [];

  return gerarVarrendoDias(entrada, (dia) => dia.getUTCDay() === entrada.diaSemana);
}

/**
 * Ex.: segunda, quarta e sexta às 14h30 — três atendimentos por semana na mesma série, sem precisar
 * abrir um agendamento novo para cada dia.
 */
function gerarPorDiasDaSemana(entrada: EntradaRecorrencia): Date[] {
  const alvos = new Set(entrada.diasSemana ?? []);
  if (alvos.size === 0) return [];

  return gerarVarrendoDias(entrada, (dia) => alvos.has(dia.getUTCDay()));
}

/** Dia sim, dia não: a cada 2 dias corridos a partir de `dataInicio`, sem olhar o dia da semana. */
function gerarDiasAlternados(entrada: EntradaRecorrencia): Date[] {
  const base = inicioDoDia(entrada.dataInicio).getTime();

  return gerarVarrendoDias(entrada, (dia) => {
    const diasCorridos = Math.round((dia.getTime() - base) / UM_DIA_MS);

    return diasCorridos % 2 === 0;
  });
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

  switch (entrada.frequencia) {
    case "semanal":
      return gerarSemanal(entrada);
    case "dias_semana":
      return gerarPorDiasDaSemana(entrada);
    case "dias_alternados":
      return gerarDiasAlternados(entrada);
    case "mensal":
      return gerarMensal(entrada);
  }
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
