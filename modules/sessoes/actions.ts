"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { agendamento } from "@/modules/agenda/schema";
import { autorizarEscrita } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";
import { notificarCliente } from "@/modules/notificacoes/criar-notificacao";
import { urlBaseNotificacoes } from "@/modules/notificacoes/email";
import { enviarWhatsAppTexto } from "@/modules/notificacoes/whatsapp";
import { pacote } from "@/modules/pacotes/schema";

import { caminhoPortalSessao, montarNotificacaoSessaoConcluida } from "./notificacao";
import { criarSessaoSchema, editarSessaoSchema, sessao } from "./schema";

export type EstadoFormularioSessao = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

export type EstadoExclusaoSessao =
  { status: "inicial" } | { status: "sucesso" } | { status: "erro"; mensagem: string };

export type EstadoEnvioWhatsAppSessao =
  { status: "inicial" } | { status: "sucesso" } | { status: "erro"; mensagem: string };

const estadoInicial: EstadoFormularioSessao = { status: "inicial" };

const excluirSessaoSchema = z.object({
  id: z.string().uuid("Sessão inválida."),
  clienteId: z.string().uuid("Cliente inválido."),
  confirmarExclusao: z.literal("true", {
    error: "Confirme que entende que a exclusão não pode ser desfeita.",
  }),
});

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function lerDadosSessao(formData: FormData) {
  return {
    id: getValor(formData, "id"),
    clienteId: getValor(formData, "clienteId"),
    servicoId: getValor(formData, "servicoId"),
    agendamentoId: getValor(formData, "agendamentoId"),
    pacoteId: getValor(formData, "pacoteId"),
    duracaoMinutos: getValor(formData, "duracaoMinutos"),
    regiaoTratada: getValor(formData, "regiaoTratada"),
    condicaoAntes: getValor(formData, "condicaoAntes"),
    relatoCliente: getValor(formData, "relatoCliente"),
    escalaDorAntes: getValor(formData, "escalaDorAntes"),
    escalaDorDepois: getValor(formData, "escalaDorDepois"),
    avaliacaoProfissional: getValor(formData, "avaliacaoProfissional"),
    equipamentosUtilizados: getValor(formData, "equipamentosUtilizados"),
    parametrosUtilizados: getValor(formData, "parametrosUtilizados"),
    produtosAplicados: getValor(formData, "produtosAplicados"),
    reacoesObservadas: getValor(formData, "reacoesObservadas"),
    observacoesInternas: getValor(formData, "observacoesInternas"),
    orientacoesPosAtendimento: getValor(formData, "orientacoesPosAtendimento"),
    proximaSessaoRecomendada: getValor(formData, "proximaSessaoRecomendada"),
    presencaConfirmada: true,
  };
}

type DadosSessaoValidados = {
  agendamentoId?: string;
  clienteId: string;
  servicoId: string;
  pacoteId?: string;
  duracaoMinutos?: number;
};

async function prepararVinculosSessao<TDados extends DadosSessaoValidados>(
  dados: TDados,
  sessaoIdAtual?: string,
) {
  if (dados.agendamentoId) {
    const [registro] = await db
      .select({
        id: agendamento.id,
        clienteId: agendamento.clienteId,
        servicoId: agendamento.servicoId,
        pacoteId: agendamento.pacoteId,
        inicio: agendamento.inicio,
        duracaoMinutos: agendamento.duracaoMinutos,
        status: agendamento.status,
      })
      .from(agendamento)
      .where(
        and(eq(agendamento.id, dados.agendamentoId), eq(agendamento.clienteId, dados.clienteId)),
      )
      .limit(1);

    if (!registro) {
      return { erro: "Atendimento vinculado não pertence a este cliente." };
    }

    if (registro.status !== "realizado") {
      return { erro: "Registre a sessão apenas depois de concluir o atendimento." };
    }

    const [sessaoExistente] = await db
      .select({ id: sessao.id })
      .from(sessao)
      .where(eq(sessao.agendamentoId, dados.agendamentoId))
      .limit(1);

    if (sessaoExistente && sessaoExistente.id !== sessaoIdAtual) {
      return { erro: "Este atendimento já possui uma sessão registrada." };
    }

    return {
      dados: {
        ...dados,
        servicoId: registro.servicoId,
        pacoteId: registro.pacoteId ?? undefined,
        duracaoMinutos: dados.duracaoMinutos ?? registro.duracaoMinutos,
      },
      dataHora: registro.inicio,
    };
  }

  if (dados.pacoteId) {
    const [registro] = await db
      .select({ id: pacote.id })
      .from(pacote)
      .where(and(eq(pacote.id, dados.pacoteId), eq(pacote.clienteId, dados.clienteId)))
      .limit(1);

    if (!registro) return { erro: "Pacote vinculado não pertence a este cliente." };
  }

  return { dados };
}

