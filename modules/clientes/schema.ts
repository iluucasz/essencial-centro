import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  date,
  doublePrecision,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { agoraBrasilia, capitalizarNome } from "@/lib/utils";
import { usuario } from "@/modules/auth/schema";

const textoCurtoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(160).optional(),
);

const textoLongoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(2000).optional(),
);

const numeroOpcional = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const normalizado = value.trim().replace(",", ".");
    return normalizado === "" ? undefined : Number(normalizado);
  }, z.number("Informe um número válido.").positive("Informe um número válido.").max(max).optional());

const dataNascimentoSchema = z
  .preprocess((value) => {
    if (value === null || value === undefined || value === "") return undefined;
    if (value instanceof Date) return value;
    if (typeof value === "string" && value) return new Date(`${value}T00:00:00.000`);
    return value;
  }, z.date("Informe uma data de nascimento válida.").optional())
  .refine(
    (value) => !value || value <= agoraBrasilia(),
    "A data de nascimento não pode estar no futuro.",
  );

export const cliente = pgTable(
  "cliente",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nome: text("nome").notNull(),
    dataNascimento: date("data_nascimento", { mode: "date" }),
    telefone: text("telefone"),
    email: text("email"),
    endereco: text("endereco"),
    contatoEmergenciaNome: text("contato_emergencia_nome"),
    contatoEmergenciaTelefone: text("contato_emergencia_telefone"),
    profissao: text("profissao"),
    /** Classificação operacional interna usada pela equipe em filtros e campanhas. */
    tag: text("tag"),
    peso: doublePrecision("peso"),
    altura: doublePrecision("altura"),
    /** Queixa principal — repete de recomendação em recomendação até a profissional atualizar. */
    queixas: text("queixas"),
    objetivoTratamento: text("objetivo_tratamento"),
    alergias: text("alergias"),
    medicamentos: text("medicamentos"),
    condicoesSaude: text("condicoes_saude"),
    cirurgias: text("cirurgias"),
    contraindicacoes: text("contraindicacoes"),
    consentimentoDados: boolean("consentimento_dados").notNull().default(false),
    consentimentoImagem: boolean("consentimento_imagem").notNull().default(false),
    /** Opt-in separado — biometria nunca é condição de atendimento (ver modules/biometria). */
    consentimentoBiometria: boolean("consentimento_biometria").notNull().default(false),
    consentimentoBiometriaEm: timestamp("consentimento_biometria_em", { mode: "date" }),
    observacoesInternas: text("observacoes_internas"),
    criadoPorId: uuid("criado_por_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "restrict" }),
    atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, {
      onDelete: "set null",
    }),
    criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("cliente_email_unique").on(table.email),
  }),
);

export const statusConviteCadastro = ["pendente", "concluido"] as const;

export const statusConviteCadastroEnum = pgEnum("status_convite_cadastro", statusConviteCadastro);

/**
 * Link de autocadastro enviado por WhatsApp: o próprio cliente preenche o cadastro numa rota pública
 * (`app/cadastro/[token]`). O token é a única autorização — forte, com expiração e de uso único pelo
 * STATUS (`pendente` → `concluido`), mesmo padrão da ficha pública (ver `modules/fichas/token.ts`).
 */
export const conviteCadastroCliente = pgTable("convite_cadastro_cliente", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Número informado pela equipe — destino do link e valor inicial do telefone no formulário. */
  telefone: text("telefone").notNull(),
  token: text("token").notNull().unique(),
  tokenExpiraEm: timestamp("token_expira_em", { mode: "date" }).notNull(),
  status: statusConviteCadastroEnum("status").notNull().default("pendente"),
  clienteId: uuid("cliente_id").references(() => cliente.id, { onDelete: "set null" }),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  concluidoEm: timestamp("concluido_em", { mode: "date" }),
});

export const clienteSelectSchema = createSelectSchema(cliente);
export const clienteInsertSchema = createInsertSchema(cliente);

export const criarClienteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe o nome do cliente.")
    .max(120)
    .refine((valor) => valor.trim().split(/\s+/).length >= 2, "Informe nome e sobrenome.")
    .transform(capitalizarNome),
  dataNascimento: dataNascimentoSchema,
  telefone: textoCurtoOpcional,
  email: textoCurtoOpcional.pipe(z.string().email("Informe um e-mail válido.").optional()),
  endereco: textoLongoOpcional,
  contatoEmergenciaNome: textoCurtoOpcional,
  contatoEmergenciaTelefone: textoCurtoOpcional,
  profissao: textoCurtoOpcional,
  tag: textoCurtoOpcional,
  peso: numeroOpcional(500),
  altura: numeroOpcional(250),
  queixas: textoLongoOpcional,
  objetivoTratamento: textoLongoOpcional,
  alergias: textoLongoOpcional,
  medicamentos: textoLongoOpcional,
  condicoesSaude: textoLongoOpcional,
  cirurgias: textoLongoOpcional,
  contraindicacoes: textoLongoOpcional,
  consentimentoDados: z.boolean().refine(Boolean, "É preciso registrar o consentimento de dados."),
  consentimentoImagem: z.boolean(),
  observacoesInternas: textoLongoOpcional,
});

/**
 * Autocadastro pelo link público: mesmos campos, menos as observações internas (nunca vão ao
 * cliente) e com o consentimento redigido para quem está autorizando.
 */
export const cadastroPublicoClienteSchema = criarClienteSchema
  .omit({ observacoesInternas: true, tag: true })
  .extend({
    consentimentoDados: z
      .boolean()
      .refine(Boolean, "Para concluir, autorize o uso dos seus dados no atendimento."),
  });

export type Cliente = typeof cliente.$inferSelect;
export type NovoCliente = typeof cliente.$inferInsert;
export type CriarClienteInput = z.infer<typeof criarClienteSchema>;
