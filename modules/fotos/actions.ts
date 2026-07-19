"use server";

import { revalidatePath } from "next/cache";
import { del, put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { criarFotoSchema, foto } from "./schema";

export type EstadoFormularioFoto = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioFoto = { status: "inicial" };

export type EstadoExclusaoFoto = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

const estadoInicialExclusao: EstadoExclusaoFoto = { status: "inicial" };

const excluirFotoSchema = z.object({
  id: z.string().uuid("Foto inválida."),
  clienteId: z.string().uuid("Cliente inválido."),
  confirmarExclusao: z.literal("true", {
    error: "Confirme que entende que a exclusão não pode ser desfeita.",
  }),
});

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

export async function criarFoto(_: EstadoFormularioFoto = estadoInicial, formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarFotoSchema.safeParse({
    clienteId: getValor(formData, "clienteId"),
    sessaoId: getValor(formData, "sessaoId"),
    regiao: getValor(formData, "regiao"),
    arquivo: getValor(formData, "arquivo"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da foto.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioFoto;
  }

  const { clienteId, sessaoId, regiao, arquivo } = parsed.data;

  // ⚠️ access:"public" porque o store do Vercel Blob configurado está em modo público — não é
  // um blob verdadeiramente privado. Ver aviso completo em docs/context/06-lgpd-seguranca.md.
  const blob = await put(`clientes/${clienteId}/fotos/${arquivo.name}`, arquivo, {
    access: "public",
    addRandomSuffix: true,
    contentType: arquivo.type,
  });

  await db.insert(foto).values({
    clienteId,
    sessaoId,
    regiao,
    pathname: blob.pathname,
    contentType: arquivo.type,
    tamanhoBytes: arquivo.size,
    criadoPorId: usuarioAtual.id,
  });

  revalidatePath(`/painel/clientes/${clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Foto enviada com sucesso.",
  } satisfies EstadoFormularioFoto;
}

export async function excluirFoto(
  _: EstadoExclusaoFoto = estadoInicialExclusao,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional"]);

  const parsed = excluirFotoSchema.safeParse({
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
    } satisfies EstadoExclusaoFoto;
  }

  const { id, clienteId } = parsed.data;
  const [registro] = await db.select().from(foto).where(eq(foto.id, id)).limit(1);

  if (!registro || registro.clienteId !== clienteId) {
    return { status: "erro", mensagem: "Foto não encontrada." } satisfies EstadoExclusaoFoto;
  }

  await db.delete(foto).where(eq(foto.id, id));

  // Não bloqueia a exclusão do registro se o blob já não existir mais no storage.
  await del(registro.pathname).catch(() => {});

  revalidatePath(`/painel/clientes/${clienteId}`);

  return { status: "sucesso", mensagem: "Foto excluída com sucesso." } satisfies EstadoExclusaoFoto;
}
