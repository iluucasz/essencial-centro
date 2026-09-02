"use server";

import { revalidatePath } from "next/cache";
import { del, put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { registrarControleSchema, registroControle } from "./schema";

export type EstadoFormularioControle = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioControle = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

export async function registrarControle(
  _: EstadoFormularioControle = estadoInicial,
  formData: FormData,
): Promise<EstadoFormularioControle> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = registrarControleSchema.safeParse({
    tipo: getValor(formData, "tipo"),
    dataRealizacao: getValor(formData, "dataRealizacao"),
    arquivo: getValor(formData, "arquivo"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do registro.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  const { tipo, dataRealizacao, arquivo } = parsed.data;

  let anexo: { pathname: string; nome: string; contentType: string; tamanhoBytes: number } | null =
    null;

  if (arquivo) {
    // ⚠️ access:"public" porque o store do Vercel Blob configurado está em modo público — mesmo
    // aviso de modules/fotos/actions.ts. Ver docs/context/06-lgpd-seguranca.md.
    const blob = await put(`controles/${tipo}/${arquivo.name}`, arquivo, {
      access: "public",
      addRandomSuffix: true,
      contentType: arquivo.type,
    });

    anexo = {
      pathname: blob.pathname,
      nome: arquivo.name,
      contentType: arquivo.type,
      tamanhoBytes: arquivo.size,
    };
  }

  await db.insert(registroControle).values({
    tipo,
    dataRealizacao,
    arquivoPathname: anexo?.pathname ?? null,
    arquivoNome: anexo?.nome ?? null,
    arquivoContentType: anexo?.contentType ?? null,
    arquivoTamanhoBytes: anexo?.tamanhoBytes ?? null,
    criadoPorId: usuarioAtual.id,
  });

  revalidatePath("/painel/controles");

  return { status: "sucesso", mensagem: "Registro salvo." };
}

export type EstadoExclusaoControle = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

const estadoInicialExclusao: EstadoExclusaoControle = { status: "inicial" };

const excluirControleSchema = z.object({ id: z.string().uuid("Registro inválido.") });

export async function excluirControle(
  _: EstadoExclusaoControle = estadoInicialExclusao,
  formData: FormData,
): Promise<EstadoExclusaoControle> {
  autorizarPapel(await auth(), ["profissional"]);

  const parsed = excluirControleSchema.safeParse({ id: getValor(formData, "id") });

  if (!parsed.success) {
    return { status: "erro", mensagem: "Registro inválido." };
  }

  const [registro] = await db
    .select({ arquivoPathname: registroControle.arquivoPathname })
    .from(registroControle)
    .where(eq(registroControle.id, parsed.data.id))
    .limit(1);

  if (!registro) {
    return { status: "erro", mensagem: "Registro não encontrado." };
  }

  await db.delete(registroControle).where(eq(registroControle.id, parsed.data.id));

  if (registro.arquivoPathname) {
    // Não bloqueia a exclusão do registro se o blob já não existir mais no storage.
    await del(registro.arquivoPathname).catch(() => {});
  }

  revalidatePath("/painel/controles");

  return { status: "sucesso", mensagem: "Registro excluído." };
}
