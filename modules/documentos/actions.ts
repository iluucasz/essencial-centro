"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarClienteDono, autorizarPapel } from "@/modules/auth/rbac";

import { podeAssinarDocumento } from "./assinatura";
import { criarDocumentoSchema, documento } from "./schema";

export type EstadoFormularioDocumento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioDocumento = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

export async function criarDocumento(
  _: EstadoFormularioDocumento = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarDocumentoSchema.safeParse({
    clienteId: getValor(formData, "clienteId"),
    tipo: getValor(formData, "tipo"),
    titulo: getValor(formData, "titulo"),
    conteudo: getValor(formData, "conteudo"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do documento.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioDocumento;
  }

  await db.insert(documento).values({
    ...parsed.data,
    criadoPorId: usuarioAtual.id,
    atualizadoPorId: usuarioAtual.id,
  });

  revalidatePath(`/painel/clientes/${parsed.data.clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Documento emitido com sucesso.",
  } satisfies EstadoFormularioDocumento;
}

/** Assinatura simplificada do MVP — confirmação com carimbo de data/hora (ver schema.ts). */
export async function assinarDocumento(formData: FormData) {
  const sessao = await auth();
  autorizarPapel(sessao, ["cliente"]);

  const id = getValor(formData, "id");
  if (typeof id !== "string") return;

  const [registro] = await db.select().from(documento).where(eq(documento.id, id)).limit(1);
  if (!registro) return;

  autorizarClienteDono(sessao, registro.clienteId);

  if (!podeAssinarDocumento(registro.status)) return;

  await db
    .update(documento)
    .set({ status: "assinado", assinadoEm: new Date() })
    .where(and(eq(documento.id, id), eq(documento.status, "emitido")));

  revalidatePath(`/portal/documentos/${id}`);
  revalidatePath("/portal/documentos");
}
