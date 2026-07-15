import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { doublePrecision, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { cliente } from "@/modules/clientes/schema";
import { sessao } from "@/modules/sessoes/schema";
import { usuario } from "@/modules/auth/schema";

/** Mesmas regiões usadas em modules/fichas (estética corporal) — docs/context/07-fichas.md. */
export const regioesMedida = [
  "abdomen_acima_umbigo",
  "linha_umbigo",
  "abdomen_abaixo_umbigo",
  "quadril",
  "gluteo",
  "coxa",
  "braco",
] as const;

export type RegiaoMedida = (typeof regioesMedida)[number];

export const regiaoMedidaEnum = pgEnum("regiao_medida", regioesMedida);

export const rotulosRegiaoMedida: Record<RegiaoMedida, string> = {
  abdomen_acima_umbigo: "5cm acima do umbigo",
  linha_umbigo: "Linha do umbigo",
  abdomen_abaixo_umbigo: "5cm abaixo do umbigo",
  quadril: "Quadril",
  gluteo: "Glúteo",
  coxa: "Coxa",
  braco: "Braço",
};

/** Regiões bilaterais exigem lado; as demais (linha média do tronco) não têm lado. */
export const regioesBilaterais = ["coxa", "braco"] as const satisfies readonly RegiaoMedida[];

export const ladosMedida = ["direito", "esquerdo"] as const;

export type LadoMedida = (typeof ladosMedida)[number];

export const ladoMedidaEnum = pgEnum("lado_medida", ladosMedida);

export const rotulosLadoMedida: Record<LadoMedida, string> = {
  direito: "Direito",
  esquerdo: "Esquerdo",
};

export const medida = pgTable("medida", {
  id: uuid("id").defaultRandom().primaryKey(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => cliente.id, { onDelete: "restrict" }),
  sessaoId: uuid("sessao_id").references(() => sessao.id, { onDelete: "set null" }),
  regiao: regiaoMedidaEnum("regiao").notNull(),
  lado: ladoMedidaEnum("lado"),
  valorCm: doublePrecision("valor_cm").notNull(),
  dataMedicao: timestamp("data_medicao", { mode: "date" }).notNull().defaultNow(),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
});

export const medidaSelectSchema = createSelectSchema(medida);
export const medidaInsertSchema = createInsertSchema(medida);

const idOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().uuid().optional(),
);

const ladoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.enum(ladosMedida).optional(),
);

export const criarMedidaSchema = z
  .object({
    clienteId: z.string().uuid(),
    sessaoId: idOpcional,
    regiao: z.enum(regioesMedida, "Selecione a região."),
    lado: ladoOpcional,
    valorCm: z.coerce
      .number("Informe a medida em cm.")
      .positive("A medida deve ser maior que zero.")
      .max(300, "Medida acima do esperado."),
  })
  .superRefine((dados, ctx) => {
    const bilateral = (regioesBilaterais as readonly string[]).includes(dados.regiao);

    if (bilateral && !dados.lado) {
      ctx.addIssue({
        code: "custom",
        path: ["lado"],
        message: "Informe o lado (direito/esquerdo).",
      });
    }
    if (!bilateral && dados.lado) {
      ctx.addIssue({ code: "custom", path: ["lado"], message: "Essa região não tem lado." });
    }
  });

export type Medida = typeof medida.$inferSelect;
export type NovaMedida = typeof medida.$inferInsert;
export type CriarMedidaInput = z.infer<typeof criarMedidaSchema>;
