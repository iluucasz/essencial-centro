"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { notificacao } from "./schema";

export async function marcarNotificacaoComoLida(formData: FormData) {
  const usuario = autorizarPapel(await auth(), ["profissional", "recepcao", "cliente"]);
  const id = formData.get("id");

  if (typeof id !== "string" || id.length === 0) return;

  await db
    .update(notificacao)
    .set({ lida: true, lidaEm: new Date() })
    .where(and(eq(notificacao.id, id), eq(notificacao.destinatarioId, usuario.id)));

  revalidatePath("/portal/notificacoes");
  revalidatePath("/portal");
}
