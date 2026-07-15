import { and, asc, desc, eq, gte, lt, lte } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";
import { servico } from "@/modules/servicos/schema";
import { usuario } from "@/modules/auth/schema";

import { agendamento } from "./schema";

function limitesDoDia(data: Date) {
  const inicioDoDia = new Date(data);
  inicioDoDia.setHours(0, 0, 0, 0);

  const inicioDoDiaSeguinte = new Date(inicioDoDia);
  inicioDoDiaSeguinte.setDate(inicioDoDiaSeguinte.getDate() + 1);

  return { inicioDoDia, inicioDoDiaSeguinte };
}

const colunasAgendamento = {
  id: agendamento.id,
  inicio: agendamento.inicio,
  duracaoMinutos: agendamento.duracaoMinutos,
  status: agendamento.status,
  observacoes: agendamento.observacoes,
  checkinEm: agendamento.checkinEm,
  clienteNome: cliente.nome,
  servicoNome: servico.nome,
  profissionalNome: usuario.name,
};

export async function listarAgendamentosDoDia(data: Date) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const { inicioDoDia, inicioDoDiaSeguinte } = limitesDoDia(data);

  return db
    .select(colunasAgendamento)
    .from(agendamento)
    .innerJoin(cliente, eq(cliente.id, agendamento.clienteId))
    .innerJoin(servico, eq(servico.id, agendamento.servicoId))
    .innerJoin(usuario, eq(usuario.id, agendamento.profissionalId))
    .where(and(gte(agendamento.inicio, inicioDoDia), lt(agendamento.inicio, inicioDoDiaSeguinte)))
    .orderBy(asc(agendamento.inicio));
}

/** Usado pelos relatórios — agregado por período, sem os dados de contato do cliente. */
export async function listarAgendamentosNoPeriodo(inicio: Date, fim: Date) {
  autorizarPapel(await auth(), ["profissional"]);

  return db
    .select({ id: agendamento.id, status: agendamento.status, servicoNome: servico.nome })
    .from(agendamento)
    .innerJoin(servico, eq(servico.id, agendamento.servicoId))
    .where(and(gte(agendamento.inicio, inicio), lte(agendamento.inicio, fim)));
}

/** Usado só pela action de criação, para checar sobreposição — sem checagem de role própria. */
export async function listarAgendamentosDoProfissionalNoDia(profissionalId: string, data: Date) {
  const { inicioDoDia, inicioDoDiaSeguinte } = limitesDoDia(data);

  return db
    .select({
      id: agendamento.id,
      inicio: agendamento.inicio,
      duracaoMinutos: agendamento.duracaoMinutos,
    })
    .from(agendamento)
    .where(
      and(
        eq(agendamento.profissionalId, profissionalId),
        gte(agendamento.inicio, inicioDoDia),
        lt(agendamento.inicio, inicioDoDiaSeguinte),
        eq(agendamento.status, "marcado"),
      ),
    );
}

/** Usado pelo formulário de sessão, para vincular o registro clínico a um atendimento marcado. */
export async function listarAgendamentosDoCliente(clienteId: string) {
  autorizarPapel(await auth(), ["profissional"]);

  return db
    .select({
      id: agendamento.id,
      inicio: agendamento.inicio,
      status: agendamento.status,
      servicoNome: servico.nome,
    })
    .from(agendamento)
    .innerJoin(servico, eq(servico.id, agendamento.servicoId))
    .where(eq(agendamento.clienteId, clienteId))
    .orderBy(desc(agendamento.inicio))
    .limit(20);
}

/** Usado pela página de confirmação de presença (destino do QR Code mostrado ao cliente). */
export async function obterAgendamentoParaCheckin(id: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const [registro] = await db
    .select(colunasAgendamento)
    .from(agendamento)
    .innerJoin(cliente, eq(cliente.id, agendamento.clienteId))
    .innerJoin(servico, eq(servico.id, agendamento.servicoId))
    .innerJoin(usuario, eq(usuario.id, agendamento.profissionalId))
    .where(eq(agendamento.id, id))
    .limit(1);

  return registro ?? null;
}

export async function listarMeusAgendamentos() {
  const sessao = await auth();
  const usuarioSessao = autorizarPapel(sessao, ["cliente"]);

  if (!usuarioSessao.clienteId) {
    throw new ErroAutorizacao(
      "Seu usuário ainda não está vinculado a um cadastro de cliente.",
      403,
    );
  }

  return db
    .select(colunasAgendamento)
    .from(agendamento)
    .innerJoin(cliente, eq(cliente.id, agendamento.clienteId))
    .innerJoin(servico, eq(servico.id, agendamento.servicoId))
    .innerJoin(usuario, eq(usuario.id, agendamento.profissionalId))
    .where(
      and(eq(agendamento.clienteId, usuarioSessao.clienteId), gte(agendamento.inicio, new Date())),
    )
    .orderBy(asc(agendamento.inicio));
}
