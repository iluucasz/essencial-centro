"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";
import { enviarWhatsAppTexto } from "@/modules/notificacoes/whatsapp";

import { camposVisiveisParaCliente, validarRespostasModelo } from "./campos";
import { ficha, modeloFicha } from "./schema";
import { expiracaoTokenFicha, gerarTokenFicha, tokenFichaExpirado } from "./token";
import { urlFichaPublica } from "./url-publica";

export type ResultadoFicha =
  | { status: "sucesso"; id: string }
  | { status: "erro"; mensagem: string; campos?: Record<string, string[] | undefined> };

export type EstadoExclusaoFicha =
  { status: "inicial" } | { status: "sucesso" } | { status: "erro"; mensagem: string };

const servicoIdOpcional = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().uuid("Selecione um serviço.").optional(),
);

const criarFichaDeModeloSchema = z.object({
  clienteId: z.string().uuid("Selecione um cliente."),
  modeloFichaId: z.string().uuid("Selecione um modelo."),
  servicoId: servicoIdOpcional,
  respostas: z.record(z.string(), z.unknown()).default({}),
});

const editarFichaDinamicaSchema = criarFichaDeModeloSchema.extend({
  id: z.string().uuid("Ficha inválida."),
});

async function carregarModelo(modeloFichaId: string) {
  const [modelo] = await db
    .select()
    .from(modeloFicha)
    .where(eq(modeloFicha.id, modeloFichaId))
    .limit(1);

  return modelo ?? null;
}

/**
 * Cria uma ficha a partir de um modelo dinâmico, preenchida pela profissional. Revalida as respostas
 * contra a definição do modelo (`validarRespostasModelo`) — nunca confia no cliente.
 */
export async function criarFichaDeModelo(input: unknown): Promise<ResultadoFicha> {
  const usuario = autorizarPapel(await auth(), ["profissional"]);
  const parsed = criarFichaDeModeloSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da ficha.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  const { clienteId, modeloFichaId, servicoId, respostas } = parsed.data;
  const modelo = await carregarModelo(modeloFichaId);

  if (!modelo) return { status: "erro", mensagem: "Modelo não encontrado." };

  const validacao = validarRespostasModelo(modelo.campos, respostas);

  if (!validacao.ok) {
    return { status: "erro", mensagem: "Revise as respostas da ficha.", campos: validacao.erros };
  }

  const [registro] = await db
    .insert(ficha)
    .values({
      clienteId,
      servicoId: servicoId ?? null,
      modeloFichaId,
      tipo: null,
      preenchidaPor: "profissional",
      status: "preenchida",
      respostas: validacao.dados,
      criadoPorId: usuario.id,
      atualizadoPorId: usuario.id,
    })
    .returning({ id: ficha.id });

  revalidatePath(`/painel/clientes/${clienteId}`);

  return { status: "sucesso", id: registro.id };
}

export async function editarFichaDinamica(input: unknown): Promise<ResultadoFicha> {
  const usuario = autorizarPapel(await auth(), ["profissional"]);
  const parsed = editarFichaDinamicaSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da ficha.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, clienteId, modeloFichaId, servicoId, respostas } = parsed.data;
  const [registro] = await db.select().from(ficha).where(eq(ficha.id, id)).limit(1);

  if (!registro || registro.clienteId !== clienteId) {
    return { status: "erro", mensagem: "Ficha não encontrada." };
  }

  const modelo = await carregarModelo(modeloFichaId);

  if (!modelo) return { status: "erro", mensagem: "Modelo não encontrado." };

  const validacao = validarRespostasModelo(modelo.campos, respostas);

  if (!validacao.ok) {
    return { status: "erro", mensagem: "Revise as respostas da ficha.", campos: validacao.erros };
  }

  await db
    .update(ficha)
    .set({
      servicoId: servicoId ?? null,
      modeloFichaId,
      respostas: validacao.dados,
      atualizadoPorId: usuario.id,
      atualizadoEm: new Date(),
    })
    .where(eq(ficha.id, id));

  revalidatePath(`/painel/clientes/${clienteId}`);

  return { status: "sucesso", id };
}

const enviarFichaWhatsAppSchema = z.object({
  clienteId: z.string().uuid("Selecione um cliente."),
  modeloFichaId: z.string().uuid("Selecione um modelo."),
  servicoId: servicoIdOpcional,
});

export type ResultadoEnvioWhatsApp =
  | { status: "sucesso"; url: string; enviado: boolean; aviso?: string }
  | { status: "erro"; mensagem: string };

function mensagemFichaWhatsApp(nomeCliente: string, modeloNome: string, url: string) {
  const primeiroNome = nomeCliente.split(" ")[0] || nomeCliente;

  return (
    `Olá, ${primeiroNome}! 💜\n\n` +
    `Para agilizar seu atendimento na Essencial Centro, preencha sua ficha de *${modeloNome}* ` +
    `neste link seguro:\n${url}\n\n` +
    `É rápido e leva poucos minutos. Qualquer dúvida, é só chamar por aqui!`
  );
}

