import { z } from "zod";

/**
 * Núcleo da análise clínica assistida por IA: vocabulário dos três tipos e montagem dos prompts.
 *
 * Fica separado de `actions.ts`/rota para ser função pura e testável — o que o modelo recebe é a
 * parte mais fácil de degradar sem ninguém perceber, e a mais sensível: é dado de saúde saindo pra
 * um terceiro (DeepSeek). Ver `docs/context/06-lgpd-seguranca.md`.
 *
 * Regra que atravessa o módulo: a IA produz **apoio à decisão**, nunca conduta fechada. Toda análise
 * nasce como rascunho e só vale clinicamente depois que a profissional revisa
 * (`revisadoPorId`/`revisadoEm`) — mesmo padrão de "informar ≠ verificar" de `modules/medicamentos`.
 */

export const tiposAnalise = ["exame", "biorressonancia", "recomendacao"] as const;

export type TipoAnalise = (typeof tiposAnalise)[number];

export const rotulosTipoAnalise: Record<TipoAnalise, string> = {
  exame: "Leitura de exames",
  biorressonancia: "Análise de biorressonância",
  recomendacao: "Recomendação terapêutica",
};

export const descricoesTipoAnalise: Record<TipoAnalise, string> = {
  exame: "Importe o PDF do laboratório para a IA organizar os achados.",
  biorressonancia: "Importe o boletim do aparelho para leitura dos itens alterados.",
  recomendacao: "Gera uma proposta de conduta a partir do que já está registrado da cliente.",
};

/** Tipos que nascem de um PDF importado. `recomendacao` parte do que já está no prontuário. */
export const tiposComArquivo = [
  "exame",
  "biorressonancia",
] as const satisfies readonly TipoAnalise[];

export function tipoExigeArquivo(tipo: TipoAnalise) {
  return (tiposComArquivo as readonly TipoAnalise[]).includes(tipo);
}

/**
 * Política enviada ao modelo em TODA análise. É a mesma do assistente flutuante
 * (`modules/assistente/prompt.ts`), repetida aqui de propósito: cada chamada é isolada e não herda
 * o prompt do chat, então a regra tem que viajar junto ou não existe.
 *
 * Não instrui mais sintaxe de markdown (##, -) — a saída é um objeto estruturado (`blocoAnaliseSchema`),
 * então o formato é garantido pelo schema, não pedido em prosa. O que ainda precisa ser dito em
 * prosa é o CONTEÚDO de cada campo.
 */
const POLITICA_CLINICA = `Você é apoio à decisão de uma profissional de saúde — nunca a substitui.
Tudo que escrever é apoio à decisão dela, nunca conduta fechada.
Regras que não se quebram:
- Não feche diagnóstico e não prescreva. Escreva como apoio à conferência dela.
- Não invente valor, unidade, data ou item que não esteja no material fornecido. Se algo não estiver
  legível ou não constar, diga "não consta no material" em vez de estimar.
- Não calcule interação medicamentosa por conta própria. Se notar risco, sinalize como ponto a
  conferir, explicando o porquê.
- Escreva em português do Brasil, direto, sem saudação e sem se apresentar.
- Dentro do texto de um campo, pode usar **negrito** (dois asteriscos) pra destacar um termo, como
  nome de suplemento. Nada de links nem tabelas.
- Em um campo de lista, cada item é UMA ideia só — uma frase curta, no máximo duas. Se a ideia tiver
  mais de uma parte (ex.: "manter X" + "reforçar Y"), separe em dois itens em vez de um item longo.`;

