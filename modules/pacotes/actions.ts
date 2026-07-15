"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { criarPacoteSchema, pacote } from "./schema";

export type EstadoFormularioPacote = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioPacote = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

export async function criarPacote(_: EstadoFormularioPacote = estadoInicial, formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = criarPacoteSchema.safeParse({
    clienteId: getValor(formData, "clienteId"),
    servicoId: getValor(formData, "servicoId"),
    quantidadeSessoes: getValor(formData, "quantidadeSessoes"),
    validade: getValor(formData, "validade"),
    valorCentavos: getValor(formData, "valor"),
    formaPagamento: getValor(formData, "formaPagamento"),
    situacaoPagamento: getValor(formData, "situacaoPagamento"),
  });

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
