import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarClienteDono, autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";

import { documento } from "./schema";

export async function listarDocumentosDoCliente(clienteId: string) {
  autorizarPapel(await auth(), ["profissional"]);

  return db
    .select()
    .from(documento)
    .where(eq(documento.clienteId, clienteId))
    .orderBy(desc(documento.criadoEm));
}

export async function listarMeusDocumentos() {
  const sessao = await auth();
  const usuario = autorizarPapel(sessao, ["cliente"]);

  if (!usuario.clienteId) {
    throw new ErroAutorizacao(
      "Seu usuário ainda não está vinculado a um cadastro de cliente.",
      403,
    );
  }

  autorizarClienteDono(sessao, usuario.clienteId);

  return db
    .select()
    .from(documento)
    .where(eq(documento.clienteId, usuario.clienteId))
    .orderBy(desc(documento.criadoEm));
}

/** Detalhe de um documento — profissional vê qualquer um; cliente só o próprio. */
export async function obterDocumento(id: string) {
  const sessao = await auth();
  const usuario = autorizarPapel(sessao, ["profissional", "cliente"]);

  const [registro] = await db.select().from(documento).where(eq(documento.id, id)).limit(1);

  if (!registro) return null;

  if (usuario.role === "cliente") {
    autorizarClienteDono(sessao, registro.clienteId);
  }

  return registro;
}
