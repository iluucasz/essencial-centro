"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { sessao } from "@/modules/sessoes/schema";

import { criarMedidaSchema, editarMedidaSchema, medida } from "./schema";

export type EstadoFormularioMedida = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

export type EstadoExclusaoMedida =
  { status: "inicial" } | { status: "sucesso" } | { status: "erro"; mensagem: string };

const estadoInicial: EstadoFormularioMedida = { status: "inicial" };

const excluirMedidaSchema = z.object({
  id: z.string().uuid("Medida inválida."),
  clienteId: z.string().uuid("Cliente inválido."),
  confirmarExclusao: z.literal("true", {
    error: "Confirme que entende que a exclusão não pode ser desfeita.",
  }),
});

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function lerDadosMedida(formData: FormData) {
  return {
    id: getValor(formData, "id"),
    clienteId: getValor(formData, "clienteId"),
    sessaoId: getValor(formData, "sessaoId"),
    regiao: getValor(formData, "regiao"),
    lado: getValor(formData, "lado"),
    valorCm: getValor(formData, "valorCm"),
  };
}

async function validarSessaoDaMedida({
  clienteId,
  sessaoId,
}: {
  clienteId: string;
  sessaoId?: string;
}) {
  if (!sessaoId) return null;

  const [registro] = await db
    .select({ id: sessao.id })
    .from(sessao)
    .where(and(eq(sessao.id, sessaoId), eq(sessao.clienteId, clienteId)))
    .limit(1);

  return registro ? null : "Sessão vinculada não pertence a este cliente.";
}

export async function criarMedida(_: EstadoFormularioMedida = estadoInicial, formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarMedidaSchema.safeParse(lerDadosMedida(formData));

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da medida.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioMedida;
  }

  const erroVinculo = await validarSessaoDaMedida(parsed.data);

  if (erroVinculo) {
    return {
      status: "erro",
      mensagem: erroVinculo,
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

export async function atualizarMedida(
  _: EstadoFormularioMedida = estadoInicial,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional"]);

  const parsed = editarMedidaSchema.safeParse(lerDadosMedida(formData));

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da medida.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioMedida;
  }

  const { id, ...dados } = parsed.data;
  const [registro] = await db.select().from(medida).where(eq(medida.id, id)).limit(1);

  if (!registro || registro.clienteId !== dados.clienteId) {
    return { status: "erro", mensagem: "Medida não encontrada." } satisfies EstadoFormularioMedida;
  }

  const erroVinculo = await validarSessaoDaMedida(dados);

  if (erroVinculo) {
    return {
      status: "erro",
      mensagem: erroVinculo,
    } satisfies EstadoFormularioMedida;
  }

  await db
    .update(medida)
    .set({
      regiao: dados.regiao,
      lado: dados.lado ?? null,
      sessaoId: dados.sessaoId ?? null,
      valorCm: dados.valorCm,
    })
    .where(eq(medida.id, id));

  revalidatePath(`/painel/clientes/${dados.clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Medida atualizada com sucesso.",
  } satisfies EstadoFormularioMedida;
}

export async function excluirMedida(
  _estado: EstadoExclusaoMedida,
  formData: FormData,
): Promise<EstadoExclusaoMedida> {
  autorizarPapel(await auth(), ["profissional"]);

  const parsed = excluirMedidaSchema.safeParse({
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
  const [registro] = await db.select().from(medida).where(eq(medida.id, id)).limit(1);

  if (!registro || registro.clienteId !== clienteId) {
    return { status: "erro", mensagem: "Medida não encontrada." };
  }

  await db.delete(medida).where(eq(medida.id, id));

  revalidatePath(`/painel/clientes/${clienteId}`);

  return { status: "sucesso" };
}
