import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { cliente } from "@/modules/clientes/schema";
import { pacote } from "@/modules/pacotes/schema";
import { servico } from "@/modules/servicos/schema";
import { usuario } from "@/modules/auth/schema";

export const statusAgendamento = ["marcado", "realizado", "falta", "cancelado"] as const;

export type StatusAgendamento = (typeof statusAgendamento)[number];

export const statusAgendamentoEnum = pgEnum("status_agendamento", statusAgendamento);

export const rotulosStatusAgendamento: Record<StatusAgendamento, string> = {
  marcado: "Marcado",
  realizado: "Realizado",
  falta: "Falta",
  cancelado: "Cancelado",
};

export const modalidadeAtendimento = ["presencial", "domiciliar"] as const;

export type ModalidadeAtendimento = (typeof modalidadeAtendimento)[number];

export const modalidadeAtendimentoEnum = pgEnum("modalidade_atendimento", modalidadeAtendimento);

export const rotulosModalidadeAtendimento: Record<ModalidadeAtendimento, string> = {
  presencial: "Presencial",
  domiciliar: "Domiciliar",
};

export const agendamento = pgTable("agendamento", {
  id: uuid("id").defaultRandom().primaryKey(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => cliente.id, { onDelete: "restrict" }),
  servicoId: uuid("servico_id")
    .notNull()
    .references(() => servico.id, { onDelete: "restrict" }),
  profissionalId: uuid("profissional_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  /** Sessão avulsa quando nulo; consome uma sessão do pacote quando vinculado. */
  pacoteId: uuid("pacote_id").references(() => pacote.id, { onDelete: "set null" }),
  inicio: timestamp("inicio", { mode: "date" }).notNull(),
  duracaoMinutos: integer("duracao_minutos").notNull(),
  status: statusAgendamentoEnum("status").notNull().default("marcado"),
  modalidade: modalidadeAtendimentoEnum("modalidade").notNull().default("presencial"),
  observacoes: text("observacoes"),
  checkinEm: timestamp("checkin_em", { mode: "date" }),
  /** Marca quando cada lembrete baseado em tempo foi disparado — evita duplicar a cada execução do cron. */
  lembreteDiaAnteriorEm: timestamp("lembrete_dia_anterior_em", { mode: "date" }),
  lembreteHorasAntesEm: timestamp("lembrete_horas_antes_em", { mode: "date" }),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, {
    onDelete: "set null",
  }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const agendamentoSelectSchema = createSelectSchema(agendamento);
export const agendamentoInsertSchema = createInsertSchema(agendamento);

/**
 * Interpreta o valor de um `<input type="datetime-local">` ("AAAA-MM-DDTHH:mm[:ss]", sem fuso) como
 * horário de parede gravado nos campos UTC do Date — a mesma convenção que o formulário usa para
 * *ler* o valor (getUTC* em formulario-agendamento) e que `agoraBrasilia()` assume (ver lib/utils).
 * Não usar `new Date(string)`: ele interpreta a string no fuso do processo — UTC na Vercel, mas -3h
 * num dev em Brasília —, gravando o horário deslocado (marcar 12:00 virava 15:00Z no dev). Retorna
 * null quando o formato não bate, deixando o Zod reportar "Informe data e horário.".
 */
export function interpretarDataHoraParede(valor: string): Date | null {
  const partes = valor.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!partes) return null;

  const [, ano, mes, dia, hora, minuto, segundo] = partes;

  return new Date(
    Date.UTC(
      Number(ano),
      Number(mes) - 1,
      Number(dia),
      Number(hora),
      Number(minuto),
      Number(segundo ?? 0),
    ),
  );
}

const dataHoraSchema = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" && value) return interpretarDataHoraParede(value) ?? value;
  return value;
}, z.date("Informe data e horário."));

const observacoesOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(2000).optional(),
);

const pacoteIdOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().uuid("Pacote inválido.").optional(),
);

export const criarAgendamentoSchema = z.object({
  clienteId: z.string().uuid("Selecione um cliente."),
  servicoId: z.string().uuid("Selecione um serviço."),
  profissionalId: z.string().uuid("Selecione uma profissional."),
  pacoteId: pacoteIdOpcional,
  inicio: dataHoraSchema,
  duracaoMinutos: z.coerce
    .number("Informe a duração em minutos.")
    .int()
    .min(5, "A duração mínima é de 5 minutos.")
    .max(480, "A duração máxima é de 8 horas."),
  modalidade: z.enum(modalidadeAtendimento).default("presencial"),
  observacoes: observacoesOpcional,
});

export const atualizarStatusAgendamentoSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "realizado",
    "falta",
    "cancelado",
  ] as const satisfies readonly StatusAgendamento[]),
});

export const atualizarAgendamentoSchema = criarAgendamentoSchema.extend({
  id: z.string().uuid("Agendamento inválido."),
});

export type Agendamento = typeof agendamento.$inferSelect;
export type NovoAgendamento = typeof agendamento.$inferInsert;
export type CriarAgendamentoInput = z.infer<typeof criarAgendamentoSchema>;
export type AtualizarAgendamentoInput = z.infer<typeof atualizarAgendamentoSchema>;
