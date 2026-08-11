"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";
import { servico } from "@/modules/servicos/schema";
import { notificarCliente } from "@/modules/notificacoes/criar-notificacao";
import { pacote } from "@/modules/pacotes/schema";

import {
  STATUS_INICIAL_AGENDAMENTO,
  expiracaoTokenConfirmacao,
  gerarTokenConfirmacao,
  mensagemConfirmadoComSucesso,
  mensagemPedidoConfirmacao,
  mensagemRecusaRegistrada,
  podeResponder,
  responderConfirmacaoSchema,
  situacaoDoContrato,
} from "./confirmacao";
import { urlConfirmacaoContrato } from "./confirmacao-url";
import { obterContratoPorTokenConfirmacao } from "./confirmacao-queries";
import { agendamento, statusQueOcupamAgenda } from "./schema";

export type ResultadoConfirmacao =
  | { status: "inicial" }
  | { status: "confirmado" }
  | { status: "recusado" }
  | { status: "erro"; mensagem: string };

/**
 * Resposta do cliente ao link de confirmação. Sem sessão: a autorização é o token, igual à ficha
 * pública. Não chamar `revalidatePath` aqui — dentro da Server Action ele re-renderizaria a própria
 * página pública na mesma resposta e trocaria a tela de resultado (ver `enviarFichaPublica`).
 */
export async function responderConfirmacao(
  _estado: ResultadoConfirmacao,
  formData: FormData,
): Promise<ResultadoConfirmacao> {
  const parsed = responderConfirmacaoSchema.safeParse({
    token: formData.get("token"),
    resposta: formData.get("resposta"),
    motivo: formData.get("motivo"),
  });

  if (!parsed.success) {
    return { status: "erro", mensagem: "Não foi possível registrar sua resposta." };
  }

  const { token, resposta, motivo } = parsed.data;
  const contrato = await obterContratoPorTokenConfirmacao(token);

  if (!contrato) return { status: "erro", mensagem: "Este link não foi encontrado." };

  const situacao = situacaoDoContrato(contrato);

  if (!podeResponder(situacao)) {
    return {
      status: "erro",
      mensagem:
        situacao.estado === "expirado"
          ? "Este link expirou. Fale com a clínica para receber um novo."
          : "Esta resposta já foi registrada.",
    };
  }

  const agora = new Date();
  const confirmou = resposta === "confirmar";

  /*
    WHERE amarrado ao estado anterior nos dois updates: em duplo clique ou dois cliques do mesmo link
    em abas diferentes, a segunda tentativa não encontra nada pra atualizar em vez de sobrescrever a
    resposta já dada. Só mexe em sessões que ainda estão aguardando — se a clínica já cancelou uma
    delas nesse meio-tempo, o cancelamento continua valendo.
  */
  const contratoAtualizado = await db
    .update(pacote)
    .set(
      confirmou
        ? { confirmadoEm: agora, atualizadoEm: agora }
        : { recusadoEm: agora, motivoRecusa: motivo ?? null, atualizadoEm: agora },
    )
    .where(
      and(
        eq(pacote.id, contrato.contratoId),
        eq(pacote.tokenConfirmacao, token),
        // Ainda sem resposta: é isso que torna o update idempotente.
        isNull(pacote.confirmadoEm),
        isNull(pacote.recusadoEm),
      ),
    )
    .returning({ id: pacote.id });

  if (contratoAtualizado.length === 0) {
    return { status: "erro", mensagem: "Esta resposta já foi registrada." };
  }

  await db
    .update(agendamento)
    .set({
      status: confirmou ? "marcado" : "recusado",
      atualizadoEm: agora,
    })
    .where(
      and(
        eq(agendamento.pacoteId, contrato.contratoId),
        eq(agendamento.status, STATUS_INICIAL_AGENDAMENTO),
      ),
    );

  const primeiroNome = contrato.clienteNome.trim().split(/\s+/)[0] ?? contrato.clienteNome;
  const sessoes = contrato.sessoes.map(({ inicio, duracaoMinutos }) => ({
    inicio,
    duracaoMinutos,
  }));

  await notificarCliente({
    clienteId: contrato.clienteId,
    tipo: "agendamento_criado",
    titulo: confirmou ? "Atendimentos confirmados" : "Recusa registrada",
    mensagem: confirmou
      ? mensagemConfirmadoComSucesso({ primeiroNome, sessoes })
      : mensagemRecusaRegistrada(primeiroNome),
    link: "/portal/agendamentos",
  });

  return { status: confirmou ? "confirmado" : "recusado" };
}

export type ResultadoReenvio =
  | { status: "inicial" }
  | { status: "sucesso"; mensagem: string }
  | { status: "erro"; mensagem: string };

