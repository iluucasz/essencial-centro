"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { notificarCliente } from "@/modules/notificacoes/criar-notificacao";

import { criarSessaoSchema, sessao } from "./schema";

export type EstadoFormularioSessao = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioSessao = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function checkboxAtivo(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function criarSessao(_: EstadoFormularioSessao = estadoInicial, formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarSessaoSchema.safeParse({
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
    presencaConfirmada: checkboxAtivo(getValor(formData, "presencaConfirmada")),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da sessão.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioSessao;
  }

  await db.insert(sessao).values({
    ...parsed.data,
    profissionalId: usuarioAtual.id,
    criadoPorId: usuarioAtual.id,
    atualizadoPorId: usuarioAtual.id,
  });

  if (parsed.data.orientacoesPosAtendimento) {
    await notificarCliente({
      clienteId: parsed.data.clienteId,
      tipo: "sessao_concluida",
      titulo: "Novas orientações do seu atendimento",
      mensagem: parsed.data.orientacoesPosAtendimento,
      link: "/portal/sessoes",
    });
  }

  revalidatePath(`/painel/clientes/${parsed.data.clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Sessão registrada com sucesso.",
  } satisfies EstadoFormularioSessao;
}
