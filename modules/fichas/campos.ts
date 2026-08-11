import { z } from "zod";

/**
 * Definição de campo de um modelo de ficha (construtor estilo Google Forms). Fica separado de
 * schema.ts (sem depender de Drizzle) para ser puro/testável: valida a definição do campo E, a
 * partir dela, monta o schema Zod que valida as RESPOSTAS — reusado no formulário da profissional,
 * no formulário público e nas Server Actions (nunca confiar só no cliente). Ver docs/context/07-fichas.md.
 */

export const tiposCampo = [
  "secao",
  "paragrafo",
  "texto_curto",
  "texto_longo",
  "numero",
  "data",
  "sim_nao",
  "selecao_unica",
  "selecao_multipla",
  "selecao_imagem",
  "aceite",
] as const;

export type TipoCampo = (typeof tiposCampo)[number];

export const rotulosTipoCampo: Record<TipoCampo, string> = {
  secao: "Título de seção",
  paragrafo: "Texto explicativo",
  texto_curto: "Texto curto",
  texto_longo: "Texto longo",
  numero: "Número",
  data: "Data",
  sim_nao: "Sim / Não",
  selecao_unica: "Seleção única",
  selecao_multipla: "Seleção múltipla",
  selecao_imagem: "Escolha com imagem",
  aceite: "Aceite de termo",
};

/** Campos apenas de layout — não geram resposta. */
const tiposSemResposta: readonly TipoCampo[] = ["secao", "paragrafo"];
/** Campos que exigem uma lista de opções em texto. */
const tiposComOpcoes: readonly TipoCampo[] = ["selecao_unica", "selecao_multipla"];

export function campoEhInput(tipo: TipoCampo) {
  return !tiposSemResposta.includes(tipo);
}

export function campoUsaOpcoes(tipo: TipoCampo) {
  return tiposComOpcoes.includes(tipo);
}

/**
 * Escolha ilustrada: cada opção é uma imagem + rótulo (+ descrição). Existe porque escala clínica
 * ilustrada — a de Bristol é o caso concreto — depende da figura pra pessoa se reconhecer; só o texto
 * ("bolinhas pequenas, separadas e duras") faz o cliente errar a resposta.
 *
 * Usa uma lista própria (`opcoesImagem`) em vez de `opcoes`, porque cada item tem três partes e
 * `opcoes` é `string[]` — enfiar imagem ali exigiria codificar tudo numa string.
 */
export function campoUsaOpcoesImagem(tipo: TipoCampo) {
  return tipo === "selecao_imagem";
}

export const audienciasCampo = ["cliente", "profissional"] as const;
export type AudienciaCampo = (typeof audienciasCampo)[number];

export const rotulosAudienciaCampo: Record<AudienciaCampo, string> = {
  cliente: "Cliente preenche",
  profissional: "Só a profissional",
};

/**
 * Campos que vão para o formulário público (link do WhatsApp) e para a visão do cliente no portal:
 * mantém layout (seção/parágrafo) e campos de audiência "cliente"; oculta os "profissional" (LGPD).
 */
export function camposVisiveisParaCliente(campos: CampoModelo[]): CampoModelo[] {
  return campos.filter((campo) => !campoEhInput(campo.tipo) || campo.quemPreenche === "cliente");
}

/**
 * Uma opção ilustrada. `imagem` é a URL pública do Vercel Blob — e é pública de propósito: o
 * formulário do cliente (`/ficha/[token]`) é aberto SEM login, então a figura precisa carregar sem
 * sessão. Diferente de foto de cliente ou exame, aqui a arte é ativo do MODELO de ficha (ex.: escala
 * de Bristol), não dado de saúde de ninguém.
 */
export const opcaoImagemSchema = z.object({
  rotulo: z.string().trim().min(1, "Dê um nome à opção.").max(120),
  imagem: z.string().trim().url("Envie a imagem da opção."),
  descricao: z.preprocess(
    (valor) => (typeof valor === "string" && valor.trim() === "" ? undefined : valor),
    z.string().trim().max(400).optional(),
  ),
});

export type OpcaoImagem = z.infer<typeof opcaoImagemSchema>;

export const campoModeloSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    tipo: z.enum(tiposCampo),
    rotulo: z.string().trim().min(1, "Dê um título ao campo.").max(300),
    ajuda: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().trim().max(500).optional(),
    ),
    obrigatorio: z.boolean().default(false),
    opcoes: z.array(z.string().trim().min(1).max(200)).max(60).optional(),
    opcoesImagem: z.array(opcaoImagemSchema).max(20).optional(),
    detalheSeSim: z.boolean().optional(),
    quemPreenche: z.enum(audienciasCampo).default("cliente"),
  })
  .superRefine((campo, ctx) => {
    if (campoUsaOpcoes(campo.tipo) && (campo.opcoes?.length ?? 0) < 1) {
      ctx.addIssue({ code: "custom", path: ["opcoes"], message: "Adicione ao menos uma opção." });
    }

    if (campoUsaOpcoesImagem(campo.tipo)) {
      const imagens = campo.opcoesImagem ?? [];

      if (imagens.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["opcoesImagem"],
          message: "Adicione ao menos duas opções para a pessoa escolher.",
        });
      }

      // Rótulo é o que vai gravado na resposta: repetido tornaria a resposta ambígua.
      const rotulos = new Set<string>();
      imagens.forEach((opcao, indice) => {
        if (rotulos.has(opcao.rotulo)) {
          ctx.addIssue({
            code: "custom",
            path: ["opcoesImagem", indice, "rotulo"],
            message: "Rótulo repetido.",
          });
        }
        rotulos.add(opcao.rotulo);
      });
    }
  });

