import { createSelectSchema } from "drizzle-zod";
import { date, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

import { usuario } from "@/modules/auth/schema";

/**
 * Manutenções/checagens periódicas do estabelecimento — não é dado clínico, é rotina operacional
 * (compliance/manutenção predial). Cada linha é um "aconteceu isso, nesta data", com anexo
 * opcional (foto do certificado, nota fiscal do serviço etc.) pra guardar comprovação.
 */
export const tiposControle = [
  "calibracao_equipamentos",
  "limpeza_caixa_dagua",
  "dedetizacao",
  "coleta_materiais",
] as const;

export type TipoControle = (typeof tiposControle)[number];

export const tipoControleEnum = pgEnum("tipo_controle", tiposControle);

export const rotulosTipoControle: Record<TipoControle, string> = {
  calibracao_equipamentos: "Calibração de equipamentos",
  limpeza_caixa_dagua: "Limpeza de caixa d'água",
  dedetizacao: "Dedetização",
  coleta_materiais: "Coleta de materiais",
};

export const registroControle = pgTable("registro_controle", {
  id: uuid("id").defaultRandom().primaryKey(),
  tipo: tipoControleEnum("tipo").notNull(),
  dataRealizacao: date("data_realizacao", { mode: "date" }).notNull(),
  /**
   * Anexo opcional (comprovante/foto do serviço). Mesma convenção de `modules/fotos`,
   * `modules/documentos` e `modules/analises`: só a chave do Vercel Blob fica aqui, o binário
   * nunca é exposto direto — sai por app/api/controles/[id]/arquivo, que reautoriza a cada acesso.
   */
  arquivoPathname: text("arquivo_pathname"),
  arquivoNome: text("arquivo_nome"),
  arquivoContentType: text("arquivo_content_type"),
  arquivoTamanhoBytes: integer("arquivo_tamanho_bytes"),
  criadoPorId: uuid("criado_por_id")
    .notNull()
    .references(() => usuario.id, { onDelete: "restrict" }),
  criadoEm: timestamp("criado_em", { mode: "date" }).notNull().defaultNow(),
});

export const registroControleSelectSchema = createSelectSchema(registroControle);

const TAMANHO_MAXIMO_ANEXO_BYTES = 8 * 1024 * 1024;
const TIPOS_MIME_ANEXO_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * `<input type="file">` sem seleção manda um File vazio (nome "", tamanho 0) via FormData, não
 * `null` — sem tratar isso, "não anexei nada" cairia na validação de tipo/tamanho como se fosse
 * um arquivo real. Mesma classe de problema do FormData-null já mapeada em outros módulos.
 */
const arquivoOpcionalSchema = z.preprocess(
  (valor) => (valor instanceof File && valor.size === 0 ? undefined : valor),
  z
    .instanceof(File, { message: "Anexo inválido." })
    .refine(
      (arquivo) => arquivo.size <= TAMANHO_MAXIMO_ANEXO_BYTES,
      `O arquivo deve ter até ${TAMANHO_MAXIMO_ANEXO_BYTES / 1024 / 1024}MB.`,
    )
    .refine(
      (arquivo) => TIPOS_MIME_ANEXO_PERMITIDOS.includes(arquivo.type),
      "Formato não suportado — use JPEG, PNG, WebP ou PDF.",
    )
    .optional(),
);

const dataRealizacaoSchema = z.preprocess((valor) => {
  if (valor instanceof Date) return valor;
  if (typeof valor === "string" && valor.trim() !== "") return new Date(`${valor}T00:00:00.000`);
  return undefined;
}, z.date("Informe a data em que o serviço foi feito."));

export const registrarControleSchema = z.object({
  tipo: z.enum(tiposControle, "Selecione o tipo de controle."),
  dataRealizacao: dataRealizacaoSchema,
  arquivo: arquivoOpcionalSchema,
});

export type RegistroControle = typeof registroControle.$inferSelect;
export type NovoRegistroControle = typeof registroControle.$inferInsert;
export type RegistrarControleInput = z.infer<typeof registrarControleSchema>;
