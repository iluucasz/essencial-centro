import { and, asc, desc, eq, gte, lt, lte, ne } from "drizzle-orm";

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

/** Usado pelo gráfico de tendência do painel — volume de agendamentos por dia. */
export async function listarAgendamentosUltimosDias(dias: number) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const inicio = new Date();
  inicio.setDate(inicio.getDate() - (dias - 1));
  inicio.setHours(0, 0, 0, 0);

  return db
    .select({ inicio: agendamento.inicio })
    .from(agendamento)
    .where(and(gte(agendamento.inicio, inicio), ne(agendamento.status, "cancelado")));
}

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

/**
 * Usado só pelo job de lembretes do cron (`app/api/cron/lembretes`) — sem sessão de usuário
 * (disparado pela Vercel, não por alguém logado), então sem checagem de role própria. A
 * autorização desse fluxo é a validação do `CRON_SECRET` na própria rota da API.
 */
export async function listarAgendamentosParaLembretes() {
  const agora = new Date();
  const limite = new Date(agora.getTime() + 25 * 60 * 60 * 1000);

  return db
    .select({
      id: agendamento.id,
      clienteId: agendamento.clienteId,
      inicio: agendamento.inicio,
      status: agendamento.status,
      lembreteDiaAnteriorEm: agendamento.lembreteDiaAnteriorEm,
      lembreteHorasAntesEm: agendamento.lembreteHorasAntesEm,
      servicoNome: servico.nome,
    })
    .from(agendamento)
    .innerJoin(servico, eq(servico.id, agendamento.servicoId))
    .where(
      and(
        eq(agendamento.status, "marcado"),
        gte(agendamento.inicio, agora),
        lte(agendamento.inicio, limite),
      ),
    );
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
