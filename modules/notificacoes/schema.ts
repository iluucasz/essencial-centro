import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { boolean, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { usuario } from "@/modules/auth/schema";

/**
 * Central de notificações in-app (docs/context/00-produto.md "Agenda e notificações").
 * Sem provedor externo (e-mail/SMS/WhatsApp) nesta fase — fica para a Fase 2
 * (docs/context/04-roadmap.md); também não há cron/scheduler no projeto, então só os lembretes
 * disparados por uma ação real do usuário (agendar, concluir sessão, pacote acabando) existem
 * aqui — os baseados em tempo ("um dia antes") exigiriam um scheduler, ainda não construído.
 */
export const tiposNotificacao = [
  "agendamento_criado",
  "sessao_concluida",
  "pacote_acabando",
  "geral",
] as const;

export type TipoNotificacao = (typeof tiposNotificacao)[number];

export const tipoNotificacaoEnum = pgEnum("tipo_notificacao", tiposNotificacao);

export const notificacao = pgTable("notificacao", {
  id: uuid("id").defaultRandom().primaryKey(),
  destinatarioId: uuid("destinatario_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "cascade" }),
  tipo: tipoNotificacaoEnum("tipo").notNull(),
  titulo: text("titulo").notNull(),
  mensagem: text("mensagem").notNull(),
  link: text("link"),
  lida: boolean("lida").notNull().default(false),
  lidaEm: timestamp("lida_em", { mode: "date" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
});

export const notificacaoSelectSchema = createSelectSchema(notificacao);
export const notificacaoInsertSchema = createInsertSchema(notificacao);

export type Notificacao = typeof notificacao.$inferSelect;
export type NovaNotificacao = typeof notificacao.$inferInsert;
