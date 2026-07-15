import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { usuario } from "@/modules/auth/schema";

import { notificacao, type TipoNotificacao } from "./schema";

/**
 * Usado internamente por outros módulos (agenda, sessões…) logo após uma ação real do usuário —
 * não é uma Server Action chamada por formulário. Se o cliente não tiver conta no portal, não faz
 * nada (nem todo cadastro de cliente tem login vinculado).
 */
export async function notificarCliente(params: {
  clienteId: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  link?: string;
}) {
  const [usuarioCliente] = await db
    .select({ id: usuario.id })
    .from(usuario)
    .where(and(eq(usuario.clienteId, params.clienteId), eq(usuario.role, "cliente")))
    .limit(1);

  if (!usuarioCliente) return;

  await db.insert(notificacao).values({
    destinatarioId: usuarioCliente.id,
    tipo: params.tipo,
    titulo: params.titulo,
    mensagem: params.mensagem,
    link: params.link,
  });
}