const INSTRUCOES: Record<TipoAnalise, string> = {
  exame: `Leia o exame laboratorial abaixo e monte os campos nesta ordem:

1. Campo título "Resumo", seguido de um campo parágrafo com dois ou três períodos sobre o quadro
   geral que o exame mostra.
2. Campo título "Fora da referência", seguido de um campo lista: para cada item alterado, um item com
   nome, valor encontrado, faixa de referência do próprio laudo e se está acima ou abaixo. Só o que o
   laudo mostra como alterado — não reclassifique por conta própria.
3. Campo título "Dentro da referência, mas de olho", seguido de um campo lista com os itens normais
   que ficaram perto do limite. Se não houver nenhum, um campo parágrafo "Nada a destacar.".
4. Campo título "Pontos para a profissional conferir", seguido de um campo lista com o que merece
   atenção, correlação clínica ou repetição de exame — sempre como pergunta ou sugestão de
   conferência, nunca como conclusão.`,

  biorressonancia: `Leia o boletim de biorressonância abaixo e monte os campos nesta ordem:

1. Campo título "Resumo", seguido de um campo parágrafo com o que o boletim aponta, em dois ou três
   períodos.
2. Campo título "Itens alterados", seguido de um campo lista com cada item que o aparelho marcou como
   alterado, com o grau/valor que o próprio boletim informa, agrupados por sistema do corpo quando o
   boletim permitir.
3. Campo título "Recomendações que o próprio aparelho trouxe", seguido de um campo lista transcrevendo
   o que o boletim sugere, se sugerir. Deixe claro que é do aparelho, não seu.
4. Campo título "Pontos para a profissional conferir", seguido de um campo lista com correlações com
   queixa, histórico ou exames — como sugestão de conferência.

Atenção: biorressonância não é exame laboratorial. Não a trate como diagnóstico nem misture os
achados dela com resultado de laboratório.`,

  recomendacao: `Monte uma recomendação terapêutica a partir do histórico abaixo, com exatamente
estes quatro campos título, nesta ordem:

1. Campo título "Hábitos que ajudam", seguido de um campo lista com hábitos concretos (rotina,
   alimentação, autocuidado) que reforçam o tratamento, cada um ancorado em algo que aparece no
   histórico.
2. Campo título "O que evitar", seguido de um campo lista com hábitos, alimentos ou situações para
   reduzir ou ter cautela, cada um com o motivo.
3. Campo título "O que eliminar", seguido de um campo lista com o que deve ser cortado por completo,
   cada um com o motivo.
4. Campo título "Suplementação", seguido de um campo lista com sugestões de suplemento, cada uma com
   **por que** está sendo sugerida, ancorada em algo do histórico. Sem dose fechada quando o histórico
   não permitir. Antes de sugerir, confira alergias, medicamentos e suplementos já registrados no
   prontuário — se algo puder conflitar, não sugira e explique o motivo em vez de listar a lacuna à
   parte.

Se não houver dado suficiente no histórico pra sustentar um campo inteiro, um item ou parágrafo
"sem dado suficiente no prontuário para esta seção" em vez de inventar.

No fim, um campo parágrafo: "Nada aqui é prescrição: a decisão final e o ajuste de dose são da
profissional."`,
};

export type EntradaPrompt = {
  tipo: TipoAnalise;
  /** Primeiro nome da cliente — o suficiente pro texto ficar natural, sem despejar o cadastro. */
  primeiroNomeCliente: string;
  /** Texto extraído do PDF (exame/biorressonância) ou histórico resumido (recomendação). */
  material: string;
  /** Contexto clínico já registrado: alergias, medicamentos, suplementos, queixas. */
  contextoClinico?: string;
};

export function montarPromptAnalise({
  tipo,
  primeiroNomeCliente,
  material,
  contextoClinico,
}: EntradaPrompt) {
  const partes = [POLITICA_CLINICA, "", INSTRUCOES[tipo], "", `Cliente: ${primeiroNomeCliente}.`];

  if (contextoClinico?.trim()) {
    partes.push("", "Já registrado no prontuário desta cliente:", contextoClinico.trim());
  }

  partes.push(
    "",
    tipoExigeArquivo(tipo) ? "Material enviado:" : "Histórico da cliente:",
    "---",
    material.trim(),
    "---",
  );

  return partes.join("\n");
}

/**
 * Prompt de ajuste: a profissional pede uma mudança no texto que a IA já produziu.
 *
 * Reenvia a POLÍTICA e o MATERIAL de origem de propósito. Sem o material, o modelo cumpriria a
 * instrução inventando o que não lembra ("detalhe a ferritina" sem ter o laudo = número fabricado).
 * Sem a política, a instrução da profissional poderia arrastá-lo pra fechar diagnóstico.
 */
export function montarPromptRefinamento({
  tipo,
  analiseAtual,
  instrucao,
  material,
}: {
  tipo: TipoAnalise;
  analiseAtual: string;
  instrucao: string;
  /** Texto do PDF ou histórico que gerou a análise. Ausente se o registro é antigo. */
  material?: string | null;
}) {
  const partes = [
    POLITICA_CLINICA,
    "",
    `Você já escreveu a análise abaixo (${rotulosTipoAnalise[tipo].toLowerCase()}). A profissional`,
    "pediu um ajuste. Monte os campos da análise INTEIRA já com o ajuste aplicado,",
    "mantendo os mesmos títulos de seção, na mesma ordem.",
  ];

  if (material?.trim()) {
    partes.push(
      "",
      "Material de origem (a única fonte de fato — não vá além dele):",
      "---",
      material.trim(),
      "---",
    );
  } else {
    partes.push(
      "",
      "O material de origem não está mais disponível. Trabalhe apenas com o texto da análise e não",
      "acrescente dado novo que não esteja nele.",
    );
  }

  partes.push(
    "",
    "Análise atual:",
    "---",
    analiseAtual.trim(),
    "---",
    "",
    "Ajuste pedido pela profissional:",
    "---",
    instrucao.trim(),
    "---",
  );

  return partes.join("\n");
}

/** Título sugerido quando a profissional não dá um. */
export function tituloPadrao(tipo: TipoAnalise, nomeArquivo?: string | null) {
  if (nomeArquivo?.trim())
    return nomeArquivo
      .trim()
      .replace(/\.pdf$/i, "")
      .slice(0, 160);

  return rotulosTipoAnalise[tipo];
}

