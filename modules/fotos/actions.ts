"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

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
