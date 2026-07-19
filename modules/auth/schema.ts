import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { AdapterAccountType } from "next-auth/adapters";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { papeisUsuario } from "./rbac";

export const papelUsuarioEnum = pgEnum("papel_usuario", papeisUsuario);

export const usuario = pgTable(
  "usuario",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    role: papelUsuarioEnum("role").notNull().default("cliente"),
    senhaHash: text("senha_hash"),
    clienteId: uuid("cliente_id"),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("usuario_email_unique").on(table.email),
  }),
);

export const conta = pgTable(
  "conta",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  }),
);

export const sessaoAuth = pgTable("sessao_auth", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const tokenVerificacao = pgTable(
  "token_verificacao",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.identifier, table.token],
    }),
  }),
);

export const autenticador = pgTable(
  "autenticador",
  {
    credentialID: text("credential_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "cascade" }),
    providerAccountId: text("provider_account_id").notNull(),
    credentialPublicKey: text("credential_public_key").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credential_device_type").notNull(),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: text("transports"),
  },
  (table) => ({
    credentialUnique: uniqueIndex("autenticador_credential_id_unique").on(table.credentialID),
    pk: primaryKey({
      columns: [table.userId, table.credentialID],
    }),
  }),
);

export const usuarioSelectSchema = createSelectSchema(usuario);
export const usuarioInsertSchema = createInsertSchema(usuario);

export const credenciaisEntradaSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .transform((value) => value.toLowerCase()),
  senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(128),
});

const clienteIdVinculoOpcional = z
  .string()
  .uuid("Cliente inválido.")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const criarUsuarioSchema = credenciaisEntradaSchema.extend({
  nome: z.string().trim().min(2, "Informe o nome do usuário.").max(120),
  role: z.enum(papeisUsuario),
  clienteId: clienteIdVinculoOpcional,
});

/** Sem `senha` de propósito — troca de senha é um fluxo separado, mais sensível, não bundlado
 * na edição de nome/e-mail/papel. */
export const atualizarUsuarioSchema = z.object({
  id: z.string().uuid("Usuário inválido."),
  nome: z.string().trim().min(2, "Informe o nome do usuário.").max(120),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .transform((value) => value.toLowerCase()),
  role: z.enum(papeisUsuario),
  clienteId: clienteIdVinculoOpcional,
});

/** Autoatendimento — a própria pessoa editando nome/e-mail do que ela vê no cabeçalho do
 * painel. Sem `role`/`clienteId`: isso continua exclusivo da tela "Usuários" (admin). */
export const atualizarMeuPerfilSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .transform((value) => value.toLowerCase()),
});

/** Fluxo separado de `atualizarUsuario`/`atualizarMeuPerfil` de propósito — exige a senha atual
 * (a pessoa já autenticada ainda precisa provar que é ela mesma pra trocar a credencial). */
export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe sua senha atual."),
    novaSenha: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres.").max(128),
    confirmarNovaSenha: z.string(),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarNovaSenha, {
    message: "A confirmação não é igual à nova senha.",
    path: ["confirmarNovaSenha"],
  });

export type Usuario = typeof usuario.$inferSelect;
export type NovoUsuario = typeof usuario.$inferInsert;
export type CredenciaisEntrada = z.infer<typeof credenciaisEntradaSchema>;
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;
export type AtualizarMeuPerfilInput = z.infer<typeof atualizarMeuPerfilSchema>;
export type AlterarSenhaInput = z.infer<typeof alterarSenhaSchema>;
