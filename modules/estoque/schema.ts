import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { boolean, date, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { usuario } from "@/modules/auth/schema";

export const produto = pgTable("produto", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  unidade: text("unidade"),
  estoqueMinimo: integer("estoque_minimo"),
  ativo: boolean("ativo").notNull().default(true),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const produtoSelectSchema = createSelectSchema(produto);
export const produtoInsertSchema = createInsertSchema(produto);

const textoCurtoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(160).optional(),
);

const valorCentavosOpcional = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;

  const normalizado = value.trim().replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? Math.round(numero * 100) : NaN;
}, z.number("Informe um valor válido.").int().nonnegative().optional());

const dataOpcional = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" && value.trim() !== "") return new Date(`${value}T00:00:00.000`);
  return undefined;
}, z.date().optional());

const inteiroOpcional = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const numero = Number(value);
  return Number.isFinite(numero) ? Math.round(numero) : NaN;
}, z.number("Informe um número válido.").int().nonnegative().optional());

export const criarProdutoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do produto.").max(160),
  unidade: textoCurtoOpcional,
  estoqueMinimo: inteiroOpcional,
});

export type Produto = typeof produto.$inferSelect;
export type NovoProduto = typeof produto.$inferInsert;
export type CriarProdutoInput = z.infer<typeof criarProdutoSchema>;

export const lote = pgTable("lote", {
  id: uuid("id").defaultRandom().primaryKey(),
  produtoId: uuid("produto_id")
    .notNull()
    .references(() => produto.id, { onDelete: "restrict" }),
  numeroLote: text("numero_lote"),
  quantidadeInicial: integer("quantidade_inicial").notNull(),
  validade: date("validade", { mode: "date" }),
  custoCentavos: integer("custo_centavos"),
  fornecedor: text("fornecedor"),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
});

export const loteSelectSchema = createSelectSchema(lote);
export const loteInsertSchema = createInsertSchema(lote);

export const criarLoteSchema = z.object({
  produtoId: z.string().uuid("Selecione um produto."),
  numeroLote: textoCurtoOpcional,
  quantidadeInicial: z.coerce
    .number("Informe a quantidade recebida.")
    .int()
    .positive("A quantidade deve ser maior que zero."),
  validade: dataOpcional,
  custoCentavos: valorCentavosOpcional,
  fornecedor: textoCurtoOpcional,
});

export type Lote = typeof lote.$inferSelect;
export type NovoLote = typeof lote.$inferInsert;
export type CriarLoteInput = z.infer<typeof criarLoteSchema>;

export const movimentacaoEstoque = pgTable("movimentacao_estoque", {
  id: uuid("id").defaultRandom().primaryKey(),
  loteId: uuid("lote_id")
    .notNull()
    .references(() => lote.id, { onDelete: "restrict" }),
  quantidade: integer("quantidade").notNull(),
  motivo: text("motivo"),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
});

export const movimentacaoEstoqueSelectSchema = createSelectSchema(movimentacaoEstoque);
export const movimentacaoEstoqueInsertSchema = createInsertSchema(movimentacaoEstoque);

export const registrarSaidaSchema = z.object({
  loteId: z.string().uuid("Selecione um lote."),
  quantidade: z.coerce
    .number("Informe a quantidade utilizada.")
    .int()
    .positive("A quantidade deve ser maior que zero."),
  motivo: textoCurtoOpcional,
});

export type MovimentacaoEstoque = typeof movimentacaoEstoque.$inferSelect;
export type NovaMovimentacaoEstoque = typeof movimentacaoEstoque.$inferInsert;
export type RegistrarSaidaInput = z.infer<typeof registrarSaidaSchema>;
