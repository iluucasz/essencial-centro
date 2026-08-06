import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { cliente } from "@/modules/clientes/schema";
import { usuario } from "@/modules/auth/schema";

import {
  INTENSIDADE_MAXIMA,
  INTENSIDADE_MINIMA,
  ladosDor,
  regioesDor,
  regiaoEhBilateral,
  type RegiaoDor,
} from "./regioes";

/**
 * Mapa de dor: onde o cliente sente dor, de 0 a 10, marcado no modelo 3D do corpo.
 *
 * A região é NOMEADA (`modules/dor/regioes.ts` converte o clique na malha), não coordenada solta —
 * é o que permite comparar sessões, somar em relatório e cruzar com `sessao.escalaDorAntes/Depois`.
 * As coordenadas normalizadas ficam guardadas só para redesenhar o marcador exatamente onde a
 * pessoa tocou; nenhuma consulta clínica depende delas.
 */
export const regiaoDorEnum = pgEnum("regiao_dor", regioesDor);
export const ladoDorEnum = pgEnum("lado_dor", ladosDor);

/**
 * Quem marcou. O cliente registra dor entre sessões pelo portal, e a profissional precisa saber a
 * procedência antes de tratar o dado como avaliação clínica — relato do cliente não é exame.
 */
export const origensRegistroDor = ["profissional", "cliente"] as const;

export type OrigemRegistroDor = (typeof origensRegistroDor)[number];

export const origemRegistroDorEnum = pgEnum("origem_registro_dor", origensRegistroDor);

export const rotulosOrigemRegistroDor: Record<OrigemRegistroDor, string> = {
  profissional: "Registrado no atendimento",
  cliente: "Relatado pelo cliente",
};

export const registroDor = pgTable("registro_dor", {
  id: uuid("id").defaultRandom().primaryKey(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => cliente.id, { onDelete: "cascade" }),
  regiao: regiaoDorEnum("regiao").notNull(),
  lado: ladoDorEnum("lado"),
  intensidade: integer("intensidade").notNull(),
  /** Face do corpo em que o ponto foi marcado — anterior (peito/abdômen) ou posterior. */
  anterior: boolean("anterior").notNull(),
  /** Coordenadas normalizadas do clique (0..1 na altura, −1..1 na largura) — só para redesenhar. */
  alturaNormalizada: doublePrecision("altura_normalizada").notNull(),
  xNormalizado: doublePrecision("x_normalizado").notNull(),
  observacao: text("observacao"),
  origem: origemRegistroDorEnum("origem").notNull(),
  registradoEm: timestamp("registrado_em", { mode: "date" }).notNull().defaultNow(),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
});

export const registroDorSelectSchema = createSelectSchema(registroDor);
export const registroDorInsertSchema = createInsertSchema(registroDor);

export type RegistroDor = z.infer<typeof registroDorSelectSchema>;

const intensidadeSchema = z.coerce
  .number({ error: "Informe a intensidade da dor." })
  .int("A intensidade é um número inteiro de 0 a 10.")
  .min(INTENSIDADE_MINIMA, "A intensidade vai de 0 a 10.")
  .max(INTENSIDADE_MAXIMA, "A intensidade vai de 0 a 10.");

const observacaoSchema = z.preprocess(
  (valor) => (typeof valor === "string" && valor.trim() === "" ? undefined : valor),
  z.string().trim().max(1000).optional(),
);

/**
 * Entrada de um novo ponto de dor. `clienteId` e `origem` NÃO entram aqui de propósito: a action
 * deriva os dois da sessão (docs/context/06-lgpd-seguranca.md) — o cliente não escolhe de quem é o
 * registro nem se passa por profissional.
 */
export const registrarDorSchema = z
  .object({
    regiao: z.enum(regioesDor),
    // Campo vazio do formulário chega como "" — em região de linha média (lombar, peito…) é
    // exatamente esse o caso, e `z.enum().nullish()` sozinho rejeitaria com "Revise o ponto de dor".
    lado: z.preprocess(
      (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
      z.enum(ladosDor).nullish(),
    ),
    intensidade: intensidadeSchema,
    anterior: z.coerce.boolean(),
    alturaNormalizada: z.coerce.number().min(0).max(1),
    xNormalizado: z.coerce.number().min(-1).max(1),
    observacao: observacaoSchema,
  })
  .transform((entrada) => ({
    ...entrada,
    // Lado só faz sentido em região bilateral: normaliza aqui pra não gravar "lombar direita".
    lado: regiaoEhBilateral(entrada.regiao as RegiaoDor) ? (entrada.lado ?? null) : null,
  }));

export type RegistrarDorInput = z.infer<typeof registrarDorSchema>;
