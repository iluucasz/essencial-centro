"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { criarPlanoSchema, planoPacote } from "./schema";

export type EstadoFormularioPlano = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioPlano = { status: "inicial" };
const planoIdSchema = z.string().uuid("Pacote inválido.");

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function revalidarServico(servicoId: string) {
  revalidatePath(`/painel/servicos/${servicoId}`);
  revalidatePath("/painel/servicos");
}

export async function criarPlano(_: EstadoFormularioPlano = estadoInicial, formData: FormData) {
  const usuario = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = criarPlanoSchema.safeParse({
    servicoId: getValor(formData, "servicoId"),
    nome: getValor(formData, "nome"),
    quantidadeSessoes: getValor(formData, "quantidadeSessoes"),
    valorCentavos: getValor(formData, "valor"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do pacote.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioPlano;
  }

  await db.insert(planoPacote).values({
    ...parsed.data,
    criadoPorId: usuario.id,
    atualizadoPorId: usuario.id,
  });

  revalidarServico(parsed.data.servicoId);

  return {
    status: "sucesso",
    mensagem: "Pacote criado com sucesso.",
  } satisfies EstadoFormularioPlano;
}

/** Exclusão direta (botão no card do pacote) — template sem dado de cliente, sem confirmação. */
export async function removerPlano(formData: FormData) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const planoId = planoIdSchema.safeParse(getValor(formData, "planoId"));
  const servicoId = getValor(formData, "servicoId");

  if (!planoId.success) return;

  await db.delete(planoPacote).where(eq(planoPacote.id, planoId.data));

  if (typeof servicoId === "string") revalidarServico(servicoId);
}
