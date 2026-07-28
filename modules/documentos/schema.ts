import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { usuario } from "@/modules/auth/schema";
import { cliente } from "@/modules/clientes/schema";

export const tiposDocumento = [
  "contrato_prestacao_servicos",
  "termo_responsabilidade",
  "termo_autorizacao_imagem",
  "orientacao",
  "biorressonancia",
  "outro",
] as const;

export type TipoDocumento = (typeof tiposDocumento)[number];

export const tipoDocumentoEnum = pgEnum("tipo_documento", tiposDocumento);

export const rotulosTipoDocumento: Record<TipoDocumento, string> = {
  contrato_prestacao_servicos: "Contrato de prestação de serviços",
  termo_responsabilidade: "Termo de responsabilidade",
  termo_autorizacao_imagem: "Termo de autorização de imagem",
  orientacao: "Orientação",
  biorressonancia: "Biorressonância",
  outro: "Outro",
};

/**
 * Tipos que **só a profissional** enxerga: material clínico de leitura interna, que não vai para o
 * portal do cliente. O resto da tabela `documento` é feito para ser lido/assinado pelo cliente, então
 * a regra aqui é a exceção — e por isso mora no schema, perto do enum, e é aplicada no WHERE de
 * `listarMeusDocumentos`. Ver docs/context/06-lgpd-seguranca.md.
 */
export const tiposDocumentoSomenteProfissional = [
  "biorressonancia",
] as const satisfies readonly TipoDocumento[];

export function documentoVisivelAoCliente(tipo: TipoDocumento) {
  return !(tiposDocumentoSomenteProfissional as readonly TipoDocumento[]).includes(tipo);
}

export const statusDocumento = ["emitido", "assinado"] as const;

export type StatusDocumento = (typeof statusDocumento)[number];

export const statusDocumentoEnum = pgEnum("status_documento", statusDocumento);

export const rotulosStatusDocumento: Record<StatusDocumento, string> = {
  emitido: "Emitido",
  assinado: "Assinado",
};

export const documento = pgTable("documento", {
  id: uuid("id").defaultRandom().primaryKey(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => cliente.id, { onDelete: "restrict" }),
  tipo: tipoDocumentoEnum("tipo").notNull(),
  titulo: text("titulo").notNull(),
  conteudo: text("conteudo").notNull(),
  status: statusDocumentoEnum("status").notNull().default("emitido"),
  assinadoEm: timestamp("assinado_em", { mode: "date" }),
  /** Traço desenhado na tela (data URL PNG) — "assinatura digital simples na tela" do brief. */
  assinaturaImagemDataUrl: text("assinatura_imagem_data_url"),
  /** IP e user-agent capturados no servidor no momento da assinatura — nunca confiados do cliente. */
  assinaturaIp: text("assinatura_ip"),
  assinaturaUserAgent: text("assinatura_user_agent"),
  /** SHA-256 do `conteudo` no momento da assinatura — evidência de integridade (o que foi assinado). */
  conteudoHash: text("conteudo_hash"),
  /**
   * Arquivo original opcional que acompanha o documento (ex.: o PDF do aparelho de biorressonância,
   * arquivado junto do resumo). Mesma convenção de `modules/fotos`: só a chave do Vercel Blob fica
   * aqui e a app nunca expõe a URL — o binário sai por app/api/documentos/[id]/arquivo, que
   * reautoriza a cada acesso.
   */
  arquivoPathname: text("arquivo_pathname"),
  arquivoNome: text("arquivo_nome"),
  arquivoContentType: text("arquivo_content_type"),
  arquivoTamanhoBytes: integer("arquivo_tamanho_bytes"),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const documentoSelectSchema = createSelectSchema(documento);
export const documentoInsertSchema = createInsertSchema(documento);

export const criarDocumentoSchema = z.object({
  clienteId: z.string().uuid("Selecione um cliente."),
  tipo: z.enum(tiposDocumento, "Selecione o tipo do documento."),
  titulo: z.string().trim().min(3, "Informe o título do documento.").max(200),
  conteudo: z.string().trim().min(10, "Informe o conteúdo do documento.").max(10_000),
});

export type Documento = typeof documento.$inferSelect;
export type NovoDocumento = typeof documento.$inferInsert;
export type CriarDocumentoInput = z.infer<typeof criarDocumentoSchema>;
