"use server";

import { revalidatePath } from "next/cache";
import { inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarEscrita } from "@/modules/auth/rbac";

import { cliente } from "./schema";

export type EstadoAtribuicaoTag = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: {
    tag?: string[];
    clienteIds?: string[];
  };
};

const atribuirTagSchema = z.object({
  tag: z.string().trim().min(1, "Informe o nome da tag.").max(160, "Use no máximo 160 caracteres."),
  clienteIds: z
    .array(z.string().uuid("Cliente inválido."))
    .min(1, "Selecione pelo menos um cliente.")
    .max(1000, "Selecione no máximo 1.000 clientes por vez.")
    .transform((ids) => Array.from(new Set(ids))),
});

const estadoInicial: EstadoAtribuicaoTag = { status: "inicial" };

/**
 * A seleção enviada vira a lista completa de participantes da tag. Como o cadastro possui uma
 * tag por cliente, atribuir outra substitui a anterior. O batch evita um estado intermediário entre
 * remover participantes antigos e gravar os novos.
 */
export async function atribuirTagClientes(
  _: EstadoAtribuicaoTag = estadoInicial,
  formData: FormData,
): Promise<EstadoAtribuicaoTag> {
  const usuarioAtual = autorizarEscrita(await auth(), ["profissional", "recepcao"]);
  const parsed = atribuirTagSchema.safeParse({
    tag: formData.get("tag"),
    clienteIds: formData.getAll("clienteIds"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise a tag e os clientes selecionados.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  const agora = new Date();
  const tagNormalizada = parsed.data.tag;

  await db.batch([
    db
      .update(cliente)
      .set({ tag: null, atualizadoPorId: usuarioAtual.id, atualizadoEm: agora })
      .where(sql`lower(${cliente.tag}) = lower(${tagNormalizada})`),
    db
      .update(cliente)
      .set({ tag: tagNormalizada, atualizadoPorId: usuarioAtual.id, atualizadoEm: agora })
      .where(inArray(cliente.id, parsed.data.clienteIds)),
  ]);

  revalidatePath("/painel/clientes");
  revalidatePath("/painel/whatsapp");

  return {
    status: "sucesso",
    mensagem: `Tag atribuída a ${parsed.data.clienteIds.length} cliente${parsed.data.clienteIds.length === 1 ? "" : "s"}.`,
  };
}
