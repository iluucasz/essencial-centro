import { and, eq, gte, isNull, lt } from "drizzle-orm";

import { db } from "@/db";
import { servico } from "@/modules/servicos/schema";

import { escolherAgendamentoMaisProximo } from "./checkin";
import { agendamento } from "./schema";

function limitesDoDia(data: Date) {
  const inicioDoDia = new Date(data);
  inicioDoDia.setUTCHours(0, 0, 0, 0);

  const inicioDoDiaSeguinte = new Date(inicioDoDia);
  inicioDoDiaSeguinte.setUTCDate(inicioDoDiaSeguinte.getUTCDate() + 1);

  return { inicioDoDia, inicioDoDiaSeguinte };
}

/**
 * Dado um cliente já identificado pela ponte de biometria, encontra o atendimento de hoje mais
 * relevante — inclui os que já têm check-in, pra distinguir "sem agendamento hoje" de "já
 * confirmado". Chamado só por modules/biometria/bridge.ts, sem checagem de role própria (a
 * autorização é o segredo da ponte, validado na rota da API).
 */
export async function obterAgendamentoDoClienteHoje(clienteId: string, agora: Date) {
  const { inicioDoDia, inicioDoDiaSeguinte } = limitesDoDia(agora);

  const candidatos = await db
    .select({
      id: agendamento.id,
      inicio: agendamento.inicio,
      checkinEm: agendamento.checkinEm,
      servicoNome: servico.nome,
    })
    .from(agendamento)
    .innerJoin(servico, eq(servico.id, agendamento.servicoId))
    .where(
      and(
        eq(agendamento.clienteId, clienteId),
        eq(agendamento.status, "marcado"),
        gte(agendamento.inicio, inicioDoDia),
        lt(agendamento.inicio, inicioDoDiaSeguinte),
      ),
    );

  return escolherAgendamentoMaisProximo(candidatos, agora);
}

/**
 * Grava o check-in vindo do fluxo biométrico — mesmo efeito e mesmo guard idempotente de
 * confirmarPresenca (modules/agenda/actions.ts), só que chamado pela ponte em vez de uma sessão
 * de usuário. Retorna se realmente gravou (falso se o status mudou ou já tinha check-in entre a
 * leitura e a escrita).
 */
export async function confirmarPresencaViaBiometria(agendamentoId: string): Promise<boolean> {
  const gravados = await db
    .update(agendamento)
    .set({ checkinEm: new Date() })
    .where(
      and(
        eq(agendamento.id, agendamentoId),
        eq(agendamento.status, "marcado"),
        isNull(agendamento.checkinEm),
      ),
    )
    .returning({ id: agendamento.id });

  return gravados.length > 0;
}
