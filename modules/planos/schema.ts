import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { usuario } from "@/modules/auth/schema";
import { servico } from "@/modules/servicos/schema";

/**
 * "Pacote" no vocabulário da clínica: a **faixa de pacote de um serviço** (5 sessões = R$X, 10 = R$Y).
 * É um template ligado ao serviço, sem cliente. O registro do cliente que consome um destes é o
 * `contrato` (ver modules/pacotes — por ora a tabela `pacote` cumpre esse papel). Serviço só-avulso
 * = nenhum `plano_pacote`.
 */
export const planoPacote = pgTable("plano_pacote", {
  id: uuid("id").defaultRandom().primaryKey(),
  servicoId: uuid("servico_id")
    .notNull()
    .references(() => servico.id, { onDelete: "cascade" }),
  nome: text("nome"),
  quantidadeSessoes: integer("quantidade_sessoes").notNull(),
  valorCentavos: integer("valor_centavos").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const planoPacoteSelectSchema = createSelectSchema(planoPacote);
export const planoPacoteInsertSchema = createInsertSchema(planoPacote);

const nomeOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(120).optional(),
);

const valorSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;

  const normalizado = value.trim().replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? Math.round(numero * 100) : NaN;
}, z.number("Informe um valor válido.").int().positive("O valor deve ser maior que zero."));

export const criarPlanoSchema = z.object({
  servicoId: z.string().uuid("Serviço inválido."),
  nome: nomeOpcional,
  quantidadeSessoes: z.coerce
    .number("Informe a quantidade de sessões.")
    .int()
    .min(1, "O pacote precisa de ao menos 1 sessão.")
    .max(100, "Quantidade de sessões acima do esperado."),
  valorCentavos: valorSchema,
});

export type PlanoPacote = typeof planoPacote.$inferSelect;
export type NovoPlanoPacote = typeof planoPacote.$inferInsert;
export type CriarPlanoInput = z.infer<typeof criarPlanoSchema>;
