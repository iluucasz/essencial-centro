import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { usuario } from "@/modules/auth/schema";
import { cliente } from "@/modules/clientes/schema";

import { tiposAnalise } from "./analise";

/** Uma rodada de ajuste pedida pela profissional. */
export type RefinamentoRegistrado = { instrucao: string; em: string };

/**
 * Análise clínica assistida por IA: leitura de exame, leitura de biorressonância e proposta de
 * conduta terapêutica.
 *
 * Duas colunas existem por razão de auditoria clínica, não de produto:
 *
 * - `analiseIa` guarda o texto do modelo **como veio**, e `observacaoProfissional` é onde a
 *   profissional corrige/complementa. Não sobrescrevemos a saída da IA com a edição dela — daqui a
 *   um ano é preciso saber o que a máquina disse e o que a pessoa concluiu.
 * - `modeloIa` grava qual modelo produziu. A Groq deprecia modelo com pouco aviso
 *   (`modules/assistente/config.ts`), e sem isso um registro antigo fica sem procedência.
 *
 * `revisadoPorId`/`revisadoEm` são etapa deliberada e separada da criação: análise não revisada é
 * rascunho, nunca conduta. Mesmo padrão de "informar ≠ verificar" de `modules/medicamentos`.
 *
 * Acesso restrito a `profissional` — é raciocínio clínico interno e nunca aparece no portal.
 */
export const tipoAnaliseEnum = pgEnum("tipo_analise", tiposAnalise);

export const analiseClinica = pgTable("analise_clinica", {
  id: uuid("id").defaultRandom().primaryKey(),
  clienteId: uuid("cliente_id")
    .notNull()
    .references(() => cliente.id, { onDelete: "cascade" }),
  tipo: tipoAnaliseEnum("tipo").notNull(),
  titulo: text("titulo").notNull(),

  /** Arquivo de origem no Vercel Blob. Nulo em `recomendacao`, que parte do prontuário. */
  arquivoPathname: text("arquivo_pathname"),
  arquivoNome: text("arquivo_nome"),
  arquivoContentType: text("arquivo_content_type"),
  arquivoTamanhoBytes: integer("arquivo_tamanho_bytes"),
  /** Texto extraído do PDF — permite reanalisar sem reenviar o arquivo. */
  textoExtraido: text("texto_extraido"),

  analiseIa: text("analise_ia").notNull(),
  /**
   * O texto que a IA produziu na PRIMEIRA vez. Preenchido só quando a profissional pede um ajuste —
   * `analiseIa` passa a ser a versão vigente e esta guarda de onde se partiu. Sem isso, refinar
   * apagaria o que a máquina tinha dito originalmente, e num prontuário isso não se recupera.
   */
  analiseIaOriginal: text("analise_ia_original"),
  /** Instruções de ajuste, em ordem: `[{ instrucao, em }]`. É o rastro de como o texto evoluiu. */
  refinamentos: jsonb("refinamentos").$type<RefinamentoRegistrado[]>().notNull().default([]),
  modeloIa: text("modelo_ia").notNull(),
  observacaoProfissional: text("observacao_profissional"),

  revisadoPorId: uuid("revisado_por_id").references(() => usuario.id, { onDelete: "set null" }),
  revisadoEm: timestamp("revisado_em", { mode: "date" }),

  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { mode: "date" }).notNull().defaultNow(),
});

export const analiseClinicaSelectSchema = createSelectSchema(analiseClinica);
export const analiseClinicaInsertSchema = createInsertSchema(analiseClinica);

export type AnaliseClinica = z.infer<typeof analiseClinicaSelectSchema>;

/**
 * Campo de texto que pode não vir. Trata `null` **e** `""` como ausente porque `FormData.get()`
 * devolve `null` para campo não enviado e `""` para campo vazio — e `.optional()` do Zod aceita só
 * `undefined`. Sem isso, omitir o título derrubava a rota com 400 antes de ler o PDF.
 */
function textoOpcional(limite: number) {
  return z.preprocess((valor) => {
    if (valor === null) return undefined;
    if (typeof valor === "string" && valor.trim() === "") return undefined;

    return valor;
  }, z.string().trim().max(limite).optional());
}

/** Entrada da rota que gera a análise. O arquivo é validado à parte, por `validarArquivoPdf`. */
export const gerarAnaliseSchema = z.object({
  clienteId: z.string().uuid("Cliente inválido."),
  tipo: z.enum(tiposAnalise),
  titulo: textoOpcional(160),
});

export const salvarObservacaoAnaliseSchema = z.object({
  id: z.string().uuid("Análise inválida."),
  clienteId: z.string().uuid("Cliente inválido."),
  observacaoProfissional: textoOpcional(5000),
});

/**
 * Instrução de ajuste. Mínimo de 3 caracteres pra não gastar uma chamada de IA com "ok" — e teto
 * porque instrução gigante compete com o texto da análise pelo orçamento de tokens.
 */
export const refinarAnaliseSchema = z.object({
  clienteId: z.string().uuid("Cliente inválido."),
  instrucao: z
    .string()
    .trim()
    .min(3, "Escreva o que você quer ajustar.")
    .max(1000, "Deixe a instrução mais curta."),
});

export const revisarAnaliseSchema = z.object({
  id: z.string().uuid("Análise inválida."),
  clienteId: z.string().uuid("Cliente inválido."),
});

export const excluirAnaliseSchema = z.object({
  id: z.string().uuid("Análise inválida."),
  clienteId: z.string().uuid("Cliente inválido."),
  confirmarExclusao: z.literal("true", {
    error: "Confirme que entende que a exclusão não pode ser desfeita.",
  }),
});
