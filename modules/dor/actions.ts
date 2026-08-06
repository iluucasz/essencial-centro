"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";

import { exigirClienteIdDaSessao } from "./queries";
import { registrarDorSchema, registroDor } from "./schema";

export type EstadoRegistroDor = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoRegistroDor = { status: "inicial" };

function lerPonto(formData: FormData) {
  return {
    regiao: formData.get("regiao"),
    lado: formData.get("lado"),
    intensidade: formData.get("intensidade"),
    // Checkbox/hidden chega como string: "true"/"false" — `z.coerce.boolean` trataria "false" como
    // verdadeiro (string não vazia), então a conversão é explícita aqui.
    anterior: formData.get("anterior") === "true",
    alturaNormalizada: formData.get("alturaNormalizada"),
    xNormalizado: formData.get("xNormalizado"),
    observacao: formData.get("observacao"),
  };
}

function erroDeValidacao(erro: z.ZodError): EstadoRegistroDor {
  return {
    status: "erro",
    mensagem: "Revise o ponto de dor.",
    campos: z.flattenError(erro).fieldErrors,
  };
}

/**
 * Registra um ponto de dor a partir do painel — a profissional marcando no atendimento.
 *
 * O `clienteId` vem do formulário (a profissional atende qualquer cliente), então é revalidado no
 * banco antes de gravar; a `origem` é derivada do papel, nunca enviada pelo cliente.
 */
export async function registrarDorNoAtendimento(
  _: EstadoRegistroDor = estadoInicial,
  formData: FormData,
): Promise<EstadoRegistroDor> {
  let usuarioAtual;

  try {
    usuarioAtual = autorizarPapel(await auth(), ["profissional"]);
  } catch (erro) {
    if (erro instanceof ErroAutorizacao) return { status: "erro", mensagem: erro.message };
    throw erro;
  }

  const clienteId = z.string().uuid().safeParse(formData.get("clienteId"));
  if (!clienteId.success) return { status: "erro", mensagem: "Cliente inválido." };

  const [existe] = await db
    .select({ id: cliente.id })
    .from(cliente)
    .where(eq(cliente.id, clienteId.data))
    .limit(1);

  if (!existe) return { status: "erro", mensagem: "Cliente não encontrado." };

  const ponto = registrarDorSchema.safeParse(lerPonto(formData));
  if (!ponto.success) return erroDeValidacao(ponto.error);

  await db.insert(registroDor).values({
    ...ponto.data,
    clienteId: clienteId.data,
    origem: "profissional",
    criadoPorId: usuarioAtual.id,
  });

  revalidatePath(`/painel/clientes/${clienteId.data}`);

  return { status: "sucesso", mensagem: "Ponto de dor registrado." };
}

/**
 * Registra um ponto de dor a partir do portal — o próprio cliente relatando entre sessões.
 *
 * Diferença que importa: o `clienteId` **não** vem do formulário, sai da sessão
 * (`exigirClienteIdDaSessao`), e a origem é `cliente` — relato, não avaliação clínica.
 */
export async function relatarMinhaDor(
  _: EstadoRegistroDor = estadoInicial,
  formData: FormData,
): Promise<EstadoRegistroDor> {
  let clienteId: string;
  let usuarioAtual;

  try {
    usuarioAtual = autorizarPapel(await auth(), ["cliente"]);
    clienteId = await exigirClienteIdDaSessao();
  } catch (erro) {
    if (erro instanceof ErroAutorizacao) return { status: "erro", mensagem: erro.message };
    throw erro;
  }

  const ponto = registrarDorSchema.safeParse(lerPonto(formData));
  if (!ponto.success) return erroDeValidacao(ponto.error);

  await db.insert(registroDor).values({
    ...ponto.data,
    clienteId,
    origem: "cliente",
    criadoPorId: usuarioAtual.id,
  });

  revalidatePath("/portal/dor");

  return { status: "sucesso", mensagem: "Obrigada! A profissional vai ver esse relato." };
}

/**
 * Exclusão de um ponto. Só a profissional apaga, e o WHERE amarra ao cliente informado — um id de
 * outro cliente não encontra linha em vez de apagar às cegas.
 */
export async function excluirPontoDeDor(formData: FormData): Promise<EstadoRegistroDor> {
  try {
    autorizarPapel(await auth(), ["profissional"]);
  } catch (erro) {
    if (erro instanceof ErroAutorizacao) return { status: "erro", mensagem: erro.message };
    throw erro;
  }

  const dados = z
    .object({ id: z.string().uuid(), clienteId: z.string().uuid() })
    .safeParse({ id: formData.get("id"), clienteId: formData.get("clienteId") });

  if (!dados.success) return { status: "erro", mensagem: "Registro inválido." };

  await db
    .delete(registroDor)
    .where(and(eq(registroDor.id, dados.data.id), eq(registroDor.clienteId, dados.data.clienteId)));

  revalidatePath(`/painel/clientes/${dados.data.clienteId}`);

  return { status: "sucesso", mensagem: "Ponto removido." };
}
