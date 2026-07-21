import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { cliente } from "@/modules/clientes/schema";
import { planoPacote } from "@/modules/planos/schema";
import { servico } from "@/modules/servicos/schema";
import { usuario } from "@/modules/auth/schema";

export const situacoesPagamento = ["pendente", "parcial", "pago"] as const;

export type SituacaoPagamento = (typeof situacoesPagamento)[number];

export const situacaoPagamentoEnum = pgEnum("situacao_pagamento", situacoesPagamento);

export const rotulosSituacaoPagamento: Record<SituacaoPagamento, string> = {
  pendente: "Pendente",
  parcial: "Pago parcialmente",
  pago: "Pago",
};

/**
 * **Contrato do cliente** (o nome de domínio é "contrato"; a tabela mantém o nome `pacote` por
 * compatibilidade com `agendamento`/`sessao`/`lancamento_financeiro`, que apontam pra `pacoteId`).
 * É o registro que agrupa as sessões de um cliente: qual serviço, qual pacote (`planoPacoteId`, nulo
 * = sessão avulsa), profissional, pagamento, modalidade. Os agendamentos ligam-se a ele por
 * `pacoteId`; consumir uma sessão = marcar um agendamento como `realizado`.
 */
export const pacote = pgTable("pacote", {
  id: uuid("id").defaultRandom().primaryKey(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => cliente.id, { onDelete: "restrict" }),
  servicoId: uuid("servico_id")
    .notNull()
    .references(() => servico.id, { onDelete: "restrict" }),
  /** Pacote (faixa) escolhido; nulo quando o contrato é de sessão avulsa. */
  planoPacoteId: uuid("plano_pacote_id").references(() => planoPacote.id, { onDelete: "set null" }),
  profissionalId: uuid("profissional_id").references(() => usuario.id, { onDelete: "set null" }),
  quantidadeSessoes: integer("quantidade_sessoes").notNull(),
  dataContratacao: timestamp("data_contratacao", { mode: "date" }).notNull().defaultNow(),
  valorCentavos: integer("valor_centavos"),
  formaPagamento: text("forma_pagamento"),
  situacaoPagamento: situacaoPagamentoEnum("situacao_pagamento").notNull().default("pendente"),
  modalidade: text("modalidade"),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").notNull().default(true),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const pacoteSelectSchema = createSelectSchema(pacote);
export const pacoteInsertSchema = createInsertSchema(pacote);

const textoCurtoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(160).optional(),
);

const observacoesOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(2000).optional(),
);

const idOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().uuid().optional(),
);

const valorSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;

  const normalizado = value.trim().replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? Math.round(numero * 100) : NaN;
}, z.number("Informe um valor válido.").int().nonnegative().optional());

export const criarPacoteSchema = z.object({
  clienteId: z.string().uuid("Selecione um cliente."),
  servicoId: z.string().uuid("Selecione um serviço."),
  planoPacoteId: idOpcional,
  profissionalId: idOpcional,
  quantidadeSessoes: z.coerce
    .number("Informe a quantidade de sessões.")
    .int()
    .min(1, "O contrato precisa de ao menos 1 sessão.")
    .max(100, "Quantidade de sessões acima do esperado."),
  valorCentavos: valorSchema,
  formaPagamento: textoCurtoOpcional,
  situacaoPagamento: z.enum(situacoesPagamento).default("pendente"),
  modalidade: z.enum(["presencial", "domiciliar"]).optional(),
  observacoes: observacoesOpcional,
});

/**
 * Campos escalares do fluxo "novo agendamento" (as datas vêm à parte, via `getAll("dataHora")`).
 * `planoPacoteId` nulo = sessão avulsa; `profissionalId` é obrigatório (cada sessão precisa de uma).
 */
export const agendarContratoSchema = z.object({
  clienteId: z.string().uuid("Selecione um cliente."),
  servicoId: z.string().uuid("Selecione um serviço."),
  planoPacoteId: idOpcional,
  profissionalId: z.string().uuid("Selecione uma profissional."),
  valorCentavos: valorSchema,
  formaPagamento: textoCurtoOpcional,
  situacaoPagamento: z.enum(situacoesPagamento).default("pendente"),
  modalidade: z.enum(["presencial", "domiciliar"]).default("presencial"),
  observacoes: observacoesOpcional,
});

export type Pacote = typeof pacote.$inferSelect;
export type NovoPacote = typeof pacote.$inferInsert;
export type CriarPacoteInput = z.infer<typeof criarPacoteSchema>;
export type AgendarContratoInput = z.infer<typeof agendarContratoSchema>;
