import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { usuario } from "@/modules/auth/schema";
import { cliente } from "@/modules/clientes/schema";

export const tiposDocumento = [
  "contrato_prestacao_servicos",
  "termo_responsabilidade",
  "termo_autorizacao_imagem",
  "orientacao",
  "outro",
] as const;

export type TipoDocumento = (typeof tiposDocumento)[number];

export const tipoDocumentoEnum = pgEnum("tipo_documento", tiposDocumento);

export const rotulosTipoDocumento: Record<TipoDocumento, string> = {
  contrato_prestacao_servicos: "Contrato de prestação de serviços",
  termo_responsabilidade: "Termo de responsabilidade",
  termo_autorizacao_imagem: "Termo de autorização de imagem",
  orientacao: "Orientação",
  outro: "Outro",
};

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
  /** "Assinatura" simplificada do MVP: confirmação com carimbo de data/hora (Fase 2 traz e-signature real). */
  assinadoEm: timestamp("assinado_em", { mode: "date" }),
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
