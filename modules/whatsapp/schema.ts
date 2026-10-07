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

import { estadosConexaoWhatsApp } from "./conexao-tipos";

/** PK fixa da linha única de `conexao_whatsapp`. */
export const CHAVE_CONEXAO_WHATSAPP = "clinica";

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
 *
 * `arquivo*`: anexo opcional (imagem, vídeo, PDF ou qualquer outro arquivo) que acompanha a
 * mensagem. Diferente dos anexos clínicos (`modules/controles`/`modules/documentos`, que guardam
 * só o pathname e nunca a URL — servidos por rota autenticada), este é conteúdo de
 * marketing/divulgação, não dado de cliente: o blob fica público de propósito, e `arquivoUrl` é
 * guardado direto (sem custo de um `head()` por leitura) porque é exatamente essa URL que a
 * Evolution API busca na hora de enviar (`modules/notificacoes/whatsapp.ts`) e que a tela usa pra
 * pré-visualizar/baixar.
 */
export const mensagemPredefinida = pgTable("mensagem_predefinida", {
  id: uuid("id").defaultRandom().primaryKey(),
  titulo: text("titulo").notNull(),
  conteudo: text("conteudo").notNull(),
  arquivoPathname: text("arquivo_pathname"),
  arquivoUrl: text("arquivo_url"),
  arquivoNome: text("arquivo_nome"),
  arquivoContentType: text("arquivo_content_type"),
  arquivoTamanhoBytes: integer("arquivo_tamanho_bytes"),
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
  /** Anexo desta campanha — pode ter vindo junto do modelo escolhido ou sido trocado na hora. */
  arquivoPathname: text("arquivo_pathname"),
  arquivoUrl: text("arquivo_url"),
  arquivoNome: text("arquivo_nome"),
  arquivoContentType: text("arquivo_content_type"),
  arquivoTamanhoBytes: integer("arquivo_tamanho_bytes"),
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

/** Teto generoso o bastante pra vídeo curto, mas ainda dentro do que a Evolution/WhatsApp aceitam. */
export const TAMANHO_MAXIMO_ANEXO_WHATSAPP_BYTES = 16 * 1024 * 1024;

/**
 * Sem lista de mimetypes permitidos de propósito — "outros tipos de arquivo" é parte do pedido, e
 * `tipoMidiaWhatsAppPorMimetype` já trata qualquer coisa que não seja imagem/vídeo como documento
 * genérico. O teto de tamanho é a única guarda real.
 */
export const arquivoAnexoWhatsAppSchema = z.preprocess(
  (valor) => (valor instanceof File && valor.size === 0 ? undefined : valor),
  z
    .instanceof(File, { message: "Anexo inválido." })
    .refine(
      (arquivo) => arquivo.size <= TAMANHO_MAXIMO_ANEXO_WHATSAPP_BYTES,
      `O arquivo deve ter até ${TAMANHO_MAXIMO_ANEXO_WHATSAPP_BYTES / 1024 / 1024}MB.`,
    )
    .optional(),
);

const removerArquivoSchema = z.preprocess(
  (valor) => valor === "on" || valor === "true",
  z.boolean(),
);

export const salvarMensagemPredefinidaSchema = z.object({
  id: z.preprocess(
    (valor) => (typeof valor === "string" && valor.trim() !== "" ? valor : undefined),
    z.string().uuid().optional(),
  ),
  titulo: z.string().trim().min(2, "Informe um título.").max(120),
  conteudo: z.string().trim().min(2, "Escreva o conteúdo da mensagem.").max(1000),
  arquivo: arquivoAnexoWhatsAppSchema,
  removerArquivo: removerArquivoSchema,
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
    arquivo: arquivoAnexoWhatsAppSchema,
    removerArquivo: removerArquivoSchema,
  })
  .refine((dados) => dados.destinatarios !== "selecionados" || dados.clienteIds.length > 0, {
    message: "Selecione ao menos um cliente.",
    path: ["clienteIds"],
  });

export type MensagemPredefinida = typeof mensagemPredefinida.$inferSelect;
export type CampanhaMensagem = typeof campanhaMensagem.$inferSelect;
export type SalvarMensagemPredefinidaInput = z.infer<typeof salvarMensagemPredefinidaSchema>;
export type EnviarCampanhaInput = z.infer<typeof enviarCampanhaSchema>;

export const estadoConexaoWhatsAppEnum = pgEnum("estado_conexao_whatsapp", estadosConexaoWhatsApp);

/**
 * Número de WhatsApp conectado pelo painel (instância da Evolution API criada por nós). Linha
 * única — a clínica é uma só, sem multi-tenant — presa pela PK fixa `chave = "clinica"`: o upsert
 * nunca cria uma segunda linha, nem com dois cliques simultâneos em "Conectar". Sem linha = nenhuma
 * instância criada (`not_created`). Colunas em inglês por seguirem o contrato da especificação da
 * integração. Ver `modules/whatsapp/conexao.ts`.
 */
export const conexaoWhatsApp = pgTable("conexao_whatsapp", {
  chave: text("chave").primaryKey().default(CHAVE_CONEXAO_WHATSAPP),
  nomeInstancia: text("instance_name").notNull(),
  instanciaCriadaEm: timestamp("instance_created_at", { mode: "date" }).notNull(),
  estado: estadoConexaoWhatsAppEnum("connection_state").notNull(),
  numeroConectado: text("connected_number"),
  nomeConectado: text("connected_name"),
  verificadoEm: timestamp("connection_checked_at", { mode: "date" }),
});

export type ConexaoWhatsApp = typeof conexaoWhatsApp.$inferSelect;
