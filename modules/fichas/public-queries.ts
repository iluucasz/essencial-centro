import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { cliente } from "@/modules/clientes/schema";

import { ficha, modeloFicha } from "./schema";

/**
 * Carrega a ficha pública por token — SEM sessão (o formulário do cliente é aberto por link). A
 * autorização é o próprio token (aleatório forte, uso único, com expiração). Retorna só o necessário
 * para renderizar o formulário; nunca expõe dados de outros clientes.
 */
export async function obterFichaPorToken(token: string) {
  const [linha] = await db
    .select({
      fichaId: ficha.id,
      status: ficha.status,
      tokenExpiraEm: ficha.tokenExpiraEm,
      modeloNome: modeloFicha.nome,
      campos: modeloFicha.campos,
      clienteNome: cliente.nome,
    })
    .from(ficha)
    .innerJoin(modeloFicha, eq(ficha.modeloFichaId, modeloFicha.id))
    .innerJoin(cliente, eq(ficha.clienteId, cliente.id))
    .where(eq(ficha.tokenPublico, token))
    .limit(1);

  return linha ?? null;
}
