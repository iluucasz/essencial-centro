import { pgEnum } from "drizzle-orm/pg-core";

/**
 * `modules/recorrencia` não tem tabela própria: a **configuração** de recorrência mora no `pacote`
 * (ver `modules/pacotes/schema` — colunas `rec*`), e a lógica de expansão em datas é a função pura
 * `gerar.ts`. Este arquivo só define o enum de frequência, compartilhado pelo schema do pacote (coluna
 * `recFrequencia`) e pela UI. Materializar a agenda de um pacote é `gerarAgendamentosDoPacote`
 * (`actions.ts`).
 */
export const frequenciaRecorrencia = ["semanal", "mensal"] as const;

export type FrequenciaRecorrencia = (typeof frequenciaRecorrencia)[number];

export const frequenciaRecorrenciaEnum = pgEnum("frequencia_recorrencia", frequenciaRecorrencia);

export const rotulosFrequenciaRecorrencia: Record<FrequenciaRecorrencia, string> = {
  semanal: "Semanal (dia da semana)",
  mensal: "Mensal (dia do mês)",
};

export const diasDaSemana = [
  { valor: 0, rotulo: "Domingo", abreviacao: "Dom" },
  { valor: 1, rotulo: "Segunda-feira", abreviacao: "Seg" },
  { valor: 2, rotulo: "Terça-feira", abreviacao: "Ter" },
  { valor: 3, rotulo: "Quarta-feira", abreviacao: "Qua" },
  { valor: 4, rotulo: "Quinta-feira", abreviacao: "Qui" },
  { valor: 5, rotulo: "Sexta-feira", abreviacao: "Sex" },
  { valor: 6, rotulo: "Sábado", abreviacao: "Sáb" },
] as const;

/**
 * Padrões de repetição do "pré-preencher datas" (UI + `gerar.ts`). É um **superset** de
 * `frequenciaRecorrencia`: os dois extras (`dias_semana`, `dias_alternados`) só existem no momento
 * de gerar as datas — nada é persistido com eles, então o enum do banco continua `semanal|mensal`.
 */
export const padraoRepeticao = ["semanal", "dias_semana", "dias_alternados", "mensal"] as const;

export type PadraoRepeticao = (typeof padraoRepeticao)[number];

export const rotulosPadraoRepeticao: Record<PadraoRepeticao, string> = {
  semanal: "Semanal (mesmo dia da semana)",
  dias_semana: "Dias da semana escolhidos",
  dias_alternados: "Dia sim, dia não",
  mensal: "Mensal (dia do mês)",
};
