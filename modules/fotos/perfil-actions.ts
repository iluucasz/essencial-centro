"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { ErroAutorizacao, autorizarPapel } from "@/modules/auth/rbac";
import { usuario } from "@/modules/auth/schema";
import { foto } from "@/modules/fotos/schema";

import { podeAlterarFotoPerfilCliente, podeAlterarFotoUsuario } from "./perfil-acesso";
import { FOTO_PERFIL_CLIENTE_REGIAO, fotoPerfilSchema } from "./perfil-schema";

export type EstadoFotoPerfil = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFotoPerfil = { status: "inicial" };

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

export async function atualizarFotoPerfilCliente(
  _: EstadoFotoPerfil = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  if (!podeAlterarFotoPerfilCliente(usuarioAtual)) {
    throw new ErroAutorizacao();
  }

  const parsed = fotoPerfilSchema.safeParse({
    id: getValor(formData, "clienteId"),
    arquivo: getValor(formData, "arquivo"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise a imagem selecionada.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFotoPerfil;
  }

  const { id: clienteId, arquivo } = parsed.data;
  const blob = await put(`clientes/${clienteId}/perfil/${arquivo.name}`, arquivo, {
    access: "public",
    addRandomSuffix: true,
    contentType: arquivo.type,
  });

  await db.insert(foto).values({
    clienteId,
    regiao: FOTO_PERFIL_CLIENTE_REGIAO,
    pathname: blob.pathname,
    contentType: arquivo.type,
    tamanhoBytes: arquivo.size,
    criadoPorId: usuarioAtual.id,
  });

  revalidatePath(`/painel/clientes/${clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Foto do cliente atualizada com sucesso.",
  } satisfies EstadoFotoPerfil;
}

export async function atualizarFotoUsuario(
  _: EstadoFotoPerfil = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  if (!podeAlterarFotoUsuario(usuarioAtual)) {
    throw new ErroAutorizacao();
  }

  const parsed = fotoPerfilSchema.safeParse({
    id: getValor(formData, "usuarioId"),
    arquivo: getValor(formData, "arquivo"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise a imagem selecionada.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFotoPerfil;
  }

  const { id: usuarioId, arquivo } = parsed.data;
  const blob = await put(`usuarios/${usuarioId}/perfil/${arquivo.name}`, arquivo, {
    access: "public",
    addRandomSuffix: true,
    contentType: arquivo.type,
  });

  await db
    .update(usuario)
    .set({ image: blob.pathname, atualizadoEm: new Date() })
    .where(eq(usuario.id, usuarioId));

  revalidatePath("/painel/usuarios");
  revalidatePath("/painel", "layout");

  return {
    status: "sucesso",
    mensagem: "Foto do usuário atualizada com sucesso.",
  } satisfies EstadoFotoPerfil;
}
