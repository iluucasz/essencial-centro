import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod";

import { cliente } from "@/modules/clientes/schema";
import { usuario } from "@/modules/auth/schema";
import { agendamento } from "@/modules/agenda/schema";

export const dedosBiometria = ["polegar", "indicador", "medio"] as const;

export type DedoBiometria = (typeof dedosBiometria)[number];

export const dedoBiometriaEnum = pgEnum("dedo_biometria", dedosBiometria);

export const rotulosDedoBiometria: Record<DedoBiometria, string> = {
  polegar: "Polegar",
  indicador: "Indicador",
  medio: "Médio",
};

export const resultadosTentativaBiometrica = [
  "confirmado",
  "ja_confirmado",
  "rejeitado_far",
  "rejeitado_qualidade",
  "rejeitado_ambiguo",
  "rejeitado_invalido",
  "sem_match",
] as const;

export type ResultadoTentativaBiometrica = (typeof resultadosTentativaBiometrica)[number];

export const resultadoTentativaBiometricaEnum = pgEnum(
  "resultado_tentativa_biometrica",
  resultadosTentativaBiometrica,
);

/**
 * Um cadastro de digital por cliente+dedo. O índice único parcial (só entre ativos) impede o
 * acúmulo de cadastros duplicados que causou parte real dos falsos-positivos num projeto de
 * referência estudado antes de desenhar este módulo — lá chegou a 7 cadastros ativos simultâneos
 * pro mesmo dedo/pessoa, só por não ter essa garantia no banco.
 */
export const biometriaCliente = pgTable(
  "biometria_cliente",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => cliente.id, { onDelete: "restrict" }),
    dedo: dedoBiometriaEnum("dedo").notNull(),
    /** Template extraído pelo SDK do leitor, nunca a imagem crua — mesmo padrão de nunca guardar
     * o bruto já usado em modules/documentos (assinatura) e modules/fotos (Blob). Base64 em
     * `text`, mirando documento.assinaturaImagemDataUrl — sem introduzir bytea/customType. */
    templateBase64: text("template_base64").notNull(),
    templateHash: text("template_hash").notNull(),
    qualidadeCaptura: integer("qualidade_captura").notNull(),
    ativo: boolean("ativo").notNull().default(true),
    atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, {
      onDelete: "set null",
    }),
    criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    ativoUnico: uniqueIndex("biometria_cliente_ativo_unique")
      .on(table.clienteId, table.dedo)
      .where(sql`${table.ativo} = true`),
  }),
);

/**
 * Log append-only de toda tentativa de identificação — sucesso, rejeição ou sem match. Fecha o
 * maior gap encontrado no projeto de referência: lá não existia nenhuma trilha ligando um
 * check-in ao template/FAR/qualidade que o gerou, o que impediu uma investigação forense real de
 * um falso-positivo suspeito. Sem criadoPorId/atualizadoEm — mesma exceção de `notificacao`
 * (modules/notificacoes/schema.ts): quem grava é a ponte autenticada só por segredo, sem sessão
 * de usuário, e o registro nunca é editado depois de criado.
 */
export const tentativaIdentificacaoBiometrica = pgTable("tentativa_identificacao_biometrica", {
  id: uuid("id").defaultRandom().primaryKey(),
  biometriaIdReportada: uuid("biometria_id_reportada").references(() => biometriaCliente.id, {
    onDelete: "set null",
  }),
  clienteId: uuid("cliente_id").references(() => cliente.id, { onDelete: "set null" }),
  agendamentoId: uuid("agendamento_id").references(() => agendamento.id, {
    onDelete: "set null",
  }),
  resultado: resultadoTentativaBiometricaEnum("resultado").notNull(),
  farAtingido: doublePrecision("far_atingido"),
  farSegundoColocado: doublePrecision("far_segundo_colocado"),
  qualidade: integer("qualidade"),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
});

export const biometriaClienteSelectSchema = createSelectSchema(biometriaCliente);
export const biometriaClienteInsertSchema = createInsertSchema(biometriaCliente);
export const tentativaIdentificacaoBiometricaSelectSchema = createSelectSchema(
  tentativaIdentificacaoBiometrica,
);

// Formato de mensagem da ponte — desenhado à mão, não derivado dos schemas de insert: o formato
// de entrada difere do formato da linha no banco, mesma relação de criarAgendamentoSchema vs.
// agendamentoInsertSchema.
export const relatarIdentificacaoSchema = z
  .object({
    biometriaId: z.string().uuid().nullable(),
    farAtingido: z.number().min(0).max(1).nullable(),
    farSegundoColocado: z.number().min(0).max(1).nullable().optional(),
    qualidade: z.number().int().min(0).max(1000),
  })
  .refine(
    (v) => (v.biometriaId === null) === (v.farAtingido === null),
    "farAtingido deve ser nulo se e somente se biometriaId for nulo.",
  );

export const finalizarCadastroSchema = z.object({
  clienteId: z.string().uuid("Cliente inválido."),
  dedo: z.enum(dedosBiometria, "Selecione o dedo."),
  templateBase64: z.string().min(1, "Template vazio."),
  qualidadeCaptura: z.number().int().min(0).max(1000),
});

export type BiometriaCliente = typeof biometriaCliente.$inferSelect;
export type NovaBiometriaCliente = typeof biometriaCliente.$inferInsert;
export type TentativaIdentificacaoBiometrica = typeof tentativaIdentificacaoBiometrica.$inferSelect;
export type RelatarIdentificacaoInput = z.infer<typeof relatarIdentificacaoSchema>;
export type FinalizarCadastroInput = z.infer<typeof finalizarCadastroSchema>;
