import { auth } from "@/auth";

import { autorizarPapel, type PapelUsuario } from "./rbac";

export async function getSessaoAtual() {
  return auth();
}

export async function exigirUsuarioAtual(papeisPermitidos: readonly PapelUsuario[]) {
  const sessao = await auth();

  return autorizarPapel(sessao, papeisPermitidos);
}
