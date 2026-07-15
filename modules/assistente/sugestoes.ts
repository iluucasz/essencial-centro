import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

import { MODELO_GROQ_PADRAO } from "./config";

const sugestoesSchema = z.object({
  sugestoes: z.array(z.string().trim().min(1).max(120)).min(2).max(4),
});

/**
 * Quando a resposta do assistente termina em "?", ele mesmo está pedindo uma informação (ex.:
 * "qual o nome do cliente?") — sugerir "próximas perguntas" nesse caso é sem sentido (viraria uma
 * pergunta pra profissional responder a própria pergunta do assistente). Regra determinística, não
 * fica na mão do modelo entender isso sozinho — já vimos ele errar mesmo com instrução clara.
 */
export function respostaEhPergunta(resposta: string) {
  return resposta.trim().endsWith("?");
}

const PALAVRAS_NEGACAO = ["não consigo", "não posso", "não tenho acesso"];
const PALAVRAS_ACAO_ESCRITA = [
  "registrar",
  "alterar",
  "editar",
  "criar",
  "apagar",
  "agendar",
  "escrita",
];

/**
 * Quando a resposta é uma recusa de ação de escrita (o assistente é só leitura — ver prompt.ts),
 * sugerir "próxima pergunta" tende a puxar a conversa pra um beco sem saída em volta da mesma
 * ação impossível (ex.: "vou atualizar agora", "me avise quando terminar") em vez de voltar pra
 * algo que o assistente realmente responde. Mesma lógica de respostaEhPergunta: regra
 * determinística, não fica na mão do modelo.
 */
export function respostaEhRecusaDeEscrita(resposta: string) {
  const texto = resposta.toLowerCase();

  return (
    PALAVRAS_NEGACAO.some((negacao) => texto.includes(negacao)) &&
    PALAVRAS_ACAO_ESCRITA.some((acao) => texto.includes(acao))
  );
}

/**
 * Chamada separada e determinística (generateObject, saída estruturada) pra gerar as próximas
 * perguntas — não depende do modelo principal lembrar de chamar uma tool: na prática ele às vezes
 * escrevia as sugestões como texto solto dentro da própria resposta em vez de estruturado, o que
 * aparecia sem formatação nenhuma pra profissional. Nunca lança: se falhar, a conversa continua
 * normalmente, só sem chips nesse turno.
 */
export async function gerarSugestoesAssistente({
  pergunta,
  resposta,
}: {
  pergunta: string;
  resposta: string;
}): Promise<string[]> {
  if (respostaEhPergunta(resposta) || respostaEhRecusaDeEscrita(resposta)) return [];

  try {
    const { object } = await generateObject({
      model: groq(MODELO_GROQ_PADRAO),
      schema: sugestoesSchema,
      instructions:
        "Você gera sugestões de próxima mensagem para uma profissional que está conversando com " +
        "um assistente de dados SOMENTE LEITURA de uma clínica. As sugestões são frases curtas que " +
        "a PRÓPRIA PROFISSIONAL enviaria ao assistente — nunca perguntas feitas a ela, nunca " +
        "repetição do que o assistente acabou de perguntar.\n\n" +
        "O assistente só consulta dado já registrado (clientes, evolução, sessões, medicamentos já " +
        "registrados, financeiro, estoque, agenda, pacotes, documentos, relatórios) — ele NUNCA " +
        "agenda, cria, edita, apaga nem avisa quando algo for concluído. Por isso as sugestões " +
        "devem ser SEMPRE perguntas de consulta que o assistente pode responder agora — NUNCA um " +
        'pedido de ação de escrita, NUNCA uma frase como "vou fazer X agora" ou "me avise quando ' +
        'terminar".\n\n' +
        'Exemplo 1:\nPergunta da profissional: "busca aí um cliente"\nResposta do assistente: ' +
        '"Para buscar o cliente preciso do nome (ou parte dele) ou do e-mail."\nSugestões ' +
        'corretas: ["Busque por Thalia", "O e-mail é thalia@exemplo.com"]\nSugestões erradas ' +
        '(nunca faça isso): ["Qual o nome completo do cliente?", "Você lembra o e-mail?"] — são ' +
        "perguntas repetindo o que o assistente já perguntou, não respostas da profissional.\n\n" +
        'Exemplo 2:\nPergunta da profissional: "registre que a cliente não tem alergias"\n' +
        'Resposta do assistente: "Não consigo registrar isso — inclua essa observação na tela de ' +
        'edição do cadastro no painel."\nSugestões corretas: ["Quais medicamentos já estão ' +
        'registrados para ela?", "Mostre a evolução de tratamento dela", "Quais são os pacotes ' +
        'ativos dela?"]\nSugestões erradas (nunca faça isso): ["Vou atualizar o cadastro agora", ' +
        '"Me avise quando a atualização terminar", "Como faço pra editar o campo?"] — nenhuma ' +
        "dessas é uma pergunta de consulta que o assistente consegue responder.",
      prompt: `Pergunta da profissional: ${pergunta}\n\nResposta do assistente: ${resposta}`,
    });

    return object.sugestoes;
  } catch (erro) {
    console.error("Erro ao gerar sugestões do assistente:", erro);
    return [];
  }
}
