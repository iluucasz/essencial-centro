import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarClienteDono, autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";

import { filtrarFichaParaCliente } from "./acesso";
import { ficha } from "./schema";

export async function listarFichasDoCliente(clienteId: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  return db
    .select()
    .from(ficha)
    .where(eq(ficha.clienteId, clienteId))
    .orderBy(desc(ficha.criadoEm));
}

export async function getFicha(id: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const [registro] = await db.select().from(ficha).where(eq(ficha.id, id)).limit(1);

  return registro ?? null;
}

export async function listarMinhasFichas() {
  const sessao = await auth();
  const usuario = autorizarPapel(sessao, ["cliente"]);

  if (!usuario.clienteId) {
    throw new ErroAutorizacao(
      "Seu usuário ainda não está vinculado a um cadastro de cliente.",
      403,
    );
  }

  autorizarClienteDono(sessao, usuario.clienteId);

  const fichas = await db
    .select()
    .from(ficha)
    .where(eq(ficha.clienteId, usuario.clienteId))
    .orderBy(desc(ficha.criadoEm));

  return fichas.map(filtrarFichaParaCliente);
}
