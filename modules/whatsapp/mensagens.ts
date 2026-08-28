/**
 * Personalização de mensagens predefinidas/campanhas. Só o token `{nome}` é suportado —
 * deliberadamente simples: nada de motor de template genérico pra uma única variável.
 */
export function personalizarMensagem(conteudo: string, primeiroNome: string): string {
  return conteudo.replaceAll("{nome}", primeiroNome);
}
