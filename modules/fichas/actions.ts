"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { criarFichaEsteticaCorporalSchema, criarFichaExtensaoCiliosSchema, ficha } from "./schema";

export type ResultadoCriarFicha =
  | { status: "sucesso"; id: string }
  | { status: "erro"; mensagem: string; campos?: Record<string, string[] | undefined> };

/**
 * Dados aninhados (relato/avaliação/medidas) — recebe o objeto validado pelo RHF diretamente,
 * em vez de FormData. Padrão para formulários complexos; formulários simples continuam com
 * FormData + useActionState (ver docs/context/03-convencoes.md).
 */
export async function criarFichaEsteticaCorporal(input: unknown): Promise<ResultadoCriarFicha> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarFichaEsteticaCorporalSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da ficha.",
      campos: parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>,
    };
  }

  const { clienteId, servicoId, autorizacaoImagem, respostas } = parsed.data;
  const agora = new Date();

  const [registro] = await db
    .insert(ficha)
    .values({
      clienteId,
      servicoId,
      tipo: "estetica_corporal",
      status: "assinada",
      respostas,
      aceiteTermosEm: agora,
      autorizacaoImagemEm: autorizacaoImagem ? agora : null,
      criadoPorId: usuarioAtual.id,
      atualizadoPorId: usuarioAtual.id,
    })
    .returning({ id: ficha.id });

  revalidatePath(`/painel/clientes/${clienteId}`);

  return { status: "sucesso", id: registro.id };
}

export async function criarFichaExtensaoCilios(input: unknown): Promise<ResultadoCriarFicha> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = criarFichaExtensaoCiliosSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da ficha.",
      campos: parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>,
    };
  }

  const { clienteId, servicoId, autorizacaoImagem, respostas } = parsed.data;
  const agora = new Date();

  const [registro] = await db
    .insert(ficha)
    .values({
      clienteId,
      servicoId,
      tipo: "extensao_cilios",
      status: "assinada",
      respostas,
      aceiteTermosEm: agora,
      autorizacaoImagemEm: autorizacaoImagem ? agora : null,
      criadoPorId: usuarioAtual.id,
      atualizadoPorId: usuarioAtual.id,
    })
    .returning({ id: ficha.id });

  revalidatePath(`/painel/clientes/${clienteId}`);

  return { status: "sucesso", id: registro.id };
}
