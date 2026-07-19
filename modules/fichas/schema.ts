import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { integer, jsonb, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { z } from "zod";

import { cliente } from "@/modules/clientes/schema";
import { servico } from "@/modules/servicos/schema";
import { usuario } from "@/modules/auth/schema";

/**
 * Catálogo completo do domínio (docs/context/07-fichas.md). Só `estetica_corporal` tem schema de
 * respostas implementado por enquanto — os demais entram um de cada vez, seguindo o mesmo padrão
 * (schema Zod em `respostasPorTipo` + formulário próprio), sem precisar migrar a tabela.
 */
export const tiposFicha = [
  "extensao_cilios",
  "estetica_corporal",
  "ozonioterapia",
  "terapia_capilar",
  "limpeza_pele_masculina",
  "limpeza_pele_feminina",
  "criolipolise",
  "massoterapia",
  "depilacao",
  "plano_tratamento",
  "contrato_prestacao_servicos",
] as const;

export type TipoFicha = (typeof tiposFicha)[number];

export const tipoFichaEnum = pgEnum("tipo_ficha", tiposFicha);

export const rotulosTipoFicha: Record<TipoFicha, string> = {
  extensao_cilios: "Extensão de cílios",
  estetica_corporal: "Estética corporal",
  ozonioterapia: "Ozonioterapia",
  terapia_capilar: "Terapia capilar",
  limpeza_pele_masculina: "Limpeza de pele masculina",
  limpeza_pele_feminina: "Limpeza de pele feminina",
  criolipolise: "Criolipólise",
  massoterapia: "Massoterapia",
  depilacao: "Depilação",
  plano_tratamento: "Plano de tratamento",
  contrato_prestacao_servicos: "Contrato de prestação de serviços",
};

export const statusFicha = ["rascunho", "preenchida", "revisada", "assinada"] as const;

export type StatusFicha = (typeof statusFicha)[number];

export const statusFichaEnum = pgEnum("status_ficha", statusFicha);

export const rotulosStatusFicha: Record<StatusFicha, string> = {
  rascunho: "Rascunho",
  preenchida: "Preenchida",
  revisada: "Revisada",
  assinada: "Assinada",
};

export const ficha = pgTable("ficha", {
  id: uuid("id").defaultRandom().primaryKey(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => cliente.id, { onDelete: "restrict" }),
  servicoId: uuid("servico_id").references(() => servico.id, { onDelete: "set null" }),
  tipo: tipoFichaEnum("tipo").notNull(),
  status: statusFichaEnum("status").notNull().default("preenchida"),
  versao: integer("versao").notNull().default(1),
  /** Aponta para a versão anterior quando uma ficha já assinada é revisada (nunca sobrescrita). */
  versaoAnteriorId: uuid("versao_anterior_id").references((): AnyPgColumn => ficha.id, {
    onDelete: "set null",
  }),
  /** Estrutura validada por `respostasPorTipo[tipo]` — três áreas: relato, avaliacaoProfissional, compartilhado. */
  respostas: jsonb("respostas").notNull(),
  /** "Assinatura" simplificada do MVP: confirmação com carimbo de data/hora (Fase 2 traz e-signature real). */
  aceiteTermosEm: timestamp("aceite_termos_em", { mode: "date" }),
  autorizacaoImagemEm: timestamp("autorizacao_imagem_em", { mode: "date" }),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const fichaSelectSchema = createSelectSchema(ficha);
export const fichaInsertSchema = createInsertSchema(ficha);

const textoOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(2000).optional(),
);

const textoObrigatorio = (mensagem: string) => z.string().trim().min(2, mensagem).max(2000);

const numeroMedidaOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.coerce.number().nonnegative().optional(),
);

/**
 * "Estética corporal" — primeiro tipo implementado, prova do padrão de campos inteligentes:
 * condicionais exigidos por `.superRefine` (o mesmo dado guia a UI via `watch()` do RHF).
 */
export const respostasEsteticaCorporalSchema = z.object({
  relato: z
    .object({
      objetivoTratamento: textoObrigatorio("Descreva o objetivo do tratamento."),
      queixaPrincipal: textoObrigatorio("Descreva a queixa principal."),
      habitos: textoOpcional,
      usaMedicamento: z.boolean(),
      medicamentoDetalhe: textoOpcional,
      realizouCirurgia: z.boolean(),
      cirurgiaDetalhe: textoOpcional,
      gestante: z.boolean(),
      semanasGestacao: numeroMedidaOpcional,
      temAlergia: z.boolean(),
      alergiaDetalhe: textoOpcional,
      aceiteInformacoesVerdadeiras: z
        .boolean()
        .refine(Boolean, "É preciso confirmar que as informações são verdadeiras."),
    })
    .superRefine((relato, ctx) => {
      if (relato.usaMedicamento && !relato.medicamentoDetalhe) {
        ctx.addIssue({
          code: "custom",
          path: ["medicamentoDetalhe"],
          message: "Informe qual medicamento, dose e frequência.",
        });
      }
      if (relato.realizouCirurgia && !relato.cirurgiaDetalhe) {
        ctx.addIssue({
          code: "custom",
          path: ["cirurgiaDetalhe"],
          message: "Informe tipo, data e região da cirurgia.",
        });
      }
      if (relato.gestante && relato.semanasGestacao === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["semanasGestacao"],
          message: "Informe quantas semanas de gestação.",
        });
      }
      if (relato.temAlergia && !relato.alergiaDetalhe) {
        ctx.addIssue({
          code: "custom",
          path: ["alergiaDetalhe"],
          message: "Informe qual substância e qual reação.",
        });
      }
    }),
  avaliacaoProfissional: z
    .object({
      diagnosticoEstetico: textoOpcional,
      procedimentosIndicados: textoOpcional,
      observacoesInternas: textoOpcional,
      contraindicacaoImportante: z.boolean(),
      contraindicacaoDetalhe: textoOpcional,
      medidas: z.object({
        abdomenAcima: numeroMedidaOpcional,
        linhaUmbigo: numeroMedidaOpcional,
        abdomenAbaixo: numeroMedidaOpcional,
        quadril: numeroMedidaOpcional,
        gluteo: numeroMedidaOpcional,
        coxaDireita: numeroMedidaOpcional,
        coxaEsquerda: numeroMedidaOpcional,
        bracoDireito: numeroMedidaOpcional,
        bracoEsquerdo: numeroMedidaOpcional,
      }),
    })
    .superRefine((avaliacao, ctx) => {
      if (avaliacao.contraindicacaoImportante && !avaliacao.contraindicacaoDetalhe) {
        ctx.addIssue({
          code: "custom",
          path: ["contraindicacaoDetalhe"],
          message: "Descreva a contraindicação identificada.",
        });
      }
    }),
  compartilhado: z.object({
    resumoTratamento: textoOpcional,
    orientacoes: textoOpcional,
  }),
});