const reenviarSchema = z.object({ agendamentoId: z.string().uuid("Agendamento inválido.") });

/**
 * Reenvia o pedido de confirmação pelo painel — para quando o WhatsApp caiu no primeiro envio ou o
 * cliente perdeu a mensagem. Gera um token NOVO (o antigo deixa de valer) e renova o prazo, então
 * serve também para revalidar um link já expirado.
 */
export async function reenviarPedidoConfirmacao(
  _estado: ResultadoReenvio,
  formData: FormData,
): Promise<ResultadoReenvio> {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = reenviarSchema.safeParse({ agendamentoId: formData.get("agendamentoId") });

  if (!parsed.success) return { status: "erro", mensagem: "Agendamento inválido." };

  const [alvo] = await db
    .select({ pacoteId: agendamento.pacoteId })
    .from(agendamento)
    .where(eq(agendamento.id, parsed.data.agendamentoId))
    .limit(1);

  if (!alvo?.pacoteId) {
    return { status: "erro", mensagem: "Este agendamento não faz parte de um contrato." };
  }

  const [contrato] = await db
    .select({
      clienteId: pacote.clienteId,
      clienteNome: cliente.nome,
      servicoNome: servico.nome,
      confirmadoEm: pacote.confirmadoEm,
    })
    .from(pacote)
    .innerJoin(cliente, eq(cliente.id, pacote.clienteId))
    .innerJoin(servico, eq(servico.id, pacote.servicoId))
    .where(eq(pacote.id, alvo.pacoteId))
    .limit(1);

  if (!contrato) return { status: "erro", mensagem: "Contrato não encontrado." };

  if (contrato.confirmadoEm) {
    return { status: "erro", mensagem: "Este contrato já foi confirmado pelo cliente." };
  }

  const sessoes = await db
    .select({ inicio: agendamento.inicio, duracaoMinutos: agendamento.duracaoMinutos })
    .from(agendamento)
    .where(
      and(
        eq(agendamento.pacoteId, alvo.pacoteId),
        inArray(agendamento.status, statusQueOcupamAgenda),
      ),
    )
    .orderBy(asc(agendamento.inicio));

  if (sessoes.length === 0) {
    return { status: "erro", mensagem: "Não há sessões ativas para confirmar." };
  }

  const agora = new Date();
  const token = gerarTokenConfirmacao();

  /*
    Recusa anterior é limpa junto: reenviar é dar ao cliente uma nova chance de responder, e um
    `recusadoEm` remanescente faria a página abrir em "recusa já registrada".
  */
  await db
    .update(pacote)
    .set({
      tokenConfirmacao: token,
      tokenExpiraEm: expiracaoTokenConfirmacao(agora),
      confirmacaoEnviadaEm: agora,
      recusadoEm: null,
      motivoRecusa: null,
      atualizadoEm: agora,
    })
    .where(eq(pacote.id, alvo.pacoteId));

  // As sessões voltam a aguardar: se a recusa já as tinha levado pra `recusado`, elas revivem.
  await db
    .update(agendamento)
    .set({ status: STATUS_INICIAL_AGENDAMENTO, atualizadoEm: agora })
    .where(and(eq(agendamento.pacoteId, alvo.pacoteId), eq(agendamento.status, "recusado")));

  const primeiroNome = contrato.clienteNome.trim().split(/\s+/)[0] ?? contrato.clienteNome;

  const envio = await notificarCliente({
    clienteId: contrato.clienteId,
    tipo: "agendamento_criado",
    titulo: "Confirme seus atendimentos",
    mensagem: mensagemPedidoConfirmacao({
      primeiroNome,
      servicoNome: contrato.servicoNome,
      sessoes,
      url: await urlConfirmacaoContrato(token),
    }),
    link: "/portal/agendamentos",
  });

  revalidatePath("/painel/agenda");
  revalidatePath(`/painel/clientes/${contrato.clienteId}`);

  /*
    O link já vale, mesmo que o WhatsApp tenha falhado — daí a distinção: se o canal não enviou, a
    profissional precisa saber pra avisar o cliente por outro meio em vez de esperar uma resposta.
  */
  if (envio.whatsapp.sent) {
    return { status: "sucesso", mensagem: "Pedido de confirmação reenviado no WhatsApp." };
  }

  return {
    status: "erro",
    mensagem: envio.whatsapp.attempted
      ? "Link renovado, mas o WhatsApp não pôde ser enviado. Verifique a conexão da instância."
      : "Link renovado, mas o cliente não tem WhatsApp cadastrado ou conta no portal.",
  };
}
