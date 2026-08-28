"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { enviarWhatsAppTexto } from "@/modules/notificacoes/whatsapp";

import { dispararMensagensAniversario } from "./aniversario-job";
import { personalizarMensagem } from "./mensagens";
import { listarClientesComTelefone } from "./queries";
import {
  atualizarConfiguracaoAniversarioSchema,
  campanhaMensagem,
  configuracaoAniversario,
  enviarCampanhaSchema,
  envioCampanhaMensagem,
  mensagemPredefinida,
  salvarMensagemPredefinidaSchema,
} from "./schema";

/*
  Enviar pra muitos clientes é sequencial e com pequena pausa entre mensagens (ver
  `PAUSA_ENTRE_ENVIOS_MS`) — rajada de mensagens é o padrão que provedores de WhatsApp associam a
  spam. Numa clínica pequena isso cabe dentro do tempo de uma função serverless (o `maxDuration`
  estendido fica em app/painel/whatsapp/page.tsx — Server Action não pode exportar isso, só a
  página); se a base de clientes crescer muito, esse fluxo síncrono vai precisar virar fila em
  background.
*/

export type EstadoConfiguracaoAniversario = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoConfiguracaoAniversario = { status: "inicial" };

export async function atualizarConfiguracaoAniversario(
  _: EstadoConfiguracaoAniversario = estadoInicial,
  formData: FormData,
): Promise<EstadoConfiguracaoAniversario> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = atualizarConfiguracaoAniversarioSchema.safeParse({
    ativo: formData.get("ativo"),
    brinde: formData.get("brinde"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da automação.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  const [existente] = await db
    .select({ id: configuracaoAniversario.id })
    .from(configuracaoAniversario)
    .limit(1);

  const valores = {
    ativo: parsed.data.ativo,
    brinde: parsed.data.brinde ?? null,
    atualizadoPorId: usuarioAtual.id,
    atualizadoEm: new Date(),
  };

  if (existente) {
    await db
      .update(configuracaoAniversario)
      .set(valores)
      .where(eq(configuracaoAniversario.id, existente.id));
  } else {
    await db.insert(configuracaoAniversario).values(valores);
  }

  revalidatePath("/painel/whatsapp");

  return { status: "sucesso", mensagem: "Automação de aniversário atualizada." };
}

export type EstadoDisparoAniversario = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

/**
 * "Disparar agora" — roda o MESMO job do cron, sob demanda. Não é um teste separado: se a
 * automação estiver desativada ou não houver aniversariante hoje, simplesmente não envia nada,
 * do mesmo jeito que o cron não enviaria.
 */
export async function dispararAniversariosAgora(): Promise<EstadoDisparoAniversario> {
  autorizarPapel(await auth(), ["profissional"]);

  const resultado = await dispararMensagensAniversario();

  revalidatePath("/painel/whatsapp");

  if (!resultado.ativo) {
    return { status: "erro", mensagem: "A automação está desativada — ative antes de disparar." };
  }

  return {
    status: "sucesso",
    mensagem:
      resultado.enviados === 0
        ? "Nenhum cliente faz aniversário hoje (ou a mensagem já foi enviada)."
        : `${resultado.enviados} mensagem(ns) de aniversário enviada(s).`,
  };
}

export type EstadoMensagemPredefinida = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicialMensagemPredefinida: EstadoMensagemPredefinida = { status: "inicial" };

/** Cria ou atualiza (conforme `id` vir preenchido no form) — mesmo padrão de FormularioCliente/Usuario. */
export async function salvarMensagemPredefinida(
  _: EstadoMensagemPredefinida = estadoInicialMensagemPredefinida,
  formData: FormData,
): Promise<EstadoMensagemPredefinida> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = salvarMensagemPredefinidaSchema.safeParse({
    id: formData.get("id"),
    titulo: formData.get("titulo"),
    conteudo: formData.get("conteudo"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados da mensagem.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.id) {
    await db
      .update(mensagemPredefinida)
      .set({
        titulo: parsed.data.titulo,
        conteudo: parsed.data.conteudo,
        atualizadoEm: new Date(),
      })
      .where(eq(mensagemPredefinida.id, parsed.data.id));
  } else {
    await db.insert(mensagemPredefinida).values({
      titulo: parsed.data.titulo,
      conteudo: parsed.data.conteudo,
      criadoPorId: usuarioAtual.id,
    });
  }

  revalidatePath("/painel/whatsapp");

  return {
    status: "sucesso",
    mensagem: parsed.data.id ? "Mensagem atualizada." : "Mensagem predefinida criada.",
  };
}

export type EstadoExclusaoMensagemPredefinida = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

export async function excluirMensagemPredefinida(
  id: string,
): Promise<EstadoExclusaoMensagemPredefinida> {
  autorizarPapel(await auth(), ["profissional"]);

  await db.delete(mensagemPredefinida).where(eq(mensagemPredefinida.id, id));

  revalidatePath("/painel/whatsapp");

  return { status: "sucesso", mensagem: "Mensagem predefinida excluída." };
}

export type EstadoEnvioCampanha = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicialEnvioCampanha: EstadoEnvioCampanha = { status: "inicial" };
const PAUSA_ENTRE_ENVIOS_MS = 350;

function aguardar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Dispara uma campanha: resolve os destinatários (todos com telefone, ou só os selecionados),
 * personaliza `{nome}` por cliente e manda um a um, com pequena pausa entre envios. Registra CADA
 * destinatário em `envioCampanhaMensagem` — inclusive as falhas — pra o histórico refletir a
 * realidade, não só a intenção de enviar.
 */
export async function enviarCampanhaMensagem(
  _: EstadoEnvioCampanha = estadoInicialEnvioCampanha,
  formData: FormData,
): Promise<EstadoEnvioCampanha> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const parsed = enviarCampanhaSchema.safeParse({
    conteudo: formData.get("conteudo"),
    mensagemPredefinidaId: formData.get("mensagemPredefinidaId"),
    destinatarios: formData.get("destinatarios"),
    clienteIds: formData.getAll("clienteIds"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do envio.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  const candidatos = await listarClientesComTelefone();
  const destinatariosAlvo =
    parsed.data.destinatarios === "todos"
      ? candidatos
      : candidatos.filter((c) => parsed.data.clienteIds.includes(c.id));

  if (destinatariosAlvo.length === 0) {
    return { status: "erro", mensagem: "Nenhum destinatário com telefone cadastrado." };
  }

  const [campanha] = await db
    .insert(campanhaMensagem)
    .values({
      conteudo: parsed.data.conteudo,
      mensagemPredefinidaId: parsed.data.mensagemPredefinidaId ?? null,
      destinatarios: parsed.data.destinatarios,
      criadoPorId: usuarioAtual.id,
    })
    .returning({ id: campanhaMensagem.id });

  if (!campanha) {
    return { status: "erro", mensagem: "Não foi possível iniciar o envio. Tente novamente." };
  }

  let enviados = 0;
  let falhas = 0;

  for (const destinatario of destinatariosAlvo) {
    if (!destinatario.telefone) continue;

    const primeiroNome = destinatario.nome.trim().split(/\s+/)[0] ?? destinatario.nome;
    const resultado = await enviarWhatsAppTexto({
      telefone: destinatario.telefone,
      mensagem: personalizarMensagem(parsed.data.conteudo, primeiroNome),
    });

    await db.insert(envioCampanhaMensagem).values({
      campanhaId: campanha.id,
      clienteId: destinatario.id,
      status: resultado.sent ? "enviado" : "falhou",
      erro: resultado.sent ? null : (resultado.error ?? "Falha desconhecida no envio."),
    });

    if (resultado.sent) enviados += 1;
    else falhas += 1;

    await aguardar(PAUSA_ENTRE_ENVIOS_MS);
  }

  revalidatePath("/painel/whatsapp");

  return {
    status: falhas > 0 && enviados === 0 ? "erro" : "sucesso",
    mensagem:
      falhas === 0
        ? `Mensagem enviada para ${enviados} cliente(s).`
        : `${enviados} enviada(s), ${falhas} falharam — confira a conexão do WhatsApp em Configurações.`,
  };
}
