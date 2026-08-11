import type { PapelUsuario } from "./rbac";

/** Ninguém pode ativar/desativar a própria conta — evita a profissional se trancar fora do
 * painel sem querer (ou por engano clicar no próprio switch numa lista longa). */
export function podeAlternarAtivoDe(usuarioAlvoId: string, usuarioAtualId: string) {
  return usuarioAlvoId !== usuarioAtualId;
}

/**
 * Só contas `cliente` (login do portal) podem ser excluídas de verdade. `profissional`/`recepcao`
 * têm `criadoPorId`/`atualizadoPorId`/`profissionalId` referenciados com `onDelete: "restrict"` em
 * quase toda tabela clínica — excluir apagaria o histórico de quem fez o quê, ou o Postgres recusa a
 * query. Desativar é a ferramenta certa pra essas; ver `alternarAtivoUsuario`.
 */
export function podeExcluirUsuario(role: PapelUsuario) {
  return role === "cliente";
}
