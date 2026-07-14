import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { usuario } from "@/modules/auth/schema";

export const gruposServico = [
  "massoterapia",
  "estetica_corporal",
  "estetica_facial",
  "saude_integrativa",
  "pre_pos_operatorio",
] as const;

export type GrupoServico = (typeof gruposServico)[number];

export const grupoServicoEnum = pgEnum("grupo_servico", gruposServico);

export const rotulosGrupoServico: Record<GrupoServico, string> = {
  massoterapia: "Massoterapia e terapias",
  estetica_corporal: "Estética corporal",
  estetica_facial: "Estética facial",
  saude_integrativa: "Saúde integrativa e bem-estar",
  pre_pos_operatorio: "Pré e pós-operatório",
};

const textoLongoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(2000).optional(),
);

const valorSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;

  const normalizado = value.trim().replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? Math.round(numero * 100) : NaN;
}, z.number("Informe um valor válido.").int().nonnegative().optional());

export const servico = pgTable("servico", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  grupo: grupoServicoEnum("grupo").notNull(),
  descricao: text("descricao"),
  indicacao: text("indicacao"),
  contraindicacoes: text("contraindicacoes"),
  duracaoMinutos: integer("duracao_minutos").notNull(),
  periodicidade: text("periodicidade"),
  valorCentavos: integer("valor_centavos"),
  preparo: text("preparo"),
  cuidadosPosteriores: text("cuidados_posteriores"),
  ativo: boolean("ativo").notNull().default(true),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const servicoSelectSchema = createSelectSchema(servico);
export const servicoInsertSchema = createInsertSchema(servico);

export const criarServicoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do serviço.").max(120),
  grupo: z.enum(gruposServico, "Selecione um grupo válido."),
  descricao: textoLongoOpcional,
  indicacao: textoLongoOpcional,
  contraindicacoes: textoLongoOpcional,
  duracaoMinutos: z.coerce
    .number("Informe a duração em minutos.")
    .int()
    .min(5, "A duração mínima é de 5 minutos.")
    .max(480, "A duração máxima é de 8 horas."),
  periodicidade: textoLongoOpcional,
  valorCentavos: valorSchema,
  preparo: textoLongoOpcional,
  cuidadosPosteriores: textoLongoOpcional,
});

export type Servico = typeof servico.$inferSelect;
export type NovoServico = typeof servico.$inferInsert;
export type CriarServicoInput = z.infer<typeof criarServicoSchema>;
