/** Ninguém pode ativar/desativar a própria conta — evita a profissional se trancar fora do
 * painel sem querer (ou por engano clicar no próprio switch numa lista longa). */
export function podeAlternarAtivoDe(usuarioAlvoId: string, usuarioAtualId: string) {
  return usuarioAlvoId !== usuarioAtualId;
}
