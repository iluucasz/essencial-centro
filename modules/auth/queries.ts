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

export async function exigirUsuarioAtualComImagem(papeisPermitidos: readonly PapelUsuario[]) {
  const usuarioAtual = await exigirUsuarioAtual(papeisPermitidos);

  const [registro] = await db
    .select({
      name: usuario.name,
      email: usuario.email,
      image: usuario.image,
    })
    .from(usuario)
    .where(eq(usuario.id, usuarioAtual.id))
    .limit(1);

  return {
    ...usuarioAtual,
    name: registro?.name ?? usuarioAtual.name,
    email: registro?.email ?? usuarioAtual.email,
    image: registro?.image ?? null,
  };
}

export async function listarProfissionaisAtivos() {
  await exigirUsuarioAtual(["profissional", "recepcao"]);

  return db
    .select({ id: usuario.id, name: usuario.name, email: usuario.email })
    .from(usuario)
    .where(and(eq(usuario.role, "profissional"), eq(usuario.ativo, true)))
    .orderBy(asc(usuario.name));
}

/** Tela "Usuários" (`/painel/usuarios`) — quem pode criar usuário (`criarUsuario`) também é quem
 * pode listar/gerenciar. */
export async function listarUsuarios() {
  await exigirUsuarioAtual(["profissional"]);

  return db
    .select({
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      image: usuario.image,
      role: usuario.role,
      ativo: usuario.ativo,
      criadoEm: usuario.criadoEm,
    })
    .from(usuario)
    .orderBy(asc(usuario.name));
}
