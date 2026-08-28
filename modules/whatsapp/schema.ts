import { createSelectSchema } from "drizzle-zod";
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
import { cliente } from "@/modules/clientes/schema";

/**
 * Configuração da automação de aniversário. Linha única — a clínica é uma só, sem multi-tenant —
 * então nunca há lookup por ID: `queries.ts`/`actions.ts` sempre pegam a primeira (e única) linha,
 * criando-a na primeira gravação (nada de migration com INSERT de dado, que não editamos à mão).
 */
export const configuracaoAniversario = pgTable("configuracao_aniversario", {
  id: uuid("id").defaultRandom().primaryKey(),
  ativo: boolean("ativo").notNull().default(false),
  /** Texto livre e opcional, ex.: "10% de desconto numa sessão à sua escolha". */
  brinde: text("brinde"),
  /**
   * Último dia (Brasília) em que a checagem automática rodou — não depende só do cron da Vercel
   * (que só dispara em produção deployada). Toda vez que alguém abre o painel, `app/painel/layout.tsx`
   * confere este campo e roda a checagem se ainda não rodou hoje; ver `modules/whatsapp/aniversario-lazy.ts`.
   */
  ultimoDisparoAutomaticoEm: timestamp("ultimo_disparo_automatico_em", { mode: "date" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Registro de envio — um por cliente por ano. Existe só pra idempotência (o cron não manda duas
 * mensagens no mesmo aniversário se rodar mais de uma vez) e pra alimentar o histórico visível na
 * tela; não é reenviado em caso de falha, mesma filosofia de `agendamento.lembreteDiaAnteriorEm`.
 */
export const envioAniversario = pgTable(
  "envio_aniversario",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => cliente.id, { onDelete: "cascade" }),
    ano: integer("ano").notNull(),
    enviadoEm: timestamp("enviado_em", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    clienteAnoUnico: uniqueIndex("envio_aniversario_cliente_ano_unique").on(
      table.clienteId,
      table.ano,
    ),
  }),
);

export const configuracaoAniversarioSelectSchema = createSelectSchema(configuracaoAniversario);

export const atualizarConfiguracaoAniversarioSchema = z.object({
  ativo: z.preprocess((valor) => valor === "on" || valor === "true", z.boolean()),
  brinde: z.preprocess(
    (valor) => (typeof valor !== "string" || valor.trim() === "" ? undefined : valor.trim()),
    z.string().max(500).optional(),
  ),
});

export type ConfiguracaoAniversario = typeof configuracaoAniversario.$inferSelect;
export type EnvioAniversario = typeof envioAniversario.$inferSelect;
export type AtualizarConfiguracaoAniversarioInput = z.infer<
  typeof atualizarConfiguracaoAniversarioSchema
>;

/**
 * Biblioteca de mensagens reaproveitáveis — a profissional monta uma vez ("Promoção do mês",
 * "Lembrete de retorno"...) e usa em várias campanhas depois, sem reescrever toda vez.
 */
export const mensagemPredefinida = pgTable("mensagem_predefinida", {
  id: uuid("id").defaultRandom().primaryKey(),
  titulo: text("titulo").notNull(),
  conteudo: text("conteudo").notNull(),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const destinatariosCampanha = ["todos", "selecionados"] as const;
export type DestinatariosCampanha = (typeof destinatariosCampanha)[number];
export const destinatariosCampanhaEnum = pgEnum("destinatarios_campanha", destinatariosCampanha);

/**
 * Um envio em massa. Guarda o texto BRUTO (com `{nome}` ainda não resolvido) — é o que aparece no
 * histórico; a personalização por cliente acontece só na hora de mandar (ver `mensagens.ts`).
 * `mensagemPredefinidaId` fica nulo quando o texto foi digitado na hora (`set null` na exclusão do
 * modelo: a campanha já disparada não pode perder o registro do que foi enviado).
 */
export const campanhaMensagem = pgTable("campanha_mensagem", {
  id: uuid("id").defaultRandom().primaryKey(),
  conteudo: text("conteudo").notNull(),
  mensagemPredefinidaId: uuid("mensagem_predefinida_id").references(() => mensagemPredefinida.id, {
    onDelete: "set null",
  }),
  destinatarios: destinatariosCampanhaEnum("destinatarios").notNull(),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
});

export const statusEnvioCampanha = ["enviado", "falhou"] as const;
export type StatusEnvioCampanha = (typeof statusEnvioCampanha)[number];
export const statusEnvioCampanhaEnum = pgEnum("status_envio_campanha", statusEnvioCampanha);

/** Um destinatário de uma campanha — a granularidade que alimenta "3 falharam" no histórico. */
export const envioCampanhaMensagem = pgTable("envio_campanha_mensagem", {
  id: uuid("id").defaultRandom().primaryKey(),
  campanhaId: uuid("campanha_id")
    .notNull()
    .references(() => campanhaMensagem.id, { onDelete: "cascade" }),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => cliente.id, { onDelete: "cascade" }),
  status: statusEnvioCampanhaEnum("status").notNull(),
  erro: text("erro"),
  enviadoEm: timestamp("enviado_em", { mode: "date" }).notNull().defaultNow(),
});

export const salvarMensagemPredefinidaSchema = z.object({
  id: z.preprocess(
    (valor) => (typeof valor === "string" && valor.trim() !== "" ? valor : undefined),
    z.string().uuid().optional(),
  ),
  titulo: z.string().trim().min(2, "Informe um título.").max(120),
  conteudo: z.string().trim().min(2, "Escreva o conteúdo da mensagem.").max(1000),
});

const idOpcional = z.preprocess(
  (valor) => (typeof valor === "string" && valor.trim() !== "" ? valor : undefined),
  z.string().uuid().optional(),
);

export const enviarCampanhaSchema = z
  .object({
    conteudo: z.string().trim().min(2, "Escreva a mensagem.").max(1000),
    mensagemPredefinidaId: idOpcional,
    destinatarios: z.enum(destinatariosCampanha),
    clienteIds: z.array(z.string().uuid()).default([]),
  })
  .refine((dados) => dados.destinatarios !== "selecionados" || dados.clienteIds.length > 0, {
    message: "Selecione ao menos um cliente.",
    path: ["clienteIds"],
  });

export type MensagemPredefinida = typeof mensagemPredefinida.$inferSelect;
export type CampanhaMensagem = typeof campanhaMensagem.$inferSelect;
export type SalvarMensagemPredefinidaInput = z.infer<typeof salvarMensagemPredefinidaSchema>;
export type EnviarCampanhaInput = z.infer<typeof enviarCampanhaSchema>;
