import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { FOTO_PERFIL_CLIENTE_REGIAO } from "@/modules/fotos/perfil-schema";
import { foto } from "@/modules/fotos/schema";

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
 * pode listar/gerenciar. Usuário vinculado a um cliente (role "cliente") não costuma ter foto
 * própria (`usuario.image` — enviada em `/painel/usuarios`); nesse caso cai pra foto de perfil
 * já cadastrada no cliente vinculado, mesma fonte usada em `listarClientes`. */
export async function listarUsuarios() {
  await exigirUsuarioAtual(["profissional"]);

  const registros = await db
    .select({
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      image: usuario.image,
      role: usuario.role,
      clienteId: usuario.clienteId,
      ativo: usuario.ativo,
      criadoEm: usuario.criadoEm,
    })
    .from(usuario)
    .orderBy(asc(usuario.name));

  const clienteIds = registros
    .map((registro) => registro.clienteId)
    .filter((clienteId) => clienteId !== null);

  if (clienteIds.length === 0) {
    return registros.map((registro) => ({
      ...registro,
      clienteFotoPerfilId: null as string | null,
    }));
  }

  const fotosPerfil = await db
    .select({ id: foto.id, clienteId: foto.clienteId, dataFoto: foto.dataFoto })
    .from(foto)
    .where(and(inArray(foto.clienteId, clienteIds), eq(foto.regiao, FOTO_PERFIL_CLIENTE_REGIAO)))
    .orderBy(desc(foto.dataFoto));

  const fotoMaisRecentePorCliente = new Map<string, string>();
  for (const fotoPerfil of fotosPerfil) {
    if (!fotoMaisRecentePorCliente.has(fotoPerfil.clienteId)) {
      fotoMaisRecentePorCliente.set(fotoPerfil.clienteId, fotoPerfil.id);
    }
  }

  return registros.map((registro) => ({
    ...registro,
    clienteFotoPerfilId: registro.clienteId
      ? (fotoMaisRecentePorCliente.get(registro.clienteId) ?? null)
      : null,
  }));
}
