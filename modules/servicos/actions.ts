"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { criarServicoSchema, servico } from "./schema";

export type EstadoFormularioServico = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

export type EstadoExclusaoServico = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

const estadoInicial: EstadoFormularioServico = { status: "inicial" };
const estadoInicialExclusao: EstadoExclusaoServico = { status: "inicial" };
const servicoIdSchema = z.string().uuid("Serviço inválido.");

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function checkboxAtivo(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function parseFormularioServico(formData: FormData) {
  return criarServicoSchema.safeParse({
    nome: getValor(formData, "nome"),
    grupo: getValor(formData, "grupo"),
    descricao: getValor(formData, "descricao"),
    indicacao: getValor(formData, "indicacao"),
    contraindicacoes: getValor(formData, "contraindicacoes"),
    duracaoMinutos: getValor(formData, "duracaoMinutos"),
    periodicidade: getValor(formData, "periodicidade"),
    valorCentavos: getValor(formData, "valor"),
    preparo: getValor(formData, "preparo"),
    cuidadosPosteriores: getValor(formData, "cuidadosPosteriores"),
  });
}

export async function criarServico(_: EstadoFormularioServico = estadoInicial, formData: FormData) {
  const usuario = autorizarPapel(await auth(), ["profissional"]);
  const parsed = parseFormularioServico(formData);

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do serviço.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioServico;
  }

  await db.insert(servico).values({
    ...parsed.data,
    criadoPorId: usuario.id,
    atualizadoPorId: usuario.id,
  });

  revalidatePath("/painel/servicos");

  return {
    status: "sucesso",
    mensagem: "Serviço cadastrado com sucesso.",
  } satisfies EstadoFormularioServico;
}

export async function atualizarServico(
  _: EstadoFormularioServico = estadoInicial,
  formData: FormData,
) {
  const usuario = autorizarPapel(await auth(), ["profissional"]);
  const servicoId = servicoIdSchema.safeParse(getValor(formData, "id"));
  const parsed = parseFormularioServico(formData);

  if (!servicoId.success) {
    return {
      status: "erro",
      mensagem: "Serviço inválido.",
      campos: { id: servicoId.error.flatten().formErrors },
    } satisfies EstadoFormularioServico;
  }

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do serviço.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioServico;
  }

  const atualizados = await db
    .update(servico)
    .set({
      ...parsed.data,
      ativo: checkboxAtivo(getValor(formData, "ativo")),
      atualizadoPorId: usuario.id,
      atualizadoEm: new Date(),
    })
    .where(eq(servico.id, servicoId.data))
    .returning({ id: servico.id });

  if (atualizados.length === 0) {
    return {
      status: "erro",
      mensagem: "Serviço não encontrado.",
    } satisfies EstadoFormularioServico;
  }

  revalidatePath("/painel/servicos");

  return {
    status: "sucesso",
    mensagem: "Serviço atualizado com sucesso.",
  } satisfies EstadoFormularioServico;
}

export async function excluirServico(
  _: EstadoExclusaoServico = estadoInicialExclusao,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional"]);
  const servicoId = servicoIdSchema.safeParse(getValor(formData, "servicoId"));
  const exclusaoConfirmada = checkboxAtivo(getValor(formData, "confirmarExclusao"));

  if (!servicoId.success) {
    return {
      status: "erro",
      mensagem: "Serviço inválido.",
    } satisfies EstadoExclusaoServico;
  }

  if (!exclusaoConfirmada) {
    return {
      status: "erro",
      mensagem: "Confirme que entende a exclusão antes de continuar.",
    } satisfies EstadoExclusaoServico;
  }

  try {
    const excluidos = await db
      .delete(servico)
      .where(eq(servico.id, servicoId.data))
      .returning({ id: servico.id });

    if (excluidos.length === 0) {
      return {
        status: "erro",
        mensagem: "Serviço não encontrado.",
      } satisfies EstadoExclusaoServico;
    }
  } catch {
    return {
      status: "erro",
      mensagem:
        "Não foi possível excluir este serviço porque ele pode estar vinculado a agenda, pacotes, sessões ou fichas.",
    } satisfies EstadoExclusaoServico;
  }

  revalidatePath("/painel/servicos");

  return {
    status: "sucesso",
    mensagem: "Serviço excluído com sucesso.",
  } satisfies EstadoExclusaoServico;
}
