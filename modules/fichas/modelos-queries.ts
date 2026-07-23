import { asc, desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { modeloFicha } from "./schema";

/** Todos os modelos (ativos e inativos), para a tela de administração. */
export async function listarModelosFicha() {
  autorizarPapel(await auth(), ["profissional"]);

  return db.select().from(modeloFicha).orderBy(desc(modeloFicha.atualizadoEm));
}

/** Modelos ativos, em ordem alfabética — usados no seletor "Nova ficha". */
export async function listarModelosAtivos() {
  autorizarPapel(await auth(), ["profissional"]);

  return db
    .select()
    .from(modeloFicha)
    .where(eq(modeloFicha.ativo, true))
    .orderBy(asc(modeloFicha.nome));
}

export async function obterModeloFicha(id: string) {
  autorizarPapel(await auth(), ["profissional"]);

  const [registro] = await db.select().from(modeloFicha).where(eq(modeloFicha.id, id)).limit(1);

  return registro ?? null;
}
