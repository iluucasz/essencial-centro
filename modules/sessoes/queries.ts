import { and, count, desc, eq, isNull } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { agendamento } from "@/modules/agenda/schema";
import { autorizarClienteDono, autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";
import { servico } from "@/modules/servicos/schema";

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

export async function listarPendenciasRegistroSessao(limite = 5) {
  autorizarPapel(await auth(), ["profissional"]);

  const condicao = and(eq(agendamento.status, "realizado"), isNull(sessao.id));

  const [itens, [{ total }]] = await Promise.all([
    db
      .select({
        agendamentoId: agendamento.id,
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        inicio: agendamento.inicio,
        servicoNome: servico.nome,
      })
      .from(agendamento)
      .innerJoin(cliente, eq(cliente.id, agendamento.clienteId))
      .innerJoin(servico, eq(servico.id, agendamento.servicoId))
      .leftJoin(sessao, eq(sessao.agendamentoId, agendamento.id))
      .where(condicao)
      .orderBy(desc(agendamento.inicio))
      .limit(limite),
    db
      .select({ total: count() })
      .from(agendamento)
      .leftJoin(sessao, eq(sessao.agendamentoId, agendamento.id))
      .where(condicao),
  ]);

  return { itens, total };
}
