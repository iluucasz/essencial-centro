"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { criarMedicamentoInformadoSchema, medicamentoInformado } from "./schema";

export type EstadoFormularioMedicamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioMedicamento = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

export async function criarMedicamentoInformado(
  _: EstadoFormularioMedicamento = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarMedicamentoInformadoSchema.safeParse({
    clienteId: getValor(formData, "clienteId"),
    nome: getValor(formData, "nome"),
    dosagem: getValor(formData, "dosagem"),
    frequencia: getValor(formData, "frequencia"),
    profissionalPrescritor: getValor(formData, "profissionalPrescritor"),
    dataInicio: getValor(formData, "dataInicio"),
    alergiaRelacionada: getValor(formData, "alergiaRelacionada"),
    alertaInteracao: getValor(formData, "alertaInteracao"),
    fonteAlerta: getValor(formData, "fonteAlerta"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do medicamento.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioMedicamento;
  }

  await db.insert(medicamentoInformado).values({
    ...parsed.data,
    criadoPorId: usuarioAtual.id,
    atualizadoPorId: usuarioAtual.id,
  });

  revalidatePath(`/painel/clientes/${parsed.data.clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Medicamento registrado com sucesso.",
  } satisfies EstadoFormularioMedicamento;
}

/** Etapa deliberada e separada da criação — "informar" não é o mesmo que "verificar". */
export async function confirmarVerificacaoMedicamento(formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const id = getValor(formData, "id");
  const clienteId = getValor(formData, "clienteId");
  if (typeof id !== "string" || typeof clienteId !== "string") return;

  await db
    .update(medicamentoInformado)
    .set({ verificadoPorId: usuarioAtual.id, verificadoEm: new Date() })
    .where(and(eq(medicamentoInformado.id, id), isNull(medicamentoInformado.verificadoPorId)));

  revalidatePath(`/painel/clientes/${clienteId}`);
}
