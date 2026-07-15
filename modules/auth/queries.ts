import { and, asc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";

import { autorizarPapel, type PapelUsuario } from "./rbac";
import { usuario } from "./schema";

export async function getSessaoAtual() {
  return auth();
}

export async function exigirUsuarioAtual(papeisPermitidos: readonly PapelUsuario[]) {
  const sessao = await auth();

  return autorizarPapel(sessao, papeisPermitidos);
}

export async function listarProfissionaisAtivos() {
  await exigirUsuarioAtual(["profissional", "recepcao"]);

  return db
    .select({ id: usuario.id, name: usuario.name, email: usuario.email })
    .from(usuario)
    .where(and(eq(usuario.role, "profissional"), eq(usuario.ativo, true)))
    .orderBy(asc(usuario.name));
}
