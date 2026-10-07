import { eq } from "drizzle-orm";

import { db } from "@/db";

import { CHAVE_CONEXAO_WHATSAPP, conexaoWhatsApp, type ConexaoWhatsApp } from "./schema";

/** Acesso à linha única de `conexao_whatsapp`. Sem autorização aqui — quem chama é `conexao.ts`. */

export async function lerConexaoWhatsApp(): Promise<ConexaoWhatsApp | null> {
  const [registro] = await db
    .select()
    .from(conexaoWhatsApp)
    .where(eq(conexaoWhatsApp.chave, CHAVE_CONEXAO_WHATSAPP))
    .limit(1);

  return registro ?? null;
}

export async function registrarInstanciaWhatsApp(
  valores: Omit<ConexaoWhatsApp, "chave">,
): Promise<ConexaoWhatsApp> {
  const [registro] = await db
    .insert(conexaoWhatsApp)
    .values({ chave: CHAVE_CONEXAO_WHATSAPP, ...valores })
    .onConflictDoUpdate({ target: conexaoWhatsApp.chave, set: valores })
    .returning();

  return registro;
}

export async function atualizarConexaoWhatsApp(
  valores: Pick<ConexaoWhatsApp, "estado" | "numeroConectado" | "nomeConectado" | "verificadoEm">,
): Promise<ConexaoWhatsApp | null> {
  const [registro] = await db
    .update(conexaoWhatsApp)
    .set(valores)
    .where(eq(conexaoWhatsApp.chave, CHAVE_CONEXAO_WHATSAPP))
    .returning();

  return registro ?? null;
}

/** A instância sumiu do servidor Evolution — sem linha, o estado volta a `not_created`. */
export async function limparConexaoWhatsApp() {
  await db.delete(conexaoWhatsApp).where(eq(conexaoWhatsApp.chave, CHAVE_CONEXAO_WHATSAPP));
}
