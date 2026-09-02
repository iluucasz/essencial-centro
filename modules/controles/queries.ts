import "server-only";

import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { registroControle } from "./schema";

export async function listarRegistrosControle() {
  autorizarPapel(await auth(), ["profissional"]);

  return db.select().from(registroControle).orderBy(desc(registroControle.dataRealizacao));
}

/** Usado pela rota de download do anexo — reautoriza a cada acesso, nunca confia em cache. */
export async function obterRegistroControle(id: string) {
  autorizarPapel(await auth(), ["profissional"]);

  const [registro] = await db
    .select()
    .from(registroControle)
    .where(eq(registroControle.id, id))
    .limit(1);

  return registro ?? null;
}
