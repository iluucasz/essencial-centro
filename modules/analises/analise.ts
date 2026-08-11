/**
 * Núcleo da análise clínica assistida por IA: vocabulário dos três tipos e montagem dos prompts.
 *
 * Fica separado de `actions.ts`/rota para ser função pura e testável — o que o modelo recebe é a
 * parte mais fácil de degradar sem ninguém perceber, e a mais sensível: é dado de saúde saindo pra
 * um terceiro (Groq). Ver `docs/context/06-lgpd-seguranca.md`.
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
- Use markdown simples: títulos com ##, listas com - e **negrito**. Nada de tabelas gigantes.`;

const INSTRUCOES: Record<TipoAnalise, string> = {
  exame: `Leia o exame laboratorial abaixo e organize assim:

## Resumo
Dois ou três períodos sobre o quadro geral que o exame mostra.

## Fora da referência
Para cada item alterado: nome, valor encontrado, faixa de referência do próprio laudo e se está
acima ou abaixo. Só o que o laudo mostra como alterado — não reclassifique por conta própria.

## Dentro da referência, mas de olho
Itens normais que ficaram perto do limite, se houver. Se não houver, escreva "nada a destacar".

## Pontos para a profissional conferir
O que merece atenção, correlação clínica ou repetição de exame — sempre como pergunta ou sugestão de
conferência, nunca como conclusão.`,

  biorressonancia: `Leia o boletim de biorressonância abaixo e organize assim:

## Resumo
O que o boletim aponta, em dois ou três períodos.

## Itens alterados
Cada item que o aparelho marcou como alterado, com o grau/valor que o próprio boletim informa,
agrupados por sistema do corpo quando o boletim permitir.

## Recomendações que o próprio aparelho trouxe
Transcreva o que o boletim sugere, se sugerir. Deixe claro que é do aparelho, não seu.

## Pontos para a profissional conferir
Correlações com queixa, histórico ou exames — como sugestão de conferência.

Atenção: biorressonância não é exame laboratorial. Não a trate como diagnóstico nem misture os
achados dela com resultado de laboratório.`,

  recomendacao: `Monte uma PROPOSTA de conduta terapêutica a partir do histórico abaixo, assim:

## Leitura do caso
O que o conjunto de registros sugere, em dois ou três períodos.

## Proposta de conduta
Itens concretos (suplementação, terapia, frequência, hábito), cada um com **por que** está sendo
proposto, ancorado em algo que aparece no histórico. Sem dose fechada quando o histórico não permitir.

## Antes de aplicar, conferir
Alergias, medicamentos e suplementos já registrados que possam conflitar, e o que falta saber.

## O que não dá para concluir com o que está registrado
Seja explícito sobre as lacunas.

Nada aqui é prescrição: a decisão e o ajuste de dose são da profissional.`,
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
    "pediu um ajuste. Reescreva a análise INTEIRA já com o ajuste aplicado, mantendo a mesma",
    "estrutura de seções. Não responda conversando nem explique o que mudou — devolva só a análise",
    "revisada, pronta para substituir a anterior.",
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
