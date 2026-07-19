import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { usuario } from "@/modules/auth/schema";
import { cliente } from "@/modules/clientes/schema";

/**
 * "Medicamentos informados e alertas de segurança" (nome escolhido pelo brief — nunca "combinação
 * de medicamentos"). O sistema NUNCA sugere/calcula interações automaticamente — `alertaInteracao`
 * é preenchido manualmente pela profissional, sempre como apoio à conferência, nunca decisão
 * clínica automática. `verificadoPorId`/`verificadoEm` são uma etapa deliberada e separada da
 * criação: informar ≠ verificar.
 */
export const medicamentoInformado = pgTable("medicamento_informado", {
  id: uuid("id").defaultRandom().primaryKey(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => cliente.id, { onDelete: "restrict" }),
  nome: text("nome").notNull(),
  dosagem: text("dosagem"),
  frequencia: text("frequencia"),
  profissionalPrescritor: text("profissional_prescritor"),
  dataInicio: date("data_inicio", { mode: "date" }),
  alergiaRelacionada: text("alergia_relacionada"),
  alertaInteracao: text("alerta_interacao"),
  fonteAlerta: text("fonte_alerta"),
  verificadoPorId: uuid("verificado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  verificadoEm: timestamp("verificado_em", { mode: "date" }),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const medicamentoInformadoSelectSchema = createSelectSchema(medicamentoInformado);
export const medicamentoInformadoInsertSchema = createInsertSchema(medicamentoInformado);

const textoCurtoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(160).optional(),
);

const textoLongoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(2000).optional(),
);

const dataOpcional = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" && value.trim() !== "") return new Date(`${value}T00:00:00.000`);
  return undefined;
}, z.date().optional());

export const criarMedicamentoInformadoSchema = z.object({
  clienteId: z.string().uuid("Selecione um cliente."),
  nome: z.string().trim().min(2, "Informe o medicamento.").max(200),
  dosagem: textoCurtoOpcional,
  frequencia: textoCurtoOpcional,
  profissionalPrescritor: textoCurtoOpcional,
  dataInicio: dataOpcional,
  alergiaRelacionada: textoLongoOpcional,
  alertaInteracao: textoLongoOpcional,
  fonteAlerta: textoCurtoOpcional,
});

export const editarMedicamentoInformadoSchema = criarMedicamentoInformadoSchema.extend({
  id: z.string().uuid("Medicamento inválido."),
});

export type MedicamentoInformado = typeof medicamentoInformado.$inferSelect;
export type NovoMedicamentoInformado = typeof medicamentoInformado.$inferInsert;
export type CriarMedicamentoInformadoInput = z.infer<typeof criarMedicamentoInformadoSchema>;
export type EditarMedicamentoInformadoInput = z.infer<typeof editarMedicamentoInformadoSchema>;
