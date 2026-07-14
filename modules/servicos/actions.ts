"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { criarServicoSchema, servico } from "./schema";

export type EstadoFormularioServico = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioServico = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

export async function criarServico(_: EstadoFormularioServico = estadoInicial, formData: FormData) {
  const usuario = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarServicoSchema.safeParse({
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
