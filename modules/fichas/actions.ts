"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import {
  criarFichaEsteticaCorporalSchema,
  criarFichaExtensaoCiliosSchema,
  editarFichaEsteticaCorporalSchema,
  editarFichaExtensaoCiliosSchema,
  ficha,
  type Ficha,
  type TipoFichaImplementado,
} from "./schema";

export type ResultadoCriarFicha =
  | { status: "sucesso"; id: string }
  | { status: "erro"; mensagem: string; campos?: Record<string, string[] | undefined> };

export type EstadoExclusaoFicha =
  { status: "inicial" } | { status: "sucesso" } | { status: "erro"; mensagem: string };

const excluirFichaSchema = z.object({
  fichaId: z.string().uuid("Ficha inválida."),
  clienteId: z.string().uuid("Cliente inválido."),
  confirmarExclusao: z.literal("true", {
    error: "Confirme que entende que a exclusão não pode ser desfeita.",
  }),
});

function errosDeCampos(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[] | undefined>;
}

async function obterFichaParaGerenciar({
  clienteId,
  fichaId,
  tipo,
}: {
  clienteId: string;
  fichaId: string;
  tipo: TipoFichaImplementado;
}): Promise<
  { ok: true; registro: Ficha } | { ok: false; erro: { status: "erro"; mensagem: string } }
> {
  const [registro] = await db.select().from(ficha).where(eq(ficha.id, fichaId)).limit(1);

  if (!registro || registro.clienteId !== clienteId) {
    return { ok: false, erro: { status: "erro", mensagem: "Ficha não encontrada." } };
  }

  if (registro.tipo !== tipo) {
    return {
      ok: false,
      erro: { status: "erro", mensagem: "Tipo de ficha incompatível com este formulário." },
    };
  }

  return { ok: true, registro };
}

async function salvarEdicaoFichaAssinadaOuAberta({
  autorizacaoImagem,
  clienteId,
  fichaId,
  respostas,
  servicoId,
  tipo,
  usuarioId,
}: {
  autorizacaoImagem: boolean;
  clienteId: string;
  fichaId: string;
  respostas: unknown;
  servicoId?: string;
  tipo: TipoFichaImplementado;
  usuarioId: string;
}) {
  const existente = await obterFichaParaGerenciar({ clienteId, fichaId, tipo });

  if (!existente.ok) return existente.erro;

  const agora = new Date();

  if (existente.registro.status === "assinada") {
    const [novaVersao] = await db
      .insert(ficha)
      .values({
        clienteId,
        servicoId: servicoId ?? null,
        tipo,
        status: "assinada",
        versao: existente.registro.versao + 1,
        versaoAnteriorId: existente.registro.id,
        respostas,
        aceiteTermosEm: agora,
        autorizacaoImagemEm: autorizacaoImagem ? agora : null,
        criadoPorId: usuarioId,
        atualizadoPorId: usuarioId,
      })
      .returning({ id: ficha.id });

    revalidatePath(`/painel/clientes/${clienteId}`);

    return { status: "sucesso", id: novaVersao.id } as const;
  }

  const [registroAtualizado] = await db
    .update(ficha)
    .set({
      servicoId: servicoId ?? null,
      status: "assinada",
      respostas,
      aceiteTermosEm: agora,
      autorizacaoImagemEm: autorizacaoImagem ? agora : null,
      atualizadoPorId: usuarioId,
      atualizadoEm: agora,
    })
    .where(eq(ficha.id, fichaId))
    .returning({ id: ficha.id });

  revalidatePath(`/painel/clientes/${clienteId}`);

  return { status: "sucesso", id: registroAtualizado.id } as const;
}

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
      campos: errosDeCampos(parsed.error),
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
      campos: errosDeCampos(parsed.error),
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

export async function editarFichaEsteticaCorporal(input: unknown): Promise<ResultadoCriarFicha> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = editarFichaEsteticaCorporalSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da ficha.",
      campos: errosDeCampos(parsed.error),
    };
  }

  const { autorizacaoImagem, clienteId, id, respostas, servicoId } = parsed.data;

  return salvarEdicaoFichaAssinadaOuAberta({
    autorizacaoImagem,
    clienteId,
    fichaId: id,
    respostas,
    servicoId,
    tipo: "estetica_corporal",
    usuarioId: usuarioAtual.id,
  });
}

export async function editarFichaExtensaoCilios(input: unknown): Promise<ResultadoCriarFicha> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = editarFichaExtensaoCiliosSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da ficha.",
      campos: errosDeCampos(parsed.error),
    };
  }

  const { autorizacaoImagem, clienteId, id, respostas, servicoId } = parsed.data;

  return salvarEdicaoFichaAssinadaOuAberta({
    autorizacaoImagem,
    clienteId,
    fichaId: id,
    respostas,
    servicoId,
    tipo: "extensao_cilios",
    usuarioId: usuarioAtual.id,
  });
}

export async function excluirFicha(
  _estado: EstadoExclusaoFicha,
  formData: FormData,
): Promise<EstadoExclusaoFicha> {
  autorizarPapel(await auth(), ["profissional"]);

  const parsed = excluirFichaSchema.safeParse({
    fichaId: formData.get("fichaId"),
    clienteId: formData.get("clienteId"),
    confirmarExclusao: formData.get("confirmarExclusao"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem:
        parsed.error.issues[0]?.message ??
        "Confirme que entende que a exclusão não pode ser desfeita.",
    };
  }

  const { clienteId, fichaId } = parsed.data;
  const [registro] = await db.select().from(ficha).where(eq(ficha.id, fichaId)).limit(1);

  if (!registro || registro.clienteId !== clienteId) {
    return { status: "erro", mensagem: "Ficha não encontrada." };
  }

  await db.delete(ficha).where(eq(ficha.id, fichaId));

  revalidatePath(`/painel/clientes/${clienteId}`);

  return { status: "sucesso" };
}
