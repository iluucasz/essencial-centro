import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { cliente } from "@/modules/clientes/schema";
import { servico } from "@/modules/servicos/schema";
import { usuario } from "@/modules/auth/schema";

export const situacoesPagamento = ["pendente", "parcial", "pago"] as const;

export type SituacaoPagamento = (typeof situacoesPagamento)[number];

export const situacaoPagamentoEnum = pgEnum("situacao_pagamento", situacoesPagamento);

export const rotulosSituacaoPagamento: Record<SituacaoPagamento, string> = {
  pendente: "Pendente",
  parcial: "Pago parcialmente",
  pago: "Pago",
};

export const pacote = pgTable("pacote", {
  id: uuid("id").defaultRandom().primaryKey(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => cliente.id, { onDelete: "restrict" }),
  servicoId: uuid("servico_id")
    .notNull()
    .references(() => servico.id, { onDelete: "restrict" }),
  quantidadeSessoes: integer("quantidade_sessoes").notNull(),
  dataContratacao: timestamp("data_contratacao", { mode: "date" }).notNull().defaultNow(),
  validade: date("validade", { mode: "date" }),
  valorCentavos: integer("valor_centavos"),
  formaPagamento: text("forma_pagamento"),
  situacaoPagamento: situacaoPagamentoEnum("situacao_pagamento").notNull().default("pendente"),
  ativo: boolean("ativo").notNull().default(true),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const pacoteSelectSchema = createSelectSchema(pacote);
export const pacoteInsertSchema = createInsertSchema(pacote);

const textoCurtoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(160).optional(),
);

const validadeOpcional = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" && value.trim() !== "") return new Date(`${value}T00:00:00.000`);
  return undefined;
}, z.date().optional());

const valorSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;

  const normalizado = value.trim().replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? Math.round(numero * 100) : NaN;
}, z.number("Informe um valor válido.").int().nonnegative().optional());

export const criarPacoteSchema = z.object({
  clienteId: z.string().uuid("Selecione um cliente."),
  servicoId: z.string().uuid("Selecione um serviço."),
  quantidadeSessoes: z.coerce
    .number("Informe a quantidade de sessões.")
    .int()
    .min(1, "O pacote precisa de ao menos 1 sessão.")
    .max(100, "Quantidade de sessões acima do esperado."),
  validade: validadeOpcional,
  valorCentavos: valorSchema,
  formaPagamento: textoCurtoOpcional,
  situacaoPagamento: z.enum(situacoesPagamento).default("pendente"),
});

export type Pacote = typeof pacote.$inferSelect;
export type NovoPacote = typeof pacote.$inferInsert;
export type CriarPacoteInput = z.infer<typeof criarPacoteSchema>;