/**
 * Cria uma ficha "aguardando_cliente" com token público e envia o link por WhatsApp para o cliente
 * preencher. Usa `enviarWhatsAppTexto` com o telefone do cadastro DIRETO (não `notificarCliente`,
 * que exige conta no portal — nem todo cliente tem). Sempre retorna a URL para envio manual como
 * reforço se o WhatsApp falhar ou o cliente não tiver telefone.
 */
export async function enviarFichaPorWhatsApp(input: unknown): Promise<ResultadoEnvioWhatsApp> {
  const usuario = autorizarPapel(await auth(), ["profissional"]);
  const parsed = enviarFichaWhatsAppSchema.safeParse(input);

  if (!parsed.success) return { status: "erro", mensagem: "Dados inválidos para o envio." };

  const { clienteId, modeloFichaId, servicoId } = parsed.data;
  const modelo = await carregarModelo(modeloFichaId);

  if (!modelo) return { status: "erro", mensagem: "Modelo não encontrado." };

  const [registroCliente] = await db
    .select({ nome: cliente.nome, telefone: cliente.telefone })
    .from(cliente)
    .where(eq(cliente.id, clienteId))
    .limit(1);

  if (!registroCliente) return { status: "erro", mensagem: "Cliente não encontrado." };

  const token = gerarTokenFicha();
  const agora = new Date();

  await db.insert(ficha).values({
    clienteId,
    servicoId: servicoId ?? null,
    modeloFichaId,
    tipo: null,
    status: "aguardando_cliente",
    respostas: {},
    tokenPublico: token,
    tokenExpiraEm: expiracaoTokenFicha(agora),
    criadoPorId: usuario.id,
    atualizadoPorId: usuario.id,
  });

  const url = await urlFichaPublica(token);
  let enviado = false;
  let aviso: string | undefined;

  if (!registroCliente.telefone) {
    aviso = "Cliente sem telefone cadastrado — copie o link e envie manualmente.";
  } else {
    const resultado = await enviarWhatsAppTexto({
      telefone: registroCliente.telefone,
      mensagem: mensagemFichaWhatsApp(registroCliente.nome, modelo.nome, url),
    });

    enviado = resultado.sent;
    if (!resultado.sent) {
      aviso = resultado.error ?? "Não foi possível enviar pelo WhatsApp — copie o link e envie.";
    }
  }

  revalidatePath(`/painel/clientes/${clienteId}`);

  return { status: "sucesso", url, enviado, aviso };
}

const enviarFichaPublicaSchema = z.object({
  token: z.string().min(10, "Link inválido."),
  respostas: z.record(z.string(), z.unknown()).default({}),
});

export type ResultadoFichaPublica =
  | { status: "sucesso" }
  | { status: "erro"; mensagem: string; campos?: Record<string, string[] | undefined> };

/**
 * Recebe o preenchimento do cliente pelo link público — SEM sessão. Autoriza só pelo token válido
 * (existente, status "aguardando_cliente", não expirado). Valida as respostas contra os campos
 * visíveis ao cliente e marca a ficha como preenchida. O envio é único pelo STATUS (o token
 * permanece para a revisita do link mostrar "Ficha já preenchida" em vez de "link inválido").
 * Atenção: NÃO chamar `revalidatePath` aqui — dentro de Server Action ele re-renderiza a PÁGINA
 * ATUAL (a pública) na mesma resposta e substituiria a tela de sucesso; e ele só afetaria o cache
 * do navegador do cliente, não o da profissional (o painel é dinâmico e busca dado fresco).
 */
export async function enviarFichaPublica(input: unknown): Promise<ResultadoFichaPublica> {
  const parsed = enviarFichaPublicaSchema.safeParse(input);

  if (!parsed.success) return { status: "erro", mensagem: "Não foi possível enviar a ficha." };

  const { token, respostas } = parsed.data;
  const [registro] = await db.select().from(ficha).where(eq(ficha.tokenPublico, token)).limit(1);

  if (!registro || registro.status !== "aguardando_cliente" || !registro.modeloFichaId) {
    return { status: "erro", mensagem: "Este link não está mais disponível." };
  }

  if (tokenFichaExpirado(registro.tokenExpiraEm)) {
    return { status: "erro", mensagem: "Este link expirou. Peça um novo à profissional." };
  }

  const modelo = await carregarModelo(registro.modeloFichaId);

  if (!modelo) return { status: "erro", mensagem: "Modelo não encontrado." };

  const validacao = validarRespostasModelo(camposVisiveisParaCliente(modelo.campos), respostas);

  if (!validacao.ok) {
    return { status: "erro", mensagem: "Revise as respostas da ficha.", campos: validacao.erros };
  }

  // WHERE amarrado ao status: garante envio único mesmo em duplo clique (o 2º não acha o status).
  await db
    .update(ficha)
    .set({
      respostas: validacao.dados,
      status: "preenchida",
      preenchidaPor: "cliente",
      aceiteTermosEm: new Date(),
      atualizadoEm: new Date(),
    })
    .where(and(eq(ficha.id, registro.id), eq(ficha.status, "aguardando_cliente")));

  return { status: "sucesso" };
}

const excluirFichaSchema = z.object({
  fichaId: z.string().uuid("Ficha inválida."),
  clienteId: z.string().uuid("Cliente inválido."),
  confirmarExclusao: z.literal("true", {
    error: "Confirme que entende que a exclusão não pode ser desfeita.",
  }),
});

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
