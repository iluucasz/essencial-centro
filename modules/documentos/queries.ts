import { and, desc, eq, notInArray } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarClienteDono, autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";

import { documento, documentoVisivelAoCliente, tiposDocumentoSomenteProfissional } from "./schema";

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
    .where(
      and(
        eq(documento.clienteId, usuario.clienteId),
        // Material clínico de leitura interna não aparece no portal — ver tiposDocumentoSomenteProfissional.
        notInArray(documento.tipo, [...tiposDocumentoSomenteProfissional]),
      ),
    )
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

    // Ser dono não basta: tipo clínico interno não é do cliente nem pelo link direto.
    if (!documentoVisivelAoCliente(registro.tipo)) return null;
  }

  return registro;
}
