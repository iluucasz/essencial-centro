import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";

import { conviteCadastroCliente } from "./schema";

/**
 * Carrega o convite de autocadastro por token — SEM sessão. A autorização é o próprio token; retorna
 * só o necessário para a página pública (nenhum dado de cliente existente).
 */
export async function obterConvitePorToken(token: string) {
  const [convite] = await db
    .select({
      status: conviteCadastroCliente.status,
      tokenExpiraEm: conviteCadastroCliente.tokenExpiraEm,
      telefone: conviteCadastroCliente.telefone,
    })
    .from(conviteCadastroCliente)
    .where(eq(conviteCadastroCliente.token, token))
    .limit(1);

  return convite ?? null;
}
