"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import QRCode from "qrcode";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { notificarCliente } from "@/modules/notificacoes/criar-notificacao";
import { deveAvisarPacoteAcabando } from "@/modules/pacotes/progresso";
import { obterProgressoPacote } from "@/modules/pacotes/queries";
import { servico } from "@/modules/servicos/schema";

import { urlCheckin } from "./checkin-url";
import { mensagemAtendimentoCancelado, mensagemAtendimentoMarcado } from "./mensagem-notificacao";
import { listarAgendamentosDoProfissionalNoDia } from "./queries";
import {
  agendamento,
  atualizarAgendamentoSchema,
  atualizarStatusAgendamentoSchema,
  criarAgendamentoSchema,
} from "./schema";
import { encontrarConflito } from "./sobreposicao";

export type EstadoFormularioAgendamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

export type EstadoExclusaoAgendamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

const estadoInicial: EstadoFormularioAgendamento = { status: "inicial" };
const estadoInicialExclusao: EstadoExclusaoAgendamento = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

async function nomeDoServico(servicoId: string) {
  const [registro] = await db
    .select({ nome: servico.nome })
    .from(servico)
    .where(eq(servico.id, servicoId))
    .limit(1);

  return registro?.nome ?? "serviço";
}

/** QR de presença de um agendamento em base64 puro (sem prefixo data:), pra anexar no WhatsApp. */
async function qrCheckinBase64(agendamentoId: string) {
  const dataUrl = await QRCode.toDataURL(await urlCheckin(agendamentoId), {
    margin: 1,
    width: 320,
  });

  return dataUrl.split(",")[1] ?? "";
}

