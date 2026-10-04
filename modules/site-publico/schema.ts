import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usuario } from "@/modules/auth/schema";

export const conteudoSite = pgTable("conteudo_site", {
  id: uuid("id").defaultRandom().primaryKey(),
  tipo: text("tipo", { enum: ["destaque", "depoimento", "profissional"] }).notNull(),
  titulo: text("titulo").notNull(),
  subtitulo: text("subtitulo").notNull().default(""),
  texto: text("texto").notNull().default(""),
  tipoMidia: text("tipo_midia", { enum: ["imagem", "video"] })
    .notNull()
    .default("imagem"),
  midia: text("midia").notNull().default(""),
  /** Ajustes aplicados na hora de exibir — o arquivo original nunca é reprocessado. */
  filtro: text("filtro", {
    enum: ["original", "quente", "suave", "vivo", "pb", "retro"],
  })
    .notNull()
    .default("original"),
  somOriginal: boolean("som_original").notNull().default(true),
  musica: text("musica").notNull().default(""),
  volumeMusica: integer("volume_musica").notNull().default(60),
  ordem: integer("ordem").notNull().default(0),
  nota: integer("nota"),
  publicado: boolean("publicado").notNull().default(false),
  autorizacaoPublicacao: boolean("autorizacao_publicacao").notNull().default(false),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const historicoConteudoSite = pgTable("historico_conteudo_site", {
  id: uuid("id").defaultRandom().primaryKey(),
  conteudoId: uuid("conteudo_id").notNull(),
  usuarioId: uuid("usuario_id").references(() => usuario.id, { onDelete: "set null" }),
  dados: jsonb("dados").notNull(),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
});

export const conteudoSiteInsertSchema = createInsertSchema(conteudoSite);
export type ConteudoSite = typeof conteudoSite.$inferSelect;

/** Textos editados das seções fixas do site (ver `blocos.ts`). Sem registro = texto padrão. */
export const blocoSite = pgTable("bloco_site", {
  chave: text("chave").primaryKey(),
  valor: jsonb("valor").notNull(),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const historicoBlocoSite = pgTable("historico_bloco_site", {
  id: uuid("id").defaultRandom().primaryKey(),
  chave: text("chave").notNull(),
  usuarioId: uuid("usuario_id").references(() => usuario.id, { onDelete: "set null" }),
  dados: jsonb("dados").notNull(),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
});
