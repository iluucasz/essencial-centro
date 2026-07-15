import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { notificacao } from "./schema";

/** Role-agnóstico: qualquer usuário logado vê as próprias notificações. */
export async function listarMinhasNotificacoes() {
  const usuario = autorizarPapel(await auth(), ["profissional", "recepcao", "cliente"]);

  return db
    .select()
    .from(notificacao)
    .where(eq(notificacao.destinatarioId, usuario.id))
    .orderBy(desc(notificacao.criadoEm));
}
