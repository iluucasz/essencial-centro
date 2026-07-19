import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { boolean, date, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { agendamento } from "@/modules/agenda/schema";
import { cliente } from "@/modules/clientes/schema";
import { pacote } from "@/modules/pacotes/schema";
import { servico } from "@/modules/servicos/schema";
import { usuario } from "@/modules/auth/schema";

/**
 * Registro clínico de um atendimento realizado. Campos por área (docs/context/00-produto.md,
 * regra de ouro): relato do cliente / avaliação da profissional / compartilhada. Fotos e medidas
 * atualizadas (ver docs/context/07-fichas.md) entram como associação quando os módulos `fotos` e
 * `medidas` existirem — mesma lógica de `agendamento.pacoteId`.
 */
export const sessao = pgTable("sessao", {
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
  agendamentoId: uuid("agendamento_id").references(() => agendamento.id, { onDelete: "set null" }),
  pacoteId: uuid("pacote_id").references(() => pacote.id, { onDelete: "set null" }),
  dataHora: timestamp("data_hora", { mode: "date" }).notNull().defaultNow(),
  duracaoMinutos: integer("duracao_minutos"),
  regiaoTratada: text("regiao_tratada"),

  // Relato do cliente
  condicaoAntes: text("condicao_antes"),
  relatoCliente: text("relato_cliente"),
  escalaDorAntes: integer("escala_dor_antes"),
  escalaDorDepois: integer("escala_dor_depois"),

  // Avaliação da profissional (não visível ao cliente)
  avaliacaoProfissional: text("avaliacao_profissional"),
  equipamentosUtilizados: text("equipamentos_utilizados"),
  parametrosUtilizados: text("parametros_utilizados"),
  produtosAplicados: text("produtos_aplicados"),
  reacoesObservadas: text("reacoes_observadas"),
  observacoesInternas: text("observacoes_internas"),

  // Área compartilhada
  orientacoesPosAtendimento: text("orientacoes_pos_atendimento"),
  proximaSessaoRecomendada: date("proxima_sessao_recomendada", { mode: "date" }),

  presencaConfirmada: boolean("presenca_confirmada").notNull().default(true),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const sessaoSelectSchema = createSelectSchema(sessao);
export const sessaoInsertSchema = createInsertSchema(sessao);

const textoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(2000).optional(),
);

const idOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().uuid().optional(),
);

const dataOpcional = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" && value.trim() !== "") return new Date(`${value}T00:00:00.000`);
  return undefined;
}, z.date().optional());

const escalaDorOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.coerce
    .number()
    .int()
    .min(0, "A escala de dor vai de 0 a 10.")
    .max(10, "A escala de dor vai de 0 a 10.")
    .optional(),
);

export const criarSessaoSchema = z.object({
  clienteId: z.string().uuid(),
  servicoId: z.string().uuid("Selecione um serviço."),
  agendamentoId: idOpcional,
  pacoteId: idOpcional,
  duracaoMinutos: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.number().int().min(1).max(480).optional(),
  ),
  regiaoTratada: textoOpcional,
  condicaoAntes: textoOpcional,
  relatoCliente: textoOpcional,
  escalaDorAntes: escalaDorOpcional,
  escalaDorDepois: escalaDorOpcional,
  avaliacaoProfissional: textoOpcional,
  equipamentosUtilizados: textoOpcional,
  parametrosUtilizados: textoOpcional,
  produtosAplicados: textoOpcional,
  reacoesObservadas: textoOpcional,
  observacoesInternas: textoOpcional,
  orientacoesPosAtendimento: textoOpcional,
  proximaSessaoRecomendada: dataOpcional,
  presencaConfirmada: z.boolean().default(true),
});

export const editarSessaoSchema = criarSessaoSchema.extend({
  id: z.string().uuid("Sessão inválida."),
});

export type Sessao = typeof sessao.$inferSelect;
export type NovaSessao = typeof sessao.$inferInsert;
export type CriarSessaoInput = z.infer<typeof criarSessaoSchema>;
export type EditarSessaoInput = z.infer<typeof editarSessaoSchema>;
