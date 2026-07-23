import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { usuario } from "@/modules/auth/schema";

/**
 * Histórico do assistente de IA flutuante do painel (docs/context/04-roadmap.md, Fase 3).
 * Rascunho de chat por profissional — não é registro clínico/auditável, por isso `onDelete:
 * "cascade"` (diferente de `sessao`/`documento`, que nunca cascateiam).
 */
export const papeisMensagemAssistente = ["usuario", "assistente"] as const;

export type PapelMensagemAssistente = (typeof papeisMensagemAssistente)[number];

export const papelMensagemAssistenteEnum = pgEnum(
  "papel_mensagem_assistente",
  papeisMensagemAssistente,
);

export const mensagemAssistente = pgTable(
  "mensagem_assistente",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profissionalId: uuid("profissional_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "cascade" }),
    papel: papelMensagemAssistenteEnum("papel").notNull(),
    conteudo: text("conteudo").notNull(),
    criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    profissionalCriadoIdx: index("mensagem_assistente_profissional_criado_idx").on(
      table.profissionalId,
      table.criadoEm,
    ),
  }),
);

export const anexoAssistente = pgTable(
  "anexo_assistente",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profissionalId: uuid("profissional_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "cascade" }),
    nomeArquivo: text("nome_arquivo").notNull(),
    contentType: text("content_type").notNull(),
    tamanhoBytes: integer("tamanho_bytes").notNull(),
    totalPaginas: integer("total_paginas"),
    totalCaracteres: integer("total_caracteres").notNull(),
    textoExtraido: text("texto_extraido").notNull(),
    criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    profissionalCriadoIdx: index("anexo_assistente_profissional_criado_idx").on(
      table.profissionalId,
      table.criadoEm,
    ),
  }),
);

export const mensagemAssistenteSelectSchema = createSelectSchema(mensagemAssistente);
export const mensagemAssistenteInsertSchema = createInsertSchema(mensagemAssistente);
export const anexoAssistenteSelectSchema = createSelectSchema(anexoAssistente);
export const anexoAssistenteInsertSchema = createInsertSchema(anexoAssistente);

/** Valida o body de POST /api/assistente/chat — teto de abuso, não regra de negócio fina. */
export const mensagemUiSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(z.unknown()).min(1),
});

export const enviarMensagemAssistenteSchema = z.object({
  messages: z.array(mensagemUiSchema).min(1).max(200),
  anexoId: z.string().uuid().optional(),
});

export type MensagemAssistente = typeof mensagemAssistente.$inferSelect;
export type NovaMensagemAssistente = typeof mensagemAssistente.$inferInsert;
export type AnexoAssistente = typeof anexoAssistente.$inferSelect;
export type NovoAnexoAssistente = typeof anexoAssistente.$inferInsert;
