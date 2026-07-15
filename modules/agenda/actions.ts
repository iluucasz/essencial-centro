"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

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

  await db
    .update(agendamento)
    .set({
      status: parsed.data.status,
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
    })
    .where(eq(agendamento.id, parsed.data.id));

  revalidatePath("/painel/agenda");
}
