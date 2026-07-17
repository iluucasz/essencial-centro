import { and, desc, eq, ne } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarClienteDono, autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";

import { foto } from "./schema";
import { FOTO_PERFIL_CLIENTE_REGIAO } from "./perfil-schema";

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
    .where(and(eq(foto.clienteId, clienteId), ne(foto.regiao, FOTO_PERFIL_CLIENTE_REGIAO)))
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
    .where(and(eq(foto.clienteId, usuario.clienteId), ne(foto.regiao, FOTO_PERFIL_CLIENTE_REGIAO)))
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