export async function criarAgendamento(
  _: EstadoFormularioAgendamento = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = criarAgendamentoSchema.safeParse({
    clienteId: getValor(formData, "clienteId"),
    servicoId: getValor(formData, "servicoId"),
    profissionalId: getValor(formData, "profissionalId"),
    pacoteId: getValor(formData, "pacoteId"),
    inicio: getValor(formData, "inicio"),
    duracaoMinutos: getValor(formData, "duracaoMinutos"),
    modalidade: getValor(formData, "modalidade") || undefined,
    observacoes: getValor(formData, "observacoes"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do agendamento.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioAgendamento;
  }

  const {
    clienteId,
    servicoId,
    profissionalId,
    pacoteId,
    inicio,
    duracaoMinutos,
    modalidade,
    observacoes,
  } = parsed.data;

  const agendamentosDoDia = await listarAgendamentosDoProfissionalNoDia(profissionalId, inicio);
  const conflito = encontrarConflito({ inicio, duracaoMinutos }, agendamentosDoDia);

  if (conflito) {
    return {
      status: "erro",
      mensagem: "A profissional já tem um agendamento marcado nesse horário.",
    } satisfies EstadoFormularioAgendamento;
  }

  const [criado] = await db
    .insert(agendamento)
    .values({
      clienteId,
      servicoId,
      profissionalId,
      pacoteId,
      inicio,
      duracaoMinutos,
      modalidade,
      observacoes,
      criadoPorId: usuarioAtual.id,
      atualizadoPorId: usuarioAtual.id,
    })
    .returning({ id: agendamento.id });

  await notificarCliente({
    clienteId,
    tipo: "agendamento_criado",
    titulo: "Atendimento marcado",
    mensagem: mensagemAtendimentoMarcado(await nomeDoServico(servicoId), inicio),
    link: "/portal/agendamentos",
    whatsappImagemBase64: criado ? await qrCheckinBase64(criado.id) : undefined,
  });

  revalidatePath("/painel/agenda");
  revalidatePath(`/painel/clientes/${clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Agendamento criado com sucesso.",
  } satisfies EstadoFormularioAgendamento;
}

export async function atualizarAgendamento(
  _: EstadoFormularioAgendamento = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = atualizarAgendamentoSchema.safeParse({
    id: getValor(formData, "id"),
    clienteId: getValor(formData, "clienteId"),
    servicoId: getValor(formData, "servicoId"),
    profissionalId: getValor(formData, "profissionalId"),
    pacoteId: getValor(formData, "pacoteId"),
    inicio: getValor(formData, "inicio"),
    duracaoMinutos: getValor(formData, "duracaoMinutos"),
    modalidade: getValor(formData, "modalidade") || undefined,
    observacoes: getValor(formData, "observacoes"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do agendamento.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioAgendamento;
  }

  const { id, clienteId, servicoId, profissionalId, pacoteId, inicio, duracaoMinutos } =
    parsed.data;

  const agendamentosDoDia = await listarAgendamentosDoProfissionalNoDia(profissionalId, inicio);
  const conflito = encontrarConflito(
    { inicio, duracaoMinutos },
    agendamentosDoDia.filter((item) => item.id !== id),
  );

  if (conflito) {
    return {
      status: "erro",
      mensagem: "A profissional já tem um agendamento marcado nesse horário.",
    } satisfies EstadoFormularioAgendamento;
  }

  const [anterior] = await db
    .select({ inicio: agendamento.inicio })
    .from(agendamento)
    .where(eq(agendamento.id, id))
    .limit(1);

  const atualizados = await db
    .update(agendamento)
    .set({
      clienteId,
      servicoId,
      profissionalId,
      pacoteId,
      inicio,
      duracaoMinutos,
      modalidade: parsed.data.modalidade,
      observacoes: parsed.data.observacoes,
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
    })
    .where(eq(agendamento.id, id))
    .returning({ id: agendamento.id });

  if (atualizados.length === 0) {
    return {
      status: "erro",
      mensagem: "Agendamento não encontrado.",
    } satisfies EstadoFormularioAgendamento;
  }

  if (anterior && anterior.inicio.getTime() !== inicio.getTime()) {
    await notificarCliente({
      clienteId,
      tipo: "geral",
      titulo: "Atendimento remarcado",
      mensagem: mensagemAtendimentoMarcado(await nomeDoServico(servicoId), inicio, true),
      link: "/portal/agendamentos",
      whatsappImagemBase64: await qrCheckinBase64(id),
    });
  }

  revalidatePath("/painel/agenda");
  revalidatePath(`/painel/clientes/${clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Agendamento atualizado com sucesso.",
  } satisfies EstadoFormularioAgendamento;
}

export async function excluirAgendamento(
  _: EstadoExclusaoAgendamento = estadoInicialExclusao,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const id = getValor(formData, "id");
  const clienteId = getValor(formData, "clienteId");
  const exclusaoConfirmada = getValor(formData, "confirmarExclusao");

  if (typeof id !== "string") {
    return {
      status: "erro",
      mensagem: "Agendamento inválido.",
    } satisfies EstadoExclusaoAgendamento;
  }

  if (exclusaoConfirmada !== "true") {
    return {
      status: "erro",
      mensagem: "Confirme que entende a exclusão antes de continuar.",
    } satisfies EstadoExclusaoAgendamento;
  }

  const [aExcluir] = await db
    .select({
      clienteId: agendamento.clienteId,
      servicoId: agendamento.servicoId,
      inicio: agendamento.inicio,
    })
    .from(agendamento)
    .where(eq(agendamento.id, id))
    .limit(1);

  const excluidos = await db
    .delete(agendamento)
    .where(eq(agendamento.id, id))
    .returning({ id: agendamento.id });

  if (excluidos.length === 0) {
    return {
      status: "erro",
      mensagem: "Agendamento não encontrado.",
    } satisfies EstadoExclusaoAgendamento;
  }

  if (aExcluir) {
    await notificarCliente({
      clienteId: aExcluir.clienteId,
      tipo: "geral",
      titulo: "Atendimento cancelado",
      mensagem: mensagemAtendimentoCancelado(
        await nomeDoServico(aExcluir.servicoId),
        aExcluir.inicio,
      ),
      link: "/portal/agendamentos",
    });
  }

  revalidatePath("/painel/agenda");
  if (typeof clienteId === "string") {
    revalidatePath(`/painel/clientes/${clienteId}`);
  }

  return {
    status: "sucesso",
    mensagem: "Agendamento excluído com sucesso.",
  } satisfies EstadoExclusaoAgendamento;
}

export async function atualizarStatusAgendamento(formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = atualizarStatusAgendamentoSchema.safeParse({
    id: getValor(formData, "id"),
    status: getValor(formData, "status"),
  });

  if (!parsed.success) return;

  const [atualizado] = await db
    .update(agendamento)
    .set({
      status: parsed.data.status,
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
    })
    .where(eq(agendamento.id, parsed.data.id))
    .returning({
      pacoteId: agendamento.pacoteId,
      clienteId: agendamento.clienteId,
      servicoId: agendamento.servicoId,
      inicio: agendamento.inicio,
    });

  if (parsed.data.status === "cancelado" && atualizado) {
    await notificarCliente({
      clienteId: atualizado.clienteId,
      tipo: "geral",
      titulo: "Atendimento cancelado",
      mensagem: mensagemAtendimentoCancelado(
        await nomeDoServico(atualizado.servicoId),
        atualizado.inicio,
      ),
      link: "/portal/agendamentos",
    });
  }

  if (parsed.data.status === "realizado" && atualizado?.pacoteId) {
    const info = await obterProgressoPacote(atualizado.pacoteId);

    if (info && deveAvisarPacoteAcabando(info.progresso.sessoesRestantes)) {
      const acabou = info.progresso.sessoesRestantes === 0;

      await notificarCliente({
        clienteId: info.clienteId,
        tipo: "pacote_acabando",
        titulo: acabou ? "Pacote concluído" : "Última sessão do seu pacote",
        mensagem: acabou
          ? "Você concluiu todas as sessões do seu pacote. Fale com a gente para renovar!"
          : "Você tem apenas 1 sessão restante no seu pacote atual.",
        link: "/portal/evolucao",
      });
    }
  }

  revalidatePath("/painel/agenda");
  if (atualizado?.clienteId) {
    revalidatePath(`/painel/clientes/${atualizado.clienteId}`);
  }
}

/** Confirma presença (chegada na clínica) — destino do QR Code mostrado ao cliente no portal. */
export async function confirmarPresenca(formData: FormData) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const id = getValor(formData, "id");
  if (typeof id !== "string") return;

  await db
    .update(agendamento)
    .set({ checkinEm: new Date() })
    .where(
      and(eq(agendamento.id, id), eq(agendamento.status, "marcado"), isNull(agendamento.checkinEm)),
    );

  revalidatePath("/painel/agenda");
  revalidatePath(`/painel/checkin/${id}`);
}
