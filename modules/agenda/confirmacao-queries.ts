import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { cliente } from "@/modules/clientes/schema";
import { pacote } from "@/modules/pacotes/schema";
import { servico } from "@/modules/servicos/schema";

import { agendamento } from "./schema";

/**
 * Carrega o contrato pelo token de confirmação — SEM sessão, porque o cliente abre o link direto do
 * WhatsApp. A autorização é o próprio token (24 bytes aleatórios, único, com expiração); a página
 * decide o que mostrar por `situacaoDoContrato`.
 *
 * Retorna só o que a página precisa: nome do cliente, serviço e a lista de sessões. Nada de valor
 * pago, observações do contrato ou qualquer dado clínico — o link é público por natureza.
 */
export async function obterContratoPorTokenConfirmacao(token: string) {
  const [contrato] = await db
    .select({
      contratoId: pacote.id,
      clienteId: pacote.clienteId,
      clienteNome: cliente.nome,
      servicoNome: servico.nome,
      tokenConfirmacao: pacote.tokenConfirmacao,
      tokenExpiraEm: pacote.tokenExpiraEm,
      confirmadoEm: pacote.confirmadoEm,
      recusadoEm: pacote.recusadoEm,
    })
    .from(pacote)
    .innerJoin(cliente, eq(pacote.clienteId, cliente.id))
    .innerJoin(servico, eq(pacote.servicoId, servico.id))
    .where(eq(pacote.tokenConfirmacao, token))
    .limit(1);

  if (!contrato) return null;

  const sessoes = await db
    .select({
      id: agendamento.id,
      inicio: agendamento.inicio,
      duracaoMinutos: agendamento.duracaoMinutos,
      status: agendamento.status,
    })
    .from(agendamento)
    .where(eq(agendamento.pacoteId, contrato.contratoId))
    .orderBy(asc(agendamento.inicio));

  return { ...contrato, sessoes };
}
