type ClienteParaSugestao = {
  nome: string;
};

const LIMITE_SUGESTOES = 4;

/**
 * Quando a resposta do assistente termina em "?", ele mesmo está pedindo uma informação (ex.:
 * "qual o nome do cliente?") — sugerir "próximas perguntas" nesse caso é sem sentido (viraria uma
 * pergunta pra profissional responder a própria pergunta do assistente). Regra determinística, não
 * fica na mão do modelo entender isso sozinho — já vimos ele errar mesmo com instrução clara.
 */
export function respostaEhPergunta(resposta: string) {
  return resposta.trim().endsWith("?");
}

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function respostaPedeNomeCliente(resposta: string) {
  const texto = normalizarTexto(resposta);

  return (
    texto.includes("qual cliente") ||
    texto.includes("informe o nome") ||
    texto.includes("nome ou parte do nome") ||
    (texto.includes("preciso do nome") && texto.includes("cliente")) ||
    (texto.includes("gostaria de ver") && texto.includes("cliente"))
  );
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

function sugestoesDeClientes(clientes: ClienteParaSugestao[]) {
  return clientes
    .map((cliente) => cliente.nome.trim())
    .filter(Boolean)
    .slice(0, LIMITE_SUGESTOES);
}

function sugestoesDeterministicas(pergunta: string, resposta: string) {
  const texto = normalizarTexto(`${pergunta}\n${resposta}`);

  if (texto.includes("agenda") || texto.includes("atendimento")) {
    return [
      "Quantos atendimentos tenho hoje?",
      "Quais atendimentos estão pendentes?",
      "Mostre a agenda desta semana",
    ];
  }

  if (texto.includes("financeiro") || texto.includes("saldo") || texto.includes("lancamento")) {
    return [
      "Qual o saldo financeiro deste mês?",
      "Quais receitas entraram este mês?",
      "Quais lançamentos estão pendentes?",
    ];
  }

  if (texto.includes("estoque") || texto.includes("produto")) {
    return [
      "Quais produtos estão com estoque baixo?",
      "Mostre o estoque disponível",
      "Quais produtos precisam de atenção?",
    ];
  }

  if (
    texto.includes("cliente") ||
    texto.includes("evolucao") ||
    texto.includes("sessao") ||
    texto.includes("pacote") ||
    texto.includes("documento") ||
    texto.includes("medicamento")
  ) {
    return [
      "Mostre as sessões recentes dessa cliente",
      "Quais pacotes ativos ela tem?",
      "Quais medicamentos estão registrados?",
    ];
  }

  return [
    "Quantos atendimentos tenho hoje?",
    "Qual o saldo financeiro deste mês?",
    "Quais produtos estão com estoque baixo?",
  ];
}

/**
 * Sugestões de próxima mensagem para chips do widget. Elas são determinísticas de propósito: os
 * chips nunca podem inventar clientes, então nomes só aparecem quando vierem do banco via
 * buscarClientesParaSugestao.
 */
export async function gerarSugestoesAssistente({
  buscarClientesParaSugestao,
  pergunta,
  resposta,
}: {
  buscarClientesParaSugestao?: () => Promise<ClienteParaSugestao[]>;
  pergunta: string;
  resposta: string;
}): Promise<string[]> {
  try {
    if (respostaPedeNomeCliente(resposta)) {
      const clientes = buscarClientesParaSugestao ? await buscarClientesParaSugestao() : [];

      return sugestoesDeClientes(clientes);
    }

    if (respostaEhPergunta(resposta) || respostaEhRecusaDeEscrita(resposta)) return [];

    return sugestoesDeterministicas(pergunta, resposta).slice(0, LIMITE_SUGESTOES);
  } catch (erro) {
    console.error("Erro ao gerar sugestões do assistente:", erro);
    return [];
  }
}
