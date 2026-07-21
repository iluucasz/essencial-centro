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
  { valor: 0, rotulo: "Domingo" },
  { valor: 1, rotulo: "Segunda-feira" },
  { valor: 2, rotulo: "Terça-feira" },
  { valor: 3, rotulo: "Quarta-feira" },
  { valor: 4, rotulo: "Quinta-feira" },
  { valor: 5, rotulo: "Sexta-feira" },
  { valor: 6, rotulo: "Sábado" },
] as const;