export type CampoModelo = z.infer<typeof campoModeloSchema>;

export const camposModeloSchema = z
  .array(campoModeloSchema)
  .min(1, "Adicione ao menos um campo.")
  .max(200)
  .superRefine((campos, ctx) => {
    const ids = new Set<string>();

    campos.forEach((campo, indice) => {
      if (ids.has(campo.id)) {
        ctx.addIssue({ code: "custom", path: [indice, "id"], message: "Campo duplicado." });
      }
      ids.add(campo.id);
    });

    if (!campos.some((campo) => campoEhInput(campo.tipo))) {
      ctx.addIssue({ code: "custom", path: [], message: "Inclua ao menos um campo de resposta." });
    }
  });

/** Valor inicial de cada campo no formulário (RHF trabalha com strings; a action coage). */
export function valorInicialCampo(campo: CampoModelo): unknown {
  switch (campo.tipo) {
    case "sim_nao":
      return campo.detalheSeSim ? { valor: false, detalhe: "" } : false;
    case "aceite":
      return false;
    case "selecao_multipla":
      return [];
    default:
      return "";
  }
}

export function valoresIniciais(campos: CampoModelo[]): Record<string, unknown> {
  const valores: Record<string, unknown> = {};

  for (const campo of campos) {
    if (campoEhInput(campo.tipo)) valores[campo.id] = valorInicialCampo(campo);
  }

  return valores;
}

const textoRespostaOpcional = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().max(5000).optional(),
);

const numeroRespostaOpcional = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.coerce.number().finite().optional(),
);

function schemaSimNao(campo: CampoModelo): z.ZodTypeAny {
  if (!campo.detalheSeSim) return z.boolean();

  return z
    .object({ valor: z.boolean(), detalhe: textoRespostaOpcional })
    .superRefine((resposta, ctx) => {
      if (campo.obrigatorio && resposta.valor && !resposta.detalhe) {
        ctx.addIssue({ code: "custom", path: ["detalhe"], message: "Informe os detalhes." });
      }
    });
}

/** Schema Zod de UM campo, respeitando tipo e obrigatoriedade. */
function schemaDoCampo(campo: CampoModelo): z.ZodTypeAny {
  const exigido = campo.obrigatorio;

  switch (campo.tipo) {
    case "texto_curto":
    case "texto_longo":
    case "data":
      return exigido
        ? z.string().trim().min(1, "Campo obrigatório.").max(5000)
        : textoRespostaOpcional;
    case "numero":
      return exigido
        ? z.preprocess(
            (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
            z.coerce.number({ error: "Informe um número." }).finite(),
          )
        : numeroRespostaOpcional;
    case "sim_nao":
      return schemaSimNao(campo);
    case "aceite":
      return z.boolean().refine((v) => !exigido || v === true, "É preciso aceitar para continuar.");
    case "selecao_unica": {
      const opcoes = campo.opcoes ?? [];
      const base = z.string().refine((v) => v === "" || opcoes.includes(v), "Opção inválida.");

      return exigido ? base.refine((v) => v !== "", "Selecione uma opção.") : base;
    }
    case "selecao_imagem": {
      // Grava o RÓTULO, não a URL: o texto continua legível se a imagem for trocada depois.
      const rotulos = (campo.opcoesImagem ?? []).map((opcao) => opcao.rotulo);
      const base = z.string().refine((v) => v === "" || rotulos.includes(v), "Opção inválida.");

      return exigido ? base.refine((v) => v !== "", "Selecione uma opção.") : base;
    }
    case "selecao_multipla": {
      const opcoes = campo.opcoes ?? [];
      const base = z
        .array(z.string())
        .refine((vs) => vs.every((v) => opcoes.includes(v)), "Opção inválida.");

      return exigido ? base.min(1, "Selecione ao menos uma opção.") : base;
    }
    default:
      return z.unknown();
  }
}

/** Monta o schema das RESPOSTAS a partir dos campos de input do modelo. */
export function schemaRespostasModelo(campos: CampoModelo[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const campo of campos) {
    if (campoEhInput(campo.tipo)) shape[campo.id] = schemaDoCampo(campo);
  }

  return z.object(shape);
}

export type ResultadoValidacaoRespostas =
  | { ok: true; dados: Record<string, unknown> }
  | { ok: false; erros: Record<string, string[] | undefined> };

/** Revalida no servidor as respostas contra a definição do modelo. */
export function validarRespostasModelo(
  campos: CampoModelo[],
  respostas: unknown,
): ResultadoValidacaoRespostas {
  const parsed = schemaRespostasModelo(campos).safeParse(respostas ?? {});

  if (parsed.success) return { ok: true, dados: parsed.data };

  return { ok: false, erros: parsed.error.flatten().fieldErrors };
}
