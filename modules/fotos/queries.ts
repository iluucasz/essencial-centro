import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarClienteDono, autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";

import { foto } from "./schema";

const colunasListagem = {
  id: foto.id,
  regiao: foto.regiao,
  dataFoto: foto.dataFoto,
  clienteId: foto.clienteId,
};

export async function listarFotosDoCliente(clienteId: string) {
  autorizarPapel(await auth(), ["profissional"]);

  return db
    .select(colunasListagem)
    .from(foto)
    .where(eq(foto.clienteId, clienteId))
    .orderBy(desc(foto.dataFoto));
}

export async function listarMinhasFotos() {
  const sessaoAuth = await auth();
  const usuario = autorizarPapel(sessaoAuth, ["cliente"]);

  if (!usuario.clienteId) {
    throw new ErroAutorizacao(
      "Seu usuário ainda não está vinculado a um cadastro de cliente.",
      403,
    );
  }

  autorizarClienteDono(sessaoAuth, usuario.clienteId);

  return db
    .select(colunasListagem)
    .from(foto)
    .where(eq(foto.clienteId, usuario.clienteId))
    .orderBy(desc(foto.dataFoto));
}

/**
 * Usada só pela rota que serve o binário (app/api/fotos/[id]/imagem) — reautoriza a cada request:
 * profissional acessa qualquer foto; cliente só a própria. Recepção não acessa (dado clínico).
 */
export async function obterFotoAutorizada(id: string) {
  const sessaoAuth = await auth();
  const usuario = autorizarPapel(sessaoAuth, ["profissional", "cliente"]);

  const [registro] = await db.select().from(foto).where(eq(foto.id, id)).limit(1);

  if (!registro) return null;

  if (usuario.role === "cliente") {
    autorizarClienteDono(sessaoAuth, registro.clienteId);
  }

  return registro;
}