export type RespostasEsteticaCorporal = z.infer<typeof respostasEsteticaCorporalSchema>;

/** "Extensão de cílios" — segundo tipo do catálogo (docs/context/07-fichas.md), mesmo padrão de
 * três áreas + campos inteligentes via `.superRefine` que `estetica_corporal` estabeleceu. */
export const respostasExtensaoCiliosSchema = z.object({
  relato: z
    .object({
      objetivoProcedimento: textoObrigatorio("Descreva o objetivo do procedimento."),
      jaFezExtensaoCilios: z.boolean(),
      teveReacaoAdesivo: z.boolean(),
      reacaoAdesivoDetalhe: textoOpcional,
      usaLentesContato: z.boolean(),
      temProblemaOcular: z.boolean(),
      problemaOcularDetalhe: textoOpcional,
      temAlergia: z.boolean(),
      alergiaDetalhe: textoOpcional,
      gestanteOuLactante: z.boolean(),
      realizouCirurgiaOcularRecente: z.boolean(),
      cirurgiaOcularDetalhe: textoOpcional,
      aceiteInformacoesVerdadeiras: z
        .boolean()
        .refine(Boolean, "É preciso confirmar que as informações são verdadeiras."),
    })
    .superRefine((relato, ctx) => {
      if (relato.teveReacaoAdesivo && !relato.reacaoAdesivoDetalhe) {
        ctx.addIssue({
          code: "custom",
          path: ["reacaoAdesivoDetalhe"],
          message: "Descreva a reação apresentada.",
        });
      }
      if (relato.temProblemaOcular && !relato.problemaOcularDetalhe) {
        ctx.addIssue({
          code: "custom",
          path: ["problemaOcularDetalhe"],
          message: "Descreva a condição ocular.",
        });
      }
      if (relato.temAlergia && !relato.alergiaDetalhe) {
        ctx.addIssue({
          code: "custom",
          path: ["alergiaDetalhe"],
          message: "Informe qual substância e qual reação.",
        });
      }
      if (relato.realizouCirurgiaOcularRecente && !relato.cirurgiaOcularDetalhe) {
        ctx.addIssue({
          code: "custom",
          path: ["cirurgiaOcularDetalhe"],
          message: "Informe o tipo e a data da cirurgia ocular.",
        });
      }
    }),
  avaliacaoProfissional: z
    .object({
      tecnicaAplicada: textoOpcional,
      curvaturaEspessuraFios: textoOpcional,
      observacoesInternas: textoOpcional,
      contraindicacaoImportante: z.boolean(),
      contraindicacaoDetalhe: textoOpcional,
    })
    .superRefine((avaliacao, ctx) => {
      if (avaliacao.contraindicacaoImportante && !avaliacao.contraindicacaoDetalhe) {
        ctx.addIssue({
          code: "custom",
          path: ["contraindicacaoDetalhe"],
          message: "Descreva a contraindicação identificada.",
        });
      }
    }),
  compartilhado: z.object({
    resumoProcedimento: textoOpcional,
    orientacoes: textoOpcional,
  }),
});

