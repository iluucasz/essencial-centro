/**
 * Verificar em https://console.groq.com/docs/models antes de mexer aqui — a Groq deprecia modelo
 * com pouco aviso (ex.: llama-3.3-70b-versatile foi descontinuado em 17/06/2026 pro tier
 * free/dev). openai/gpt-oss-120b é o substituto recomendado pela própria Groq, com tool-use.
 */
export const MODELO_GROQ_PADRAO = "openai/gpt-oss-120b";

export const LIMITE_PASSOS_FERRAMENTA = 6;
export const LIMITE_MENSAGENS_CONTEXTO = 20;
export const LIMITE_RESULTADOS_BUSCA_CLIENTE = 10;
export const LIMITE_SESSOES_RETORNADAS = 5;
export const LIMITE_CARACTERES_TEXTO_LONGO = 400;
export const LIMITE_CARACTERES_CONTEUDO_DOCUMENTO = 500;
export const LIMITE_HISTORICO_PADRAO = 50;

export function groqConfigurado() {
  return Boolean(process.env.GROQ_API_KEY);
}
