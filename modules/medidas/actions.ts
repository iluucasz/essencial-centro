"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { criarMedidaSchema, medida } from "./schema";

export type EstadoFormularioMedida = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioMedida = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

export async function criarMedida(_: EstadoFormularioMedida = estadoInicial, formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarMedidaSchema.safeParse({
    clienteId: getValor(formData, "clienteId"),
    sessaoId: getValor(formData, "sessaoId"),
    regiao: getValor(formData, "regiao"),
    lado: getValor(formData, "lado"),
    valorCm: getValor(formData, "valorCm"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da medida.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioMedida;
  }

  await db.insert(medida).values({
    ...parsed.data,
    criadoPorId: usuarioAtual.id,
  });

  revalidatePath(`/painel/clientes/${parsed.data.clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Medida registrada com sucesso.",
  } satisfies EstadoFormularioMedida;
}
