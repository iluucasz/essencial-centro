import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { date, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { usuario } from "@/modules/auth/schema";
import { cliente } from "@/modules/clientes/schema";
import { pacote } from "@/modules/pacotes/schema";

export const tiposLancamento = ["receita", "despesa"] as const;

export type TipoLancamento = (typeof tiposLancamento)[number];

export const tipoLancamentoEnum = pgEnum("tipo_lancamento", tiposLancamento);

export const rotulosTipoLancamento: Record<TipoLancamento, string> = {
  receita: "Receita",
  despesa: "Despesa",
};

export const situacoesLancamento = ["pendente", "pago", "cancelado"] as const;

export type SituacaoLancamento = (typeof situacoesLancamento)[number];

export const situacaoLancamentoEnum = pgEnum("situacao_lancamento", situacoesLancamento);

export const rotulosSituacaoLancamento: Record<SituacaoLancamento, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

export const lancamentoFinanceiro = pgTable("lancamento_financeiro", {
  id: uuid("id").defaultRandom().primaryKey(),
  tipo: tipoLancamentoEnum("tipo").notNull(),
  categoria: text("categoria").notNull(),
  descricao: text("descricao"),
  valorCentavos: integer("valor_centavos").notNull(),
  data: date("data", { mode: "date" }).notNull(),
  formaPagamento: text("forma_pagamento"),
  situacao: situacaoLancamentoEnum("situacao").notNull().default("pendente"),
  clienteId: uuid("cliente_id").references(() => cliente.id, { onDelete: "set null" }),
  pacoteId: uuid("pacote_id").references(() => pacote.id, { onDelete: "set null" }),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const lancamentoFinanceiroSelectSchema = createSelectSchema(lancamentoFinanceiro);
export const lancamentoFinanceiroInsertSchema = createInsertSchema(lancamentoFinanceiro);

const textoCurtoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(160).optional(),
);

const idOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().uuid().optional(),
);

const valorSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;

  const normalizado = value.trim().replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? Math.round(numero * 100) : NaN;
}, z.number("Informe um valor válido.").int().positive("O valor deve ser maior que zero."));

const dataSchema = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" && value.trim() !== "") return new Date(`${value}T00:00:00.000`);
  return value;
}, z.date("Informe a data do lançamento."));

export const criarLancamentoSchema = z.object({
  tipo: z.enum(tiposLancamento, "Selecione o tipo do lançamento."),
  categoria: z.string().trim().min(2, "Informe a categoria.").max(120),
  descricao: textoCurtoOpcional,
  valorCentavos: valorSchema,
  data: dataSchema,
  formaPagamento: textoCurtoOpcional,
  situacao: z.enum(situacoesLancamento).default("pendente"),
  clienteId: idOpcional,
  pacoteId: idOpcional,
});

export type LancamentoFinanceiro = typeof lancamentoFinanceiro.$inferSelect;
export type NovoLancamentoFinanceiro = typeof lancamentoFinanceiro.$inferInsert;
export type CriarLancamentoInput = z.infer<typeof criarLancamentoSchema>;
