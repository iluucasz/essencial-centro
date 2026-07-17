import { and, desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarClienteDono, autorizarPapel } from "@/modules/auth/rbac";
import { usuario } from "@/modules/auth/schema";

import { podeVerFotoUsuario } from "./perfil-acesso";
import { foto } from "./schema";
import { FOTO_PERFIL_CLIENTE_REGIAO } from "./perfil-schema";

export async function obterFotoPerfilCliente(clienteId: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const [registro] = await db
    .select({
      id: foto.id,
      clienteId: foto.clienteId,
      dataFoto: foto.dataFoto,
    })
    .from(foto)
    .where(and(eq(foto.clienteId, clienteId), eq(foto.regiao, FOTO_PERFIL_CLIENTE_REGIAO)))
    .orderBy(desc(foto.dataFoto))
    .limit(1);

  return registro ?? null;
}

export async function obterFotoPerfilClienteAutorizada(clienteId: string) {
  const sessaoAuth = await auth();
  const usuarioAtual = autorizarPapel(sessaoAuth, ["profissional", "recepcao", "cliente"]);

  if (usuarioAtual.role === "cliente") {
    autorizarClienteDono(sessaoAuth, clienteId);
  }

  const [registro] = await db
    .select()
    .from(foto)
    .where(and(eq(foto.clienteId, clienteId), eq(foto.regiao, FOTO_PERFIL_CLIENTE_REGIAO)))
    .orderBy(desc(foto.dataFoto))
    .limit(1);

  return registro ?? null;
}

export async function obterFotoUsuarioAutorizada(usuarioId: string) {
  const sessaoAuth = await auth();
  const usuarioAtual = autorizarPapel(sessaoAuth, ["profissional", "recepcao", "cliente"]);

  if (!podeVerFotoUsuario(usuarioAtual, usuarioId)) {
    return null;
  }

  const [registro] = await db
    .select({ id: usuario.id, image: usuario.image })
    .from(usuario)
    .where(eq(usuario.id, usuarioId))
    .limit(1);

  return registro?.image ? registro : null;
}
