"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { editarModeloFichaSchema, ficha, modeloFicha, salvarModeloFichaSchema } from "./schema";

export type ResultadoModeloFicha =
  | { status: "sucesso"; id: string }
  | { status: "erro"; mensagem: string; campos?: Record<string, string[] | undefined> };

export type EstadoExclusaoModelo =
  { status: "inicial" } | { status: "sucesso" } | { status: "erro"; mensagem: string };

function slugBase(nome: string) {
  return (
    nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "modelo"
  );
}

/** Garante slug único (acrescenta sufixo numérico se já existir). */
async function slugUnico(nome: string) {
  const base = slugBase(nome);
  let slug = base;
  let sufixo = 1;

  for (;;) {
    const [existe] = await db
      .select({ id: modeloFicha.id })
      .from(modeloFicha)
      .where(eq(modeloFicha.slug, slug))
      .limit(1);

    if (!existe) return slug;

    sufixo += 1;
    slug = `${base}-${sufixo}`;
  }
}

export async function criarModeloFicha(input: unknown): Promise<ResultadoModeloFicha> {
  const usuario = autorizarPapel(await auth(), ["profissional"]);
  const parsed = salvarModeloFichaSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do modelo.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  const { nome, descricao, ativo, campos } = parsed.data;

  const [registro] = await db
    .insert(modeloFicha)
    .values({
      slug: await slugUnico(nome),
      nome,
      descricao,
      ativo,
      campos,
      criadoPorId: usuario.id,
      atualizadoPorId: usuario.id,
    })
    .returning({ id: modeloFicha.id });

  revalidatePath("/painel/fichas/modelos");

  return { status: "sucesso", id: registro.id };
}

export async function editarModeloFicha(input: unknown): Promise<ResultadoModeloFicha> {
  const usuario = autorizarPapel(await auth(), ["profissional"]);
  const parsed = editarModeloFichaSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do modelo.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, nome, descricao, ativo, campos } = parsed.data;

  const [registro] = await db
    .update(modeloFicha)
    .set({ nome, descricao, ativo, campos, atualizadoPorId: usuario.id, atualizadoEm: new Date() })
    .where(eq(modeloFicha.id, id))
    .returning({ id: modeloFicha.id });

  if (!registro) return { status: "erro", mensagem: "Modelo não encontrado." };

  revalidatePath("/painel/fichas/modelos");

  return { status: "sucesso", id: registro.id };
}

const excluirModeloSchema = z.object({
  modeloId: z.string().uuid("Modelo inválido."),
  confirmarExclusao: z.literal("true", { error: "Confirme que entende a exclusão." }),
});

export async function excluirModeloFicha(
  _estado: EstadoExclusaoModelo,
  formData: FormData,
): Promise<EstadoExclusaoModelo> {
  autorizarPapel(await auth(), ["profissional"]);

  const parsed = excluirModeloSchema.safeParse({
    modeloId: formData.get("modeloId"),
    confirmarExclusao: formData.get("confirmarExclusao"),
  });

  if (!parsed.success) {
    return { status: "erro", mensagem: parsed.error.issues[0]?.message ?? "Confirme a exclusão." };
  }

  // Não excluir modelo em uso: fichas preenchidas dependem da definição de campos para serem lidas.
  const [emUso] = await db
    .select({ id: ficha.id })
    .from(ficha)
    .where(eq(ficha.modeloFichaId, parsed.data.modeloId))
    .limit(1);

  if (emUso) {
    return {
      status: "erro",
      mensagem: "Este modelo já tem fichas preenchidas. Desative-o em vez de excluir.",
    };
  }

  await db.delete(modeloFicha).where(eq(modeloFicha.id, parsed.data.modeloId));

  revalidatePath("/painel/fichas/modelos");

  return { status: "sucesso" };
}