export async function criarSessao(_: EstadoFormularioSessao = estadoInicial, formData: FormData) {
  const usuarioAtual = autorizarEscrita(await auth(), ["profissional"]);

  const parsed = criarSessaoSchema.safeParse(lerDadosSessao(formData));

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da sessão.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioSessao;
  }

  const vinculos = await prepararVinculosSessao(parsed.data);

  if ("erro" in vinculos) {
    return {
      status: "erro",
      mensagem: vinculos.erro,
    } satisfies EstadoFormularioSessao;
  }

  const [sessaoCriada] = await db
    .insert(sessao)
    .values({
      ...vinculos.dados,
      dataHora: "dataHora" in vinculos ? vinculos.dataHora : undefined,
      profissionalId: usuarioAtual.id,
      criadoPorId: usuarioAtual.id,
      atualizadoPorId: usuarioAtual.id,
    })
    .returning({ id: sessao.id });

  // Reforço automático (in-app + e-mail + WhatsApp) sempre que a sessão é registrada — não só
  // quando há orientações, senão a cliente nunca fica sabendo que o atendimento foi registrado.
  const { titulo, mensagem } = montarNotificacaoSessaoConcluida({
    regiaoTratada: parsed.data.regiaoTratada ?? null,
    escalaDorAntes: parsed.data.escalaDorAntes ?? null,
    escalaDorDepois: parsed.data.escalaDorDepois ?? null,
    orientacoesPosAtendimento: parsed.data.orientacoesPosAtendimento ?? null,
  });
  const resultadoNotificacao = await notificarCliente({
    clienteId: vinculos.dados.clienteId,
    tipo: "sessao_concluida",
    titulo,
    mensagem,
    link: caminhoPortalSessao(sessaoCriada.id),
  });

  if (resultadoNotificacao.whatsapp.sent) {
    await db
      .update(sessao)
      .set({ whatsappEnviadoEm: new Date() })
      .where(eq(sessao.id, sessaoCriada.id));
  }

  revalidatePath(`/painel/clientes/${vinculos.dados.clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Sessão registrada com sucesso.",
  } satisfies EstadoFormularioSessao;
}

export async function atualizarSessao(
  _: EstadoFormularioSessao = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarEscrita(await auth(), ["profissional"]);

  const parsed = editarSessaoSchema.safeParse(lerDadosSessao(formData));

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da sessão.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioSessao;
  }

  const { id, ...dados } = parsed.data;
  const [registro] = await db.select().from(sessao).where(eq(sessao.id, id)).limit(1);

  if (!registro || registro.clienteId !== dados.clienteId) {
    return { status: "erro", mensagem: "Sessão não encontrada." } satisfies EstadoFormularioSessao;
  }

  const vinculos = await prepararVinculosSessao(dados, id);

  if ("erro" in vinculos) {
    return {
      status: "erro",
      mensagem: vinculos.erro,
    } satisfies EstadoFormularioSessao;
  }

  await db
    .update(sessao)
    .set({
      clienteId: vinculos.dados.clienteId,
      servicoId: vinculos.dados.servicoId,
      agendamentoId: vinculos.dados.agendamentoId ?? null,
      pacoteId: vinculos.dados.pacoteId ?? null,
      dataHora: "dataHora" in vinculos ? vinculos.dataHora : registro.dataHora,
      duracaoMinutos: vinculos.dados.duracaoMinutos ?? null,
      regiaoTratada: dados.regiaoTratada ?? null,
      condicaoAntes: dados.condicaoAntes ?? null,
      relatoCliente: dados.relatoCliente ?? null,
      escalaDorAntes: dados.escalaDorAntes ?? null,
      escalaDorDepois: dados.escalaDorDepois ?? null,
      avaliacaoProfissional: dados.avaliacaoProfissional ?? null,
      equipamentosUtilizados: dados.equipamentosUtilizados ?? null,
      parametrosUtilizados: dados.parametrosUtilizados ?? null,
      produtosAplicados: dados.produtosAplicados ?? null,
      reacoesObservadas: dados.reacoesObservadas ?? null,
      observacoesInternas: dados.observacoesInternas ?? null,
      orientacoesPosAtendimento: dados.orientacoesPosAtendimento ?? null,
      proximaSessaoRecomendada: dados.proximaSessaoRecomendada ?? null,
      presencaConfirmada: dados.presencaConfirmada,
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
    })
    .where(eq(sessao.id, id));

  revalidatePath(`/painel/clientes/${dados.clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Sessão atualizada com sucesso.",
  } satisfies EstadoFormularioSessao;
}

