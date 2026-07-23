import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { z } from "zod";

import { cliente } from "@/modules/clientes/schema";
import { servico } from "@/modules/servicos/schema";
import { usuario } from "@/modules/auth/schema";

import { camposModeloSchema, type CampoModelo } from "./campos";

/**
 * Catálogo completo do domínio (docs/context/07-fichas.md). Só `estetica_corporal` tem schema de
 * respostas implementado por enquanto — os demais entram um de cada vez, seguindo o mesmo padrão
 * (schema Zod em `respostasPorTipo` + formulário próprio), sem precisar migrar a tabela.
 */
export const tiposFicha = [
  "extensao_cilios",
  "estetica_corporal",
  "ozonioterapia",
  "terapia_capilar",
  "limpeza_pele_masculina",
  "limpeza_pele_feminina",
  "criolipolise",
  "massoterapia",
  "depilacao",
  "plano_tratamento",
  "contrato_prestacao_servicos",
] as const;

export type TipoFicha = (typeof tiposFicha)[number];

export const tipoFichaEnum = pgEnum("tipo_ficha", tiposFicha);

export const rotulosTipoFicha: Record<TipoFicha, string> = {
  extensao_cilios: "Extensão de cílios",
  estetica_corporal: "Estética corporal",
  ozonioterapia: "Ozonioterapia",
  terapia_capilar: "Terapia capilar",
  limpeza_pele_masculina: "Limpeza de pele masculina",
  limpeza_pele_feminina: "Limpeza de pele feminina",
  criolipolise: "Criolipólise",
  massoterapia: "Massoterapia",
  depilacao: "Depilação",
  plano_tratamento: "Plano de tratamento",
  contrato_prestacao_servicos: "Contrato de prestação de serviços",
};

export const statusFicha = [
  "rascunho",
  "aguardando_cliente",
  "preenchida",
  "revisada",
  "assinada",
] as const;

export type StatusFicha = (typeof statusFicha)[number];

export const statusFichaEnum = pgEnum("status_ficha", statusFicha);

export const rotulosStatusFicha: Record<StatusFicha, string> = {
  rascunho: "Rascunho",
  aguardando_cliente: "Aguardando cliente",
  preenchida: "Preenchida",
  revisada: "Revisada",
  assinada: "Assinada",
};

export const preenchidaPorFicha = ["profissional", "cliente"] as const;

export type PreenchidaPorFicha = (typeof preenchidaPorFicha)[number];

export const preenchidaPorFichaEnum = pgEnum("preenchida_por_ficha", preenchidaPorFicha);

/**
 * Modelo de ficha (construtor estilo Google Forms): os campos ficam em JSONB validado por
 * `camposModeloSchema` (modules/fichas/campos.ts) — novos modelos sem migração de tabela. É editável
 * pela profissional (CRUD); a semente (modelos-semente.ts) só insere quando o slug ainda não existe.
 */
export const modeloFicha = pgTable("modelo_ficha", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  campos: jsonb("campos").$type<CampoModelo[]>().notNull(),
  ativo: boolean("ativo").notNull().default(true),
  criadoPorId: uuid("criado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const ficha = pgTable("ficha", {
  id: uuid("id").defaultRandom().primaryKey(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => cliente.id, { onDelete: "restrict" }),
  servicoId: uuid("servico_id").references(() => servico.id, { onDelete: "set null" }),
  /** Ficha dinâmica aponta para o modelo; fichas legadas usam `tipo` (nulo nas novas). */
  modeloFichaId: uuid("modelo_ficha_id").references(() => modeloFicha.id, { onDelete: "set null" }),
  tipo: tipoFichaEnum("tipo"),
  preenchidaPor: preenchidaPorFichaEnum("preenchida_por"),
  /** Link público (WhatsApp) para o cliente preencher — token forte, uso único, com expiração. */
  tokenPublico: text("token_publico").unique(),
  tokenExpiraEm: timestamp("token_expira_em", { mode: "date" }),
  status: statusFichaEnum("status").notNull().default("preenchida"),
  versao: integer("versao").notNull().default(1),
  /** Aponta para a versão anterior quando uma ficha já assinada é revisada (nunca sobrescrita). */
  versaoAnteriorId: uuid("versao_anterior_id").references((): AnyPgColumn => ficha.id, {
    onDelete: "set null",
  }),
  /** Estrutura validada por `respostasPorTipo[tipo]` — três áreas: relato, avaliacaoProfissional, compartilhado. */
  respostas: jsonb("respostas").notNull(),
  /** "Assinatura" simplificada do MVP: confirmação com carimbo de data/hora (Fase 2 traz e-signature real). */
  aceiteTermosEm: timestamp("aceite_termos_em", { mode: "date" }),
  autorizacaoImagemEm: timestamp("autorizacao_imagem_em", { mode: "date" }),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const fichaSelectSchema = createSelectSchema(ficha);
export const fichaInsertSchema = createInsertSchema(ficha);

export const modeloFichaSelectSchema = createSelectSchema(modeloFicha);

const descricaoModeloOpcional = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().max(500).optional(),
);

/** Entrada do construtor de modelos — valida os campos via `camposModeloSchema`. */
export const salvarModeloFichaSchema = z.object({
  nome: z.string().trim().min(2, "Dê um nome ao modelo.").max(200),
  descricao: descricaoModeloOpcional,
  ativo: z.boolean().default(true),
  campos: camposModeloSchema,
});

export const editarModeloFichaSchema = salvarModeloFichaSchema.extend({
  id: z.string().uuid("Modelo inválido."),
});

export type ModeloFicha = typeof modeloFicha.$inferSelect;
export type NovoModeloFicha = typeof modeloFicha.$inferInsert;
export type SalvarModeloFichaInput = z.infer<typeof salvarModeloFichaSchema>;
export type EditarModeloFichaInput = z.infer<typeof editarModeloFichaSchema>;

export type Ficha = typeof ficha.$inferSelect;
export type NovaFicha = typeof ficha.$inferInsert;
