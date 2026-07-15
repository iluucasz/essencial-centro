"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { notificarCliente } from "@/modules/notificacoes/criar-notificacao";
import { deveAvisarPacoteAcabando } from "@/modules/pacotes/progresso";
import { obterProgressoPacote } from "@/modules/pacotes/queries";
import { servico } from "@/modules/servicos/schema";

import { listarAgendamentosDoProfissionalNoDia } from "./queries";
import { agendamento, atualizarStatusAgendamentoSchema, criarAgendamentoSchema } from "./schema";
import { encontrarConflito } from "./sobreposicao";

export type EstadoFormularioAgendamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioAgendamento = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
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
    observacoes: getValor(formData, "observacoes"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do agendamento.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioAgendamento;
  }

  const { clienteId, servicoId, profissionalId, pacoteId, inicio, duracaoMinutos, observacoes } =
    parsed.data;

  const agendamentosDoDia = await listarAgendamentosDoProfissionalNoDia(profissionalId, inicio);
  const conflito = encontrarConflito({ inicio, duracaoMinutos }, agendamentosDoDia);

  if (conflito) {
    return {
      status: "erro",
      mensagem: "A profissional já tem um agendamento marcado nesse horário.",
    } satisfies EstadoFormularioAgendamento;
  }

  await db.insert(agendamento).values({
    clienteId,
    servicoId,
    profissionalId,
    pacoteId,
    inicio,
    duracaoMinutos,
    observacoes,
    criadoPorId: usuarioAtual.id,
    atualizadoPorId: usuarioAtual.id,
  });

  const [servicoAgendado] = await db
    .select({ nome: servico.nome })
    .from(servico)
    .where(eq(servico.id, servicoId))
    .limit(1);

  await notificarCliente({
    clienteId,
    tipo: "agendamento_criado",
    titulo: "Atendimento marcado",
    mensagem: `Seu atendimento de ${servicoAgendado?.nome ?? "serviço"} está marcado para ${new Intl.DateTimeFormat(
      "pt-BR",
      { dateStyle: "long", timeStyle: "short", timeZone: "UTC" },
    ).format(inicio)}.`,
    link: "/portal/agendamentos",
  });

  revalidatePath("/painel/agenda");

  return {
    status: "sucesso",
    mensagem: "Agendamento criado com sucesso.",
  } satisfies EstadoFormularioAgendamento;
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
    .returning({ pacoteId: agendamento.pacoteId });

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
