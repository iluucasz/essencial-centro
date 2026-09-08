/**
 * Verificar https://api-docs.deepseek.com/quick_start/pricing antes de mexer aqui — a DeepSeek já
 * removeu os aliases antigos "deepseek-chat"/"deepseek-reasoner" (24/07/2026). deepseek-v4-flash é
 * o modelo rápido com tool-use, equivalente em papel ao antigo openai/gpt-oss-120b da Groq.
 */
export const MODELO_DEEPSEEK_PADRAO = "deepseek-v4-flash";

export const LIMITE_PASSOS_FERRAMENTA = 6;
export const LIMITE_PASSOS_FERRAMENTA_COM_ANEXO = 10;

/**
 * Os modelos DeepSeek V4 vêm com "thinking" (raciocínio oculto) ligado por padrão. Já vimos essa
 * armadilha com a Groq: reasoningEffort "high" sobre o contexto grande do PDF gastava todo o
 * orçamento de saída raciocinando e batia o teto de tokens (finishReason "length") ANTES de
 * escrever a resposta — retorno vazio, "carregou e parou". Desliga o thinking de propósito em vez
 * de tentar calibrar mais um dial de esforço.
 */
export const OPCOES_PROVEDOR_DEEPSEEK = { deepseek: { thinking: { type: "disabled" as const } } };
/** Teto de saída no modo anexo — headroom para o resumo completo sem depender do default do provedor. */
export const MAX_TOKENS_SAIDA_COM_ANEXO = 8000;
export const LIMITE_MENSAGENS_CONTEXTO = 20;
export const LIMITE_MENSAGENS_CONTEXTO_COM_ANEXO = 60;
export const LIMITE_RESULTADOS_BUSCA_CLIENTE = 10;
export const LIMITE_SESSOES_RETORNADAS = 5;
export const LIMITE_CARACTERES_TEXTO_LONGO = 400;
export const LIMITE_CARACTERES_CONTEUDO_DOCUMENTO = 500;
export const LIMITE_HISTORICO_PADRAO = 50;
export const LIMITE_BYTES_PDF_ASSISTENTE = 20 * 1024 * 1024;
export const LIMITE_CARACTERES_TEXTO_PDF_ASSISTENTE = 600_000;
export const LIMITE_CARACTERES_CONTEXTO_PDF_ASSISTENTE = 40_000;
export const TAMANHO_TRECHO_PDF_ASSISTENTE = 2_400;
export const SOBREPOSICAO_TRECHO_PDF_ASSISTENTE = 250;

export function deepseekConfigurado() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}
