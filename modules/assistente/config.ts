/**
 * Verificar em https://console.groq.com/docs/models antes de mexer aqui — a Groq deprecia modelo
 * com pouco aviso (ex.: llama-3.3-70b-versatile foi descontinuado em 17/06/2026 pro tier
 * free/dev). openai/gpt-oss-120b é o substituto recomendado pela própria Groq, com tool-use.
 */
export const MODELO_GROQ_PADRAO = "openai/gpt-oss-120b";

export const LIMITE_PASSOS_FERRAMENTA = 6;
export const LIMITE_PASSOS_FERRAMENTA_COM_ANEXO = 10;

/**
 * Esforço de raciocínio do gpt-oss no modo anexo. NÃO usar "high": com o contexto grande do PDF
 * (~40k chars), o modelo gasta TODO o orçamento de saída em raciocínio oculto e bate o teto de
 * tokens (finishReason "length") ANTES de escrever a resposta — retorno vazio, "carregou e parou".
 * "medium" deixa raciocínio suficiente para organizar o resumo e ainda sobra orçamento pro texto.
 */
export const ESFORCO_RACIOCINIO_COM_ANEXO = "medium" as const;
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

export function groqConfigurado() {
  return Boolean(process.env.GROQ_API_KEY);
}