export type RespostasExtensaoCilios = z.infer<typeof respostasExtensaoCiliosSchema>;

/** Mapa tipo → schema de respostas. Novo tipo = nova entrada aqui, sem migração de tabela. */
export const respostasPorTipo = {
  estetica_corporal: respostasEsteticaCorporalSchema,
  extensao_cilios: respostasExtensaoCiliosSchema,
} satisfies Partial<Record<TipoFicha, z.ZodType>>;

export type TipoFichaImplementado = keyof typeof respostasPorTipo;

export function isTipoFichaImplementado(tipo: TipoFicha): tipo is TipoFichaImplementado {
  return tipo in respostasPorTipo;
}

const servicoIdOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().uuid("Selecione um serviço.").optional(),
);

export const criarFichaEsteticaCorporalSchema = z.object({
  clienteId: z.string().uuid("Selecione um cliente."),
  servicoId: servicoIdOpcional,
  autorizacaoImagem: z.boolean(),
  respostas: respostasEsteticaCorporalSchema,
});

export const criarFichaExtensaoCiliosSchema = z.object({
  clienteId: z.string().uuid("Selecione um cliente."),
  servicoId: servicoIdOpcional,
  autorizacaoImagem: z.boolean(),
  respostas: respostasExtensaoCiliosSchema,
});

const fichaIdSchema = z.string().uuid("Ficha inválida.");

export const editarFichaEsteticaCorporalSchema = criarFichaEsteticaCorporalSchema.extend({
  id: fichaIdSchema,
});

export const editarFichaExtensaoCiliosSchema = criarFichaExtensaoCiliosSchema.extend({
  id: fichaIdSchema,
});

export type Ficha = typeof ficha.$inferSelect;
export type NovaFicha = typeof ficha.$inferInsert;
export type CriarFichaEsteticaCorporalInput = z.infer<typeof criarFichaEsteticaCorporalSchema>;
export type CriarFichaExtensaoCiliosInput = z.infer<typeof criarFichaExtensaoCiliosSchema>;
export type EditarFichaEsteticaCorporalInput = z.infer<typeof editarFichaEsteticaCorporalSchema>;
export type EditarFichaExtensaoCiliosInput = z.infer<typeof editarFichaExtensaoCiliosSchema>;
