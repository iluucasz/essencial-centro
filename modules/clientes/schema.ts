import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { date, pgTable, text, timestamp, uuid, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod";

import { usuario } from "@/modules/auth/schema";

const textoCurtoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(160).optional(),
);

const textoLongoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(2000).optional(),
);

const dataNascimentoSchema = z
  .preprocess((value) => {
    if (value instanceof Date) return value;
    if (typeof value === "string" && value) return new Date(`${value}T00:00:00.000`);
    return value;
  }, z.date("Informe a data de nascimento."))
  .refine((value) => value <= new Date(), "A data de nascimento não pode estar no futuro.");

export const cliente = pgTable(
  "cliente",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nome: text("nome").notNull(),
    dataNascimento: date("data_nascimento", { mode: "date" }).notNull(),
    telefone: text("telefone"),
    email: text("email"),
    endereco: text("endereco"),
    contatoEmergenciaNome: text("contato_emergencia_nome"),
    contatoEmergenciaTelefone: text("contato_emergencia_telefone"),
    profissao: text("profissao"),
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

export const clienteSelectSchema = createSelectSchema(cliente);
export const clienteInsertSchema = createInsertSchema(cliente);

export const criarClienteSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do cliente.").max(120),
  dataNascimento: dataNascimentoSchema,
  telefone: textoCurtoOpcional,
  email: textoCurtoOpcional.pipe(z.string().email("Informe um e-mail válido.").optional()),
  endereco: textoLongoOpcional,
  contatoEmergenciaNome: textoCurtoOpcional,
  contatoEmergenciaTelefone: textoCurtoOpcional,
  profissao: textoCurtoOpcional,
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

export type Cliente = typeof cliente.$inferSelect;
export type NovoCliente = typeof cliente.$inferInsert;
export type CriarClienteInput = z.infer<typeof criarClienteSchema>;
