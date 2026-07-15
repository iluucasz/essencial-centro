import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { cliente } from "@/modules/clientes/schema";
import { sessao } from "@/modules/sessoes/schema";
import { usuario } from "@/modules/auth/schema";

export const TIPOS_MIME_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"] as const;
export const TAMANHO_MAXIMO_BYTES = 4 * 1024 * 1024; // 4MB — limite de body de Server Action na Vercel é 4.5MB

/**
 * Foto clínica padronizada (mesma posição/enquadramento/iluminação/distância — docs/context/07-fichas.md
 * "Antes e depois"). Dado sensível: só a chave (`pathname`) do Vercel Blob fica salva aqui; a app
 * nunca expõe essa URL no HTML/UI — só via app/api/fotos/[id]/imagem, que reautoriza a cada acesso.
 * ⚠️ O store está em modo público (access:"public"), não privado — ver aviso em
 * docs/context/06-lgpd-seguranca.md antes de usar com dados reais de pacientes.
 */
export const foto = pgTable("foto", {
  id: uuid("id").defaultRandom().primaryKey(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => cliente.id, { onDelete: "restrict" }),
  sessaoId: uuid("sessao_id").references(() => sessao.id, { onDelete: "set null" }),
  regiao: text("regiao").notNull(),
  pathname: text("pathname").notNull(),
  contentType: text("content_type").notNull(),
  tamanhoBytes: integer("tamanho_bytes"),
  dataFoto: timestamp("data_foto", { mode: "date" }).notNull().defaultNow(),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
});

export const fotoSelectSchema = createSelectSchema(foto);
export const fotoInsertSchema = createInsertSchema(foto);

const idOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().uuid().optional(),
);

export const criarFotoSchema = z.object({
  clienteId: z.string().uuid(),
  sessaoId: idOpcional,
  regiao: z.string().trim().min(2, "Informe a região da foto.").max(120),
  arquivo: z
    .instanceof(File, { message: "Selecione uma imagem." })
    .refine((arquivo) => arquivo.size > 0, "Selecione uma imagem.")
    .refine((arquivo) => arquivo.size <= TAMANHO_MAXIMO_BYTES, "A imagem deve ter até 4MB.")
    .refine(
      (arquivo) => (TIPOS_MIME_PERMITIDOS as readonly string[]).includes(arquivo.type),
      "Formato não suportado — use JPEG, PNG ou WebP.",
    ),
});

export type Foto = typeof foto.$inferSelect;
export type NovaFoto = typeof foto.$inferInsert;
export type CriarFotoInput = z.infer<typeof criarFotoSchema>;
