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

import { funcoesUsuario, papeisUsuario, type FuncaoUsuario, type PapelUsuario } from "./rbac";

export const papelUsuarioEnum = pgEnum("papel_usuario", papeisUsuario);
export const funcaoUsuarioEnum = pgEnum("funcao_usuario", funcoesUsuario);

export const usuario = pgTable(
  "usuario",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    role: papelUsuarioEnum("role").notNull().default("cliente"),
    /**
     * Permissão dentro de profissional/recepção — admin/manager/reader (`docs/context/06-lgpd-...`
     * não cobre isso ainda). Nula pra `cliente`, que nunca navega em nada que função regule. Ver
     * `modules/auth/rbac.ts` pra semântica de cada valor e `autorizarAdmin`/`autorizarEscrita`.
     */
    funcao: funcaoUsuarioEnum("funcao"),
    /**
     * Cargo/título livre, digitado na hora — "Terapeuta Ortomolecular", "Recepcionista" etc. Puramente
     * descritivo (nunca usado em checagem de permissão, isso é `funcao`). Hoje só reflete no timbre
     * do PDF de recomendação (`modules/analises/pdf-recomendacao.ts`), no lugar do texto fixo antigo.
     */
    cargo: text("cargo"),
    senhaHash: text("senha_hash"),
    clienteId: uuid("cliente_id"),
    /**
     * Senha provisória pendente de troca. Sobe pra `true` quando a conta nasce com senha gerada pela
     * clínica (todo cliente cadastrado ganha acesso ao portal) e volta pra `false` quando a própria
     * pessoa define a dela. Enquanto `true`, painel e portal desviam pra `/definir-senha`: senha que
     * passou pelas mãos de outra pessoa não pode continuar valendo.
     */
    deveTrocarSenha: boolean("deve_trocar_senha").notNull().default(false),
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

/** Mesmo padrão de `clienteId`: campo só existe no HTML quando o papel pede (ver `FormularioUsuario`). */
const funcaoOpcional = z
  .enum(funcoesUsuario)
  .optional()
  .or(z.literal("").transform(() => undefined));

const cargoOpcional = z.preprocess((valor) => {
  if (valor === null) return undefined;
  if (typeof valor === "string" && valor.trim() === "") return undefined;

  return valor;
}, z.string().trim().max(120).optional());

/** `cliente` nunca tem função; `profissional`/`recepção` sempre precisam de uma, e só `profissional`
 * pode ser `admin` — ver `papelExigeFuncao`/`FuncaoUsuario` em `modules/auth/rbac.ts`. */
function validarFuncaoPorPapel<
  T extends { role: PapelUsuario; funcao?: FuncaoUsuario | undefined },
>(schema: z.ZodType<T>) {
  return schema
    .refine((dados) => dados.role === "cliente" || dados.funcao !== undefined, {
      message: "Escolha a função (admin, manager ou reader).",
      path: ["funcao"],
    })
    .refine((dados) => dados.role !== "recepcao" || dados.funcao !== "admin", {
      message: "Recepção não pode ter função admin — só profissional.",
      path: ["funcao"],
    });
}

export const criarUsuarioSchema = validarFuncaoPorPapel(
  credenciaisEntradaSchema.extend({
    nome: z.string().trim().min(2, "Informe o nome do usuário.").max(120),
    role: z.enum(papeisUsuario),
    clienteId: clienteIdVinculoOpcional,
    cargo: cargoOpcional,
    funcao: funcaoOpcional,
  }),
);

/** Sem `senha` de propósito — troca de senha é um fluxo separado, mais sensível, não bundlado
 * na edição de nome/e-mail/papel. */
export const atualizarUsuarioSchema = validarFuncaoPorPapel(
  z.object({
    id: z.string().uuid("Usuário inválido."),
    nome: z.string().trim().min(2, "Informe o nome do usuário.").max(120),
    email: z
      .string()
      .trim()
      .email("Informe um e-mail válido.")
      .transform((value) => value.toLowerCase()),
    role: z.enum(papeisUsuario),
    clienteId: clienteIdVinculoOpcional,
    cargo: cargoOpcional,
    funcao: funcaoOpcional,
  }),
);

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

/**
 * Primeira senha de quem entrou com a provisória. Sem `senhaAtual` de propósito: a pessoa acabou de
 * autenticar com ela e a clínica também a conhece — pedir de novo só protegeria o que já não é
 * segredo. O acesso a este fluxo é restrito pelo `deveTrocarSenha` do próprio usuário logado.
 */
export const definirPrimeiraSenhaSchema = z
  .object({
    novaSenha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(128),
    confirmarNovaSenha: z.string(),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarNovaSenha, {
    message: "A confirmação não é igual à nova senha.",
    path: ["confirmarNovaSenha"],
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
export type DefinirPrimeiraSenhaInput = z.infer<typeof definirPrimeiraSenhaSchema>;
