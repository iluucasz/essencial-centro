import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarClienteDono, autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";

import { filtrarSessaoParaCliente } from "./acesso";
import { sessao } from "./schema";

/** Registro clínico — só a profissional acessa (recepção não vê anotações clínicas). */
export async function listarSessoesDoCliente(clienteId: string) {
  autorizarPapel(await auth(), ["profissional"]);

  return db
    .select()
    .from(sessao)
    .where(eq(sessao.clienteId, clienteId))
    .orderBy(desc(sessao.dataHora));
}

export async function listarMinhasSessoes() {
  const sessaoAuth = await auth();
  const usuario = autorizarPapel(sessaoAuth, ["cliente"]);

  if (!usuario.clienteId) {
    throw new ErroAutorizacao(
      "Seu usuário ainda não está vinculado a um cadastro de cliente.",
      403,
    );
  }

  autorizarClienteDono(sessaoAuth, usuario.clienteId);

  const sessoes = await db
    .select()
    .from(sessao)
    .where(eq(sessao.clienteId, usuario.clienteId))
    .orderBy(desc(sessao.dataHora));

  return sessoes.map(filtrarSessaoParaCliente);
}