export type StatusRevisao = "rascunho" | "revisada";

export function statusRevisao(revisadoEm: Date | null | undefined): StatusRevisao {
  return revisadoEm ? "revisada" : "rascunho";
}

export const rotulosStatusRevisao: Record<StatusRevisao, string> = {
  rascunho: "Rascunho da IA — não revisado",
  revisada: "Revisada pela profissional",
};

/**
 * O modelo às vezes devolve vazio (estourou o teto de tokens raciocinando — ver
 * `ESFORCO_RACIOCINIO_COM_ANEXO` em `modules/assistente/config.ts`). Guardar análise vazia seria
 * pior que falhar: viraria um registro clínico em branco no prontuário.
 */
export function analiseUtilizavel(texto: string | null | undefined) {
  return Boolean(texto && texto.trim().length >= 40);
}

/**
 * Forma estruturada da saída da IA — cada campo já nasce tipado (`generateObject`, não texto livre
 * reinterpretado depois). É o mesmo vocabulário que o editor manual usa (`ModalEditarAnalise`): a
 * profissional escolhe o tipo de cada campo num menu, exatamente os três tipos que a IA já produz.
 *
 * `itens` de `lista` some do schema se vier vazio — por isso pede mínimo de 1; um campo sem conteúdo
 * não deveria existir, tanto vindo da IA quanto editado à mão.
 */
export const blocoAnaliseSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("titulo").describe("Título curto de uma seção do documento (2 a 6 palavras)."),
    texto: z.string().min(1).max(200),
  }),
  z.object({
    tipo: z.literal("paragrafo").describe("Um parágrafo de texto corrido."),
    texto: z.string().min(1).max(2000),
  }),
  z.object({
    tipo: z
      .literal("lista")
      .describe(
        "Lista de itens curtos — um item por entrada do array. Cada item é UMA ideia só (uma " +
          "frase, no máximo duas curtas). Se tiver mais de uma ideia, vira mais de um item.",
      ),
    itens: z.array(z.string().min(1).max(240)).min(1).max(30),
  }),
]);

export type BlocoAnalise = z.infer<typeof blocoAnaliseSchema>;

export const estruturaAnaliseSchema = z.object({
  blocos: z
    .array(blocoAnaliseSchema)
    .min(1)
    .max(60)
    .describe("Os campos do documento, na ordem em que devem aparecer."),
});

export type EstruturaAnalise = z.infer<typeof estruturaAnaliseSchema>;

/**
 * Serializa os blocos estruturados em markdown simples — é o formato de ARMAZENAMENTO
 * (`analiseIa`), usado tanto pela geração via IA (`generateObject` → aqui) quanto pelo editor manual
 * (campos editados → aqui). Mantém tudo o resto do sistema (exibição no card, PDF, WhatsApp/e-mail,
 * refinamento) trabalhando com o mesmo texto de sempre — só a ORIGEM do texto ficou confiável.
 */
export function blocosParaTexto(blocos: BlocoAnalise[]): string {
  return blocos
    .map((bloco) => {
      if (bloco.tipo === "titulo") {
        const texto = bloco.texto.trim();
        return texto ? `## ${texto}` : "";
      }

      if (bloco.tipo === "lista") {
        const itens = bloco.itens.map((item) => item.trim()).filter(Boolean);
        return itens.length ? itens.map((item) => `- ${item}`).join("\n") : "";
      }

      return bloco.texto.trim();
    })
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Quebra o markdown salvo de volta em blocos tipados — é o que alimenta o editor manual
 * (`ModalEditarAnalise`): cada bloco vira um campo com tipo escolhível. Inverso de `blocosParaTexto`
 * (ida e volta preserva o conteúdo). Cada linha não vazia vira um bloco próprio — mesma convenção de
 * `analisarBlocos` em `modules/assistente/conteudo-resumo.ts` ("cada linha, um bloco"), pelo mesmo
 * motivo: juntar linhas gruda frases que deveriam ficar separadas.
 */
export function dividirEmBlocos(texto: string): BlocoAnalise[] {
  const blocos: BlocoAnalise[] = [];
  let itensAtuais: string[] = [];

  function fecharListaAtual() {
    if (itensAtuais.length) blocos.push({ tipo: "lista", itens: itensAtuais });
    itensAtuais = [];
  }

  for (const linhaBruta of texto.split("\n")) {
    const linha = linhaBruta.trim();
    if (!linha) continue;

    const cabecalho = linha.match(/^#{1,6}\s+(.+)$/);
    const item = linha.match(/^[-*•]\s+(.+)$/);

    if (cabecalho) {
      fecharListaAtual();
      blocos.push({ tipo: "titulo", texto: cabecalho[1].trim() });
    } else if (item) {
      itensAtuais.push(item[1].trim());
    } else {
      fecharListaAtual();
      blocos.push({ tipo: "paragrafo", texto: linha });
    }
  }
  fecharListaAtual();

  return blocos;
}