export async function excluirSessao(
  _estado: EstadoExclusaoSessao,
  formData: FormData,
): Promise<EstadoExclusaoSessao> {
  autorizarEscrita(await auth(), ["profissional"]);

  const parsed = excluirSessaoSchema.safeParse({
    id: getValor(formData, "id"),
    clienteId: getValor(formData, "clienteId"),
    confirmarExclusao: getValor(formData, "confirmarExclusao"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem:
        parsed.error.issues[0]?.message ??
        "Confirme que entende que a exclusão não pode ser desfeita.",
    };
  }

  const { clienteId, id } = parsed.data;
  const [registro] = await db.select().from(sessao).where(eq(sessao.id, id)).limit(1);

  if (!registro || registro.clienteId !== clienteId) {
    return { status: "erro", mensagem: "Sessão não encontrada." };
  }

  await db.delete(sessao).where(eq(sessao.id, id));

  revalidatePath(`/painel/clientes/${clienteId}`);

  return { status: "sucesso" };
}

const reenviarWhatsAppSchema = z.object({ id: z.string().uuid("Sessão inválida.") });

/**
 * Botão manual de "(re)enviar por WhatsApp" — dispara só o canal WhatsApp, direto (sem passar por
 * `notificarCliente`), pra não duplicar a notificação in-app/e-mail que já aconteceu (ou deveria
 * ter acontecido) no envio automático de `criarSessao`. Cobre os dois casos do pedido: reenviar de
 * propósito, ou enviar pela primeira vez quando o disparo automático falhou.
 */
export async function reenviarSessaoWhatsApp(
  _estado: EstadoEnvioWhatsAppSessao,
  formData: FormData,
): Promise<EstadoEnvioWhatsAppSessao> {
  autorizarEscrita(await auth(), ["profissional"]);

  const parsed = reenviarWhatsAppSchema.safeParse({ id: getValor(formData, "id") });

  if (!parsed.success) {
    return { status: "erro", mensagem: "Sessão inválida." };
  }

  const [registro] = await db
    .select({
      id: sessao.id,
      clienteId: sessao.clienteId,
      regiaoTratada: sessao.regiaoTratada,
      escalaDorAntes: sessao.escalaDorAntes,
      escalaDorDepois: sessao.escalaDorDepois,
      orientacoesPosAtendimento: sessao.orientacoesPosAtendimento,
    })
    .from(sessao)
    .where(eq(sessao.id, parsed.data.id))
    .limit(1);

  if (!registro) {
    return { status: "erro", mensagem: "Sessão não encontrada." };
  }

  const [registroCliente] = await db
    .select({ telefone: cliente.telefone })
    .from(cliente)
    .where(eq(cliente.id, registro.clienteId))
    .limit(1);

  if (!registroCliente?.telefone) {
    return { status: "erro", mensagem: "Esta cliente não tem telefone cadastrado." };
  }

  const { titulo, mensagem } = montarNotificacaoSessaoConcluida(registro);
  const link = `${urlBaseNotificacoes()}${caminhoPortalSessao(registro.id)}`;

  const resultado = await enviarWhatsAppTexto({
    telefone: registroCliente.telefone,
    mensagem: `${titulo}\n\n${mensagem}\n\n${link}`,
  });

  if (!resultado.sent) {
    return {
      status: "erro",
      mensagem: resultado.error ?? "Não foi possível enviar pelo WhatsApp agora.",
    };
  }

  await db.update(sessao).set({ whatsappEnviadoEm: new Date() }).where(eq(sessao.id, registro.id));

  revalidatePath(`/painel/clientes/${registro.clienteId}`);

  return { status: "sucesso" };
}
