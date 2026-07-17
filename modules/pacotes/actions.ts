"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { criarPacoteSchema, pacote } from "./schema";

export type EstadoFormularioPacote = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

export type EstadoExclusaoPacote = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

const estadoInicial: EstadoFormularioPacote = { status: "inicial" };
const estadoInicialExclusao: EstadoExclusaoPacote = { status: "inicial" };
const pacoteIdSchema = z.string().uuid("Pacote inválido.");

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function checkboxAtivo(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function parseFormularioPacote(formData: FormData) {
  return criarPacoteSchema.safeParse({
    clienteId: getValor(formData, "clienteId"),
    servicoId: getValor(formData, "servicoId"),
    quantidadeSessoes: getValor(formData, "quantidadeSessoes"),
    validade: getValor(formData, "validade"),
    valorCentavos: getValor(formData, "valor"),
    formaPagamento: getValor(formData, "formaPagamento"),
    situacaoPagamento: getValor(formData, "situacaoPagamento"),
  });
}

export async function criarPacote(_: EstadoFormularioPacote = estadoInicial, formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);
  const parsed = parseFormularioPacote(formData);

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do pacote.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioPacote;
  }

  await db.insert(pacote).values({
    ...parsed.data,
    criadoPorId: usuarioAtual.id,
    atualizadoPorId: usuarioAtual.id,
  });

  revalidatePath("/painel/pacotes");

  return {
    status: "sucesso",
    mensagem: "Pacote cadastrado com sucesso.",
  } satisfies EstadoFormularioPacote;
}

export async function atualizarPacote(
  _: EstadoFormularioPacote = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);
  const pacoteId = pacoteIdSchema.safeParse(getValor(formData, "id"));
  const parsed = parseFormularioPacote(formData);

  if (!pacoteId.success) {
    return {
      status: "erro",
      mensagem: "Pacote inválido.",
      campos: { id: pacoteId.error.flatten().formErrors },
    } satisfies EstadoFormularioPacote;
  }

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do pacote.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioPacote;
  }

  const atualizados = await db
    .update(pacote)
    .set({
      ...parsed.data,
      ativo: checkboxAtivo(getValor(formData, "ativo")),
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
    })
    .where(eq(pacote.id, pacoteId.data))
    .returning({ id: pacote.id });

  if (atualizados.length === 0) {
    return {
      status: "erro",
      mensagem: "Pacote não encontrado.",
    } satisfies EstadoFormularioPacote;
  }

  revalidatePath("/painel/pacotes");

  return {
    status: "sucesso",
    mensagem: "Pacote atualizado com sucesso.",
  } satisfies EstadoFormularioPacote;
}

export async function excluirPacote(
  _: EstadoExclusaoPacote = estadoInicialExclusao,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional"]);
  const pacoteId = pacoteIdSchema.safeParse(getValor(formData, "pacoteId"));
  const exclusaoConfirmada = checkboxAtivo(getValor(formData, "confirmarExclusao"));

  if (!pacoteId.success) {
    return {
      status: "erro",
      mensagem: "Pacote inválido.",
    } satisfies EstadoExclusaoPacote;
  }

  if (!exclusaoConfirmada) {
    return {
      status: "erro",
      mensagem: "Confirme que entende a exclusão antes de continuar.",
    } satisfies EstadoExclusaoPacote;
  }

  try {
    const excluidos = await db
      .delete(pacote)
      .where(eq(pacote.id, pacoteId.data))
      .returning({ id: pacote.id });

    if (excluidos.length === 0) {
      return {
        status: "erro",
        mensagem: "Pacote não encontrado.",
      } satisfies EstadoExclusaoPacote;
    }
  } catch {
    return {
      status: "erro",
      mensagem:
        "Não foi possível excluir este pacote agora. Verifique se existem vínculos financeiros ou operacionais.",
    } satisfies EstadoExclusaoPacote;
  }

  revalidatePath("/painel/pacotes");

  return {
    status: "sucesso",
    mensagem: "Pacote excluído com sucesso.",
  } satisfies EstadoExclusaoPacote;
}
