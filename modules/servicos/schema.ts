import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { usuario } from "@/modules/auth/schema";

export const tiposOpcaoServico = ["grupo", "periodicidade"] as const;

export type TipoOpcaoServico = (typeof tiposOpcaoServico)[number];

export const tipoOpcaoServicoEnum = pgEnum("tipo_opcao_servico", tiposOpcaoServico);

/**
 * Lista extensível de opções pra "Grupo" e "Periodicidade" do serviço — os valores com
 * `padrao=true` vêm do catálogo original (seed da migration) e não podem ser excluídos; os
 * demais são criados pela própria profissional ao digitar "Outro" no formulário de serviço.
 * `servico.grupo`/`servico.periodicidade` guardam o texto direto (sem FK) — excluir uma opção
 * daqui não afeta serviços que já usam aquele valor, só some da lista pra novos cadastros.
 */
export const opcaoServico = pgTable(
  "opcao_servico",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tipo: tipoOpcaoServicoEnum("tipo").notNull(),
    nome: text("nome").notNull(),
    padrao: boolean("padrao").notNull().default(false),
    criadoPorId: uuid("criado_por_id").references(() => usuario.id, { onDelete: "set null" }),
    criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    tipoNomeUnique: uniqueIndex("opcao_servico_tipo_nome_unique").on(table.tipo, table.nome),
  }),
);

const textoLongoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(2000).optional(),
);

const valorSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;

  const normalizado = value.trim().replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? Math.round(numero * 100) : NaN;
}, z.number("Informe um valor válido.").int().nonnegative().optional());

export const servico = pgTable("servico", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  grupo: text("grupo").notNull(),
  descricao: text("descricao"),
  indicacao: text("indicacao"),
  contraindicacoes: text("contraindicacoes"),
  duracaoMinutos: integer("duracao_minutos").notNull(),
  valorCentavos: integer("valor_centavos"),
  preparo: text("preparo"),
  cuidadosPosteriores: text("cuidados_posteriores"),
  ativo: boolean("ativo").notNull().default(true),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const servicoSelectSchema = createSelectSchema(servico);
export const servicoInsertSchema = createInsertSchema(servico);

export const criarServicoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do serviço.").max(120),
  grupo: z.string().trim().min(2, "Selecione ou informe um grupo.").max(120),
  descricao: textoLongoOpcional,
  indicacao: textoLongoOpcional,
  contraindicacoes: textoLongoOpcional,
  duracaoMinutos: z.coerce
    .number("Informe a duração em minutos.")
    .int()
    .min(5, "A duração mínima é de 5 minutos.")
    .max(480, "A duração máxima é de 8 horas."),
  valorCentavos: valorSchema,
  preparo: textoLongoOpcional,
  cuidadosPosteriores: textoLongoOpcional,
});

export const opcaoServicoSelectSchema = createSelectSchema(opcaoServico);

export const excluirOpcaoServicoSchema = z.object({
  id: z.string().uuid("Opção inválida."),
});

export type Servico = typeof servico.$inferSelect;
export type NovoServico = typeof servico.$inferInsert;
export type CriarServicoInput = z.infer<typeof criarServicoSchema>;
export type OpcaoServico = typeof opcaoServico.$inferSelect;
