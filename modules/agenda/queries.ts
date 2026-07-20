import { and, asc, desc, eq, gte, isNull, lt, lte, ne } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { agoraBrasilia } from "@/lib/utils";
import { autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";
import { servico } from "@/modules/servicos/schema";
import { usuario } from "@/modules/auth/schema";

import { agendamento } from "./schema";

function limitesDoDia(data: Date) {
  const inicioDoDia = new Date(data);
  inicioDoDia.setUTCHours(0, 0, 0, 0);

  const inicioDoDiaSeguinte = new Date(inicioDoDia);
  inicioDoDiaSeguinte.setUTCDate(inicioDoDiaSeguinte.getUTCDate() + 1);

  return { inicioDoDia, inicioDoDiaSeguinte };
}

const colunasAgendamento = {
  id: agendamento.id,
  clienteId: agendamento.clienteId,
  profissionalId: agendamento.profissionalId,
  servicoId: agendamento.servicoId,
  inicio: agendamento.inicio,
  duracaoMinutos: agendamento.duracaoMinutos,
  status: agendamento.status,
  modalidade: agendamento.modalidade,
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

export async function listarAgendamentosDaAgenda(inicio: Date, fim: Date) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  return db
    .select(colunasAgendamento)
    .from(agendamento)
    .innerJoin(cliente, eq(cliente.id, agendamento.clienteId))
    .innerJoin(servico, eq(servico.id, agendamento.servicoId))
    .innerJoin(usuario, eq(usuario.id, agendamento.profissionalId))
    .where(and(gte(agendamento.inicio, inicio), lt(agendamento.inicio, fim)))
    .orderBy(asc(agendamento.inicio));
}

/**
 * Usado pela "Rota domiciliar do dia" — só os atendimentos marcados como `domiciliar` e ainda
 * `marcado` (sem faltas/cancelados), com o endereço do cliente, na ordem dos horários.
 */
export async function listarParadasDomiciliaresDoDia(data: Date) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const { inicioDoDia, inicioDoDiaSeguinte } = limitesDoDia(data);

  return db
    .select({
      id: agendamento.id,
      inicio: agendamento.inicio,
      clienteNome: cliente.nome,
      endereco: cliente.endereco,
    })
    .from(agendamento)
    .innerJoin(cliente, eq(cliente.id, agendamento.clienteId))
    .where(
      and(
        gte(agendamento.inicio, inicioDoDia),
        lt(agendamento.inicio, inicioDoDiaSeguinte),
        eq(agendamento.modalidade, "domiciliar"),
        eq(agendamento.status, "marcado"),
      ),
    )
    .orderBy(asc(agendamento.inicio));
}

/**
 * Usado pela ponte de biometria (modules/biometria) — quem tem atendimento marcado hoje e ainda
 * não fez check-in. Espelha em SQL o predicado exato de podeConfirmarPresenca (checkin.ts) — se
 * essa regra mudar, esta query precisa mudar junto. Sem checagem de role própria: quem chama já
 * validou o segredo da ponte (BIOMETRIA_BRIDGE_SECRET) na própria rota da API.
 */
export async function listarClientesComAgendamentoPendenteHoje() {
  const { inicioDoDia, inicioDoDiaSeguinte } = limitesDoDia(agoraBrasilia());

  return db
    .select({ clienteId: agendamento.clienteId })
    .from(agendamento)
    .where(
      and(
        eq(agendamento.status, "marcado"),
        isNull(agendamento.checkinEm),
        gte(agendamento.inicio, inicioDoDia),
        lt(agendamento.inicio, inicioDoDiaSeguinte),
      ),
    );
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

/** Usado pelo formulário de sessão (vincular o registro clínico a um atendimento marcado) e pela
 * aba "Agendamentos" do perfil do cliente (lista com CRUD completo). */
export async function listarAgendamentosDoCliente(clienteId: string) {
  autorizarPapel(await auth(), ["profissional"]);

  return db
    .select({
      id: agendamento.id,
      clienteId: agendamento.clienteId,
      servicoId: agendamento.servicoId,
      profissionalId: agendamento.profissionalId,
      pacoteId: agendamento.pacoteId,
      inicio: agendamento.inicio,
      duracaoMinutos: agendamento.duracaoMinutos,
      status: agendamento.status,
      modalidade: agendamento.modalidade,
      observacoes: agendamento.observacoes,
      checkinEm: agendamento.checkinEm,
      servicoNome: servico.nome,
      profissionalNome: usuario.name,
    })
    .from(agendamento)
    .innerJoin(servico, eq(servico.id, agendamento.servicoId))
    .leftJoin(usuario, eq(usuario.id, agendamento.profissionalId))
    .where(eq(agendamento.clienteId, clienteId))
    .orderBy(desc(agendamento.inicio))
    .limit(50);
}

/** Usado pela página de detalhe do serviço — histórico de agendamentos vinculados a ele. */
export async function listarAgendamentosDoServico(servicoId: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  return db
    .select({
      id: agendamento.id,
      clienteId: agendamento.clienteId,
      clienteNome: cliente.nome,
      inicio: agendamento.inicio,
      status: agendamento.status,
    })
    .from(agendamento)
    .innerJoin(cliente, eq(cliente.id, agendamento.clienteId))
    .where(eq(agendamento.servicoId, servicoId))
    .orderBy(desc(agendamento.inicio))
    .limit(50);
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
  const agora = agoraBrasilia();
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

async function exigirClienteIdDaSessao() {
  const usuarioSessao = autorizarPapel(await auth(), ["cliente"]);

  if (!usuarioSessao.clienteId) {
    throw new ErroAutorizacao(
      "Seu usuário ainda não está vinculado a um cadastro de cliente.",
      403,
    );
  }

  return usuarioSessao.clienteId;
}

/**
 * Atendimentos ativos do cliente: os que ainda estão `marcado`. O status é a fonte de verdade, não
 * o relógio — um horário que já passou continua "marcado" até a profissional resolvê-lo na agenda
 * (marcar falta/realizado/cancelar). Por isso não filtramos por data aqui.
 */
export async function listarMeusAgendamentos() {
  const clienteId = await exigirClienteIdDaSessao();

  return db
    .select(colunasAgendamento)
    .from(agendamento)
    .innerJoin(cliente, eq(cliente.id, agendamento.clienteId))
    .innerJoin(servico, eq(servico.id, agendamento.servicoId))
    .innerJoin(usuario, eq(usuario.id, agendamento.profissionalId))
    .where(and(eq(agendamento.clienteId, clienteId), eq(agendamento.status, "marcado")))
    .orderBy(asc(agendamento.inicio));
}

/**
 * Histórico do cliente: atendimentos já resolvidos pela profissional (realizado/falta/cancelado).
 * Existe pra que, ao clicar numa notificação de um atendimento antigo, o cliente veja o registro e
 * o estado ("Cancelado", "Falta"…) em vez de uma lista vazia.
 */
export async function listarMeuHistoricoAgendamentos(limite = 30) {
  const clienteId = await exigirClienteIdDaSessao();

  return db
    .select(colunasAgendamento)
    .from(agendamento)
    .innerJoin(cliente, eq(cliente.id, agendamento.clienteId))
    .innerJoin(servico, eq(servico.id, agendamento.servicoId))
    .innerJoin(usuario, eq(usuario.id, agendamento.profissionalId))
    .where(and(eq(agendamento.clienteId, clienteId), ne(agendamento.status, "marcado")))
    .orderBy(desc(agendamento.inicio))
    .limit(limite);
}
