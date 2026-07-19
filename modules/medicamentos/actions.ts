"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import {
  criarMedicamentoInformadoSchema,
  editarMedicamentoInformadoSchema,
  medicamentoInformado,
} from "./schema";

export type EstadoFormularioMedicamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

export type EstadoExclusaoMedicamento =
  { status: "inicial" } | { status: "sucesso" } | { status: "erro"; mensagem: string };

const estadoInicial: EstadoFormularioMedicamento = { status: "inicial" };

const excluirMedicamentoSchema = z.object({
  id: z.string().uuid("Medicamento inválido."),
  clienteId: z.string().uuid("Cliente inválido."),
  confirmarExclusao: z.literal("true", {
    error: "Confirme que entende que a exclusão não pode ser desfeita.",
  }),
});

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function lerDadosMedicamento(formData: FormData) {
  return {
    id: getValor(formData, "id"),
    clienteId: getValor(formData, "clienteId"),
    nome: getValor(formData, "nome"),
    dosagem: getValor(formData, "dosagem"),
    frequencia: getValor(formData, "frequencia"),
    profissionalPrescritor: getValor(formData, "profissionalPrescritor"),
    dataInicio: getValor(formData, "dataInicio"),
    alergiaRelacionada: getValor(formData, "alergiaRelacionada"),
    alertaInteracao: getValor(formData, "alertaInteracao"),
    fonteAlerta: getValor(formData, "fonteAlerta"),
  };
}

export async function criarMedicamentoInformado(
  _: EstadoFormularioMedicamento = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarMedicamentoInformadoSchema.safeParse(lerDadosMedicamento(formData));

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

export async function atualizarMedicamentoInformado(
  _: EstadoFormularioMedicamento = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = editarMedicamentoInformadoSchema.safeParse(lerDadosMedicamento(formData));

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do medicamento.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioMedicamento;
  }

  const { id, ...dados } = parsed.data;
  const [registro] = await db
    .select()
    .from(medicamentoInformado)
    .where(eq(medicamentoInformado.id, id))
    .limit(1);

  if (!registro || registro.clienteId !== dados.clienteId) {
    return {
      status: "erro",
      mensagem: "Medicamento não encontrado.",
    } satisfies EstadoFormularioMedicamento;
  }

  await db
    .update(medicamentoInformado)
    .set({
      clienteId: dados.clienteId,
      nome: dados.nome,
      dosagem: dados.dosagem ?? null,
      frequencia: dados.frequencia ?? null,
      profissionalPrescritor: dados.profissionalPrescritor ?? null,
      dataInicio: dados.dataInicio ?? null,
      alergiaRelacionada: dados.alergiaRelacionada ?? null,
      alertaInteracao: dados.alertaInteracao ?? null,
      fonteAlerta: dados.fonteAlerta ?? null,
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
      verificadoPorId: null,
      verificadoEm: null,
    })
    .where(eq(medicamentoInformado.id, id));

  revalidatePath(`/painel/clientes/${dados.clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Medicamento atualizado com sucesso. Verifique novamente o registro.",
  } satisfies EstadoFormularioMedicamento;
}

/** Etapa deliberada e separada da criação: "informar" não é o mesmo que "verificar". */
export async function confirmarVerificacaoMedicamento(formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const id = getValor(formData, "id");
  const clienteId = getValor(formData, "clienteId");
  if (typeof id !== "string" || typeof clienteId !== "string") return;

  const [registro] = await db
    .select({ clienteId: medicamentoInformado.clienteId })
    .from(medicamentoInformado)
    .where(eq(medicamentoInformado.id, id))
    .limit(1);

  if (!registro || registro.clienteId !== clienteId) return;

  await db
    .update(medicamentoInformado)
    .set({ verificadoPorId: usuarioAtual.id, verificadoEm: new Date() })
    .where(and(eq(medicamentoInformado.id, id), isNull(medicamentoInformado.verificadoPorId)));

  revalidatePath(`/painel/clientes/${clienteId}`);
}

export async function excluirMedicamentoInformado(
  _estado: EstadoExclusaoMedicamento,
  formData: FormData,
): Promise<EstadoExclusaoMedicamento> {
  autorizarPapel(await auth(), ["profissional"]);

  const parsed = excluirMedicamentoSchema.safeParse({
    id: getValor(formData, "id"),
    clienteId: getValor(formData, "clienteId"),
    confirmarExclusao: getValor(formData, "confirmarExclusao"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem:
        parsed.error.issues[0]?.message ??
        "Confirme que entende que a exclusão não pode ser desfeita.",
    };
  }

  const { clienteId, id } = parsed.data;
  const [registro] = await db
    .select()
    .from(medicamentoInformado)
    .where(eq(medicamentoInformado.id, id))
    .limit(1);

  if (!registro || registro.clienteId !== clienteId) {
    return { status: "erro", mensagem: "Medicamento não encontrado." };
  }

  await db.delete(medicamentoInformado).where(eq(medicamentoInformado.id, id));

  revalidatePath(`/painel/clientes/${clienteId}`);

  return { status: "sucesso" };
}
