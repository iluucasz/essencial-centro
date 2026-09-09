"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { agoraBrasilia } from "@/lib/utils";
import { ErroAutorizacao, autorizarPapel } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";
import { enviarEmailNotificacao } from "@/modules/notificacoes/email";
import { enviarWhatsAppMidia } from "@/modules/notificacoes/whatsapp";

import { gerarBufferPdfRecomendacao } from "./pdf-recomendacao";
import {
  editarAnaliseManualSchema,
  excluirAnaliseSchema,
  revisarAnaliseSchema,
  salvarObservacaoAnaliseSchema,
  analiseClinica,
  type EnvioRegistrado,
} from "./schema";

export type EstadoAnalise = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoAnalise = { status: "inicial" };

/** Guarda comum: só `profissional` mexe em análise clínica. */
async function exigirProfissional() {
  return autorizarPapel(await auth(), ["profissional"]);
}

function erroDeValidacao(erro: z.ZodError): EstadoAnalise {
  return {
    status: "erro",
    mensagem: "Revise os dados.",
    campos: z.flattenError(erro).fieldErrors,
  };
}

/**
 * Complemento da profissional. Guardado em coluna SEPARADA de `analiseIa` de propósito: o texto da
 * IA nunca é sobrescrito, então daqui a um ano ainda se sabe o que a máquina disse e o que a pessoa
 * concluiu.
 */
export async function salvarObservacaoAnalise(
  _: EstadoAnalise = estadoInicial,
  formData: FormData,
): Promise<EstadoAnalise> {
  try {
    await exigirProfissional();
  } catch (erro) {
    if (erro instanceof ErroAutorizacao) return { status: "erro", mensagem: erro.message };
    throw erro;
  }

  const dados = salvarObservacaoAnaliseSchema.safeParse({
    id: formData.get("id"),
    clienteId: formData.get("clienteId"),
    observacaoProfissional: formData.get("observacaoProfissional"),
  });

  if (!dados.success) return erroDeValidacao(dados.error);

  const atualizadas = await db
    .update(analiseClinica)
    .set({
      observacaoProfissional: dados.data.observacaoProfissional ?? null,
      atualizadoEm: new Date(),
    })
    .where(
      and(eq(analiseClinica.id, dados.data.id), eq(analiseClinica.clienteId, dados.data.clienteId)),
    )
    .returning({ id: analiseClinica.id });

  if (!atualizadas.length) return { status: "erro", mensagem: "Análise não encontrada." };

  revalidatePath(`/painel/clientes/${dados.data.clienteId}`);

  return { status: "sucesso", mensagem: "Observação salva." };
}

/**
 * Marca a análise como revisada. É a etapa que transforma rascunho de IA em registro clínico válido
 * — deliberadamente separada da criação, igual a `confirmarVerificacaoMedicamento`. Nunca acontece
 * junto com a geração.
 */
export async function revisarAnalise(formData: FormData): Promise<EstadoAnalise> {
  let usuarioAtual;

  try {
    usuarioAtual = await exigirProfissional();
  } catch (erro) {
    if (erro instanceof ErroAutorizacao) return { status: "erro", mensagem: erro.message };
    throw erro;
  }

  const dados = revisarAnaliseSchema.safeParse({
    id: formData.get("id"),
    clienteId: formData.get("clienteId"),
  });

  if (!dados.success) return erroDeValidacao(dados.error);

  const atualizadas = await db
    .update(analiseClinica)
    .set({ revisadoPorId: usuarioAtual.id, revisadoEm: new Date(), atualizadoEm: new Date() })
    .where(
      and(eq(analiseClinica.id, dados.data.id), eq(analiseClinica.clienteId, dados.data.clienteId)),
    )
    .returning({ id: analiseClinica.id });

  if (!atualizadas.length) return { status: "erro", mensagem: "Análise não encontrada." };

  revalidatePath(`/painel/clientes/${dados.data.clienteId}`);

  return { status: "sucesso", mensagem: "Análise marcada como revisada." };
}

/**
 * Edição manual do texto — a profissional reescreve/remove/adiciona campos direto pelo editor
 * (`ModalEditarAnalise`), sem passar pela IA. O campo tipo "Prescrição médica" vem do mesmo editor,
 * mas grava numa coluna separada (`prescricaoMedica`) — nunca passa pelo `blocoAnaliseSchema` que a
 * IA usa, então "Ajustar com IA" e a geração nunca leem nem reescrevem o que está ali.
 *
 * Mesmo tratamento de `analiseIaOriginal` e `refinamentos` do `/api/analises/[id]/refinar`: preserva
 * o texto original na primeira mudança e derruba a revisão, porque o conteúdo revisado deixou de
 * existir — vale tanto pra mudança no texto da IA quanto na prescrição, já que os dois formam o
 * documento que sai no PDF.
 */
export async function editarAnaliseManual(formData: FormData): Promise<EstadoAnalise> {
  try {
    await exigirProfissional();
  } catch (erro) {
    if (erro instanceof ErroAutorizacao) return { status: "erro", mensagem: erro.message };
    throw erro;
  }

  const dados = editarAnaliseManualSchema.safeParse({
    id: formData.get("id"),
    clienteId: formData.get("clienteId"),
    analiseIa: formData.get("analiseIa"),
    prescricaoMedica: formData.get("prescricaoMedica"),
  });

  if (!dados.success) return erroDeValidacao(dados.error);

  const [registro] = await db
    .select({
      analiseIa: analiseClinica.analiseIa,
      analiseIaOriginal: analiseClinica.analiseIaOriginal,
      refinamentos: analiseClinica.refinamentos,
    })
    .from(analiseClinica)
    .where(
      and(eq(analiseClinica.id, dados.data.id), eq(analiseClinica.clienteId, dados.data.clienteId)),
    )
    .limit(1);

  if (!registro) return { status: "erro", mensagem: "Análise não encontrada." };

  await db
    .update(analiseClinica)
    .set({
      analiseIa: dados.data.analiseIa,
      prescricaoMedica: dados.data.prescricaoMedica ?? null,
      // Só na primeira mudança: preserva de onde se partiu, sem sobrescrever nas seguintes.
      analiseIaOriginal: registro.analiseIaOriginal ?? registro.analiseIa,
      refinamentos: [
        ...registro.refinamentos,
        { instrucao: "Edição manual do texto pela profissional.", em: new Date().toISOString() },
      ],
      revisadoPorId: null,
      revisadoEm: null,
      atualizadoEm: new Date(),
    })
    .where(
      and(eq(analiseClinica.id, dados.data.id), eq(analiseClinica.clienteId, dados.data.clienteId)),
    );

  revalidatePath(`/painel/clientes/${dados.data.clienteId}`);

  return { status: "sucesso", mensagem: "Análise atualizada." };
}

export async function excluirAnalise(formData: FormData): Promise<EstadoAnalise> {
  try {
    await exigirProfissional();
  } catch (erro) {
    if (erro instanceof ErroAutorizacao) return { status: "erro", mensagem: erro.message };
    throw erro;
  }

  const dados = excluirAnaliseSchema.safeParse({
    id: formData.get("id"),
    clienteId: formData.get("clienteId"),
    confirmarExclusao: formData.get("confirmarExclusao"),
  });

  if (!dados.success) return erroDeValidacao(dados.error);

  // WHERE amarrado ao cliente: id de outro cliente não encontra linha em vez de apagar às cegas.
  await db
    .delete(analiseClinica)
    .where(
      and(eq(analiseClinica.id, dados.data.id), eq(analiseClinica.clienteId, dados.data.clienteId)),
    );

  revalidatePath(`/painel/clientes/${dados.data.clienteId}`);

  return { status: "sucesso", mensagem: "Análise removida." };
}

const enviarRecomendacaoSchema = revisarAnaliseSchema;

/**
 * Dados pra montar o PDF de envio: só existe pra `recomendacao` (as outras vêm de arquivo, não fazem
 * sentido virar carta pro paciente) — quem chama confere `tipo` antes de gerar o PDF.
 */
type ContextoEnvioRecomendacao = NonNullable<Awaited<ReturnType<typeof carregarContextoEnvio>>>;

async function carregarContextoEnvio(id: string, clienteId: string) {
  const [analise] = await db
    .select({
      tipo: analiseClinica.tipo,
      analiseIa: analiseClinica.analiseIa,
      prescricaoMedica: analiseClinica.prescricaoMedica,
      enviosRegistrados: analiseClinica.enviosRegistrados,
    })
    .from(analiseClinica)
    .where(and(eq(analiseClinica.id, id), eq(analiseClinica.clienteId, clienteId)))
    .limit(1);

  if (!analise) return null;

  const [dadosCliente] = await db
    .select({
      nome: cliente.nome,
      dataNascimento: cliente.dataNascimento,
      peso: cliente.peso,
      altura: cliente.altura,
      queixas: cliente.queixas,
      objetivoTratamento: cliente.objetivoTratamento,
      telefone: cliente.telefone,
      email: cliente.email,
    })
    .from(cliente)
    .where(eq(cliente.id, clienteId))
    .limit(1);

  if (!dadosCliente) return null;

  return { ...analise, cliente: dadosCliente };
}

async function gerarPdfParaEnvio(contexto: ContextoEnvioRecomendacao, profissionalNome: string) {
  return gerarBufferPdfRecomendacao({
    clienteNome: contexto.cliente.nome,
    clienteDataNascimento: contexto.cliente.dataNascimento,
    clientePeso: contexto.cliente.peso,
    clienteAltura: contexto.cliente.altura,
    clienteQueixas: contexto.cliente.queixas,
    clienteObjetivo: contexto.cliente.objetivoTratamento,
    profissionalNome,
    dataEmissao: agoraBrasilia(),
    conteudo: contexto.analiseIa,
    prescricaoMedica: contexto.prescricaoMedica,
  });
}

async function registrarEnvioRecomendacao(
  id: string,
  clienteId: string,
  enviosAtuais: EnvioRegistrado[],
  envio: EnvioRegistrado,
) {
  await db
    .update(analiseClinica)
    .set({ enviosRegistrados: [...enviosAtuais, envio], atualizadoEm: new Date() })
    .where(and(eq(analiseClinica.id, id), eq(analiseClinica.clienteId, clienteId)));
}

/**
 * Envia o PDF da recomendação por WhatsApp — o PDF vai em base64 puro (nunca por URL pública): é
 * dado clínico, e diferente do anexo de campanha (`modules/whatsapp`), aqui não existe um blob
 * público de propósito. Mesmo padrão do QR de presença (`modules/agenda/qr-whatsapp.ts`).
 */
export async function enviarRecomendacaoWhatsApp(formData: FormData): Promise<EstadoAnalise> {
  let usuarioAtual;

  try {
    usuarioAtual = await exigirProfissional();
  } catch (erro) {
    if (erro instanceof ErroAutorizacao) return { status: "erro", mensagem: erro.message };
    throw erro;
  }

  const dados = enviarRecomendacaoSchema.safeParse({
    id: formData.get("id"),
    clienteId: formData.get("clienteId"),
  });

  if (!dados.success) return erroDeValidacao(dados.error);

  const contexto = await carregarContextoEnvio(dados.data.id, dados.data.clienteId);
  if (!contexto) return { status: "erro", mensagem: "Análise não encontrada." };
  if (contexto.tipo !== "recomendacao") {
    return { status: "erro", mensagem: "Envio disponível só para recomendação terapêutica." };
  }
  if (!contexto.cliente.telefone) {
    return { status: "erro", mensagem: "Cliente não tem telefone cadastrado." };
  }

  const { buffer, nomeArquivo } = await gerarPdfParaEnvio(
    contexto,
    usuarioAtual.name ?? "Essencial Centro",
  );
  const primeiroNome = contexto.cliente.nome.trim().split(/\s+/)[0] ?? contexto.cliente.nome;

  const resultado = await enviarWhatsAppMidia({
    telefone: contexto.cliente.telefone,
    media: buffer.toString("base64"),
    mediatype: "document",
    mimetype: "application/pdf",
    legenda: `Olá, ${primeiroNome}! Segue sua recomendação terapêutica em PDF.`,
    nomeArquivo,
  });

  if (!resultado.sent) {
    // `error` vem preenchido tanto por falha da Evolution API quanto por telefone inválido — só
    // cai no genérico "não configurado" quando o canal está mesmo desligado (`error: null`).
    return { status: "erro", mensagem: resultado.error ?? "WhatsApp não está configurado." };
  }

  await registrarEnvioRecomendacao(
    dados.data.id,
    dados.data.clienteId,
    contexto.enviosRegistrados,
    {
      canal: "whatsapp",
      em: new Date().toISOString(),
      porId: usuarioAtual.id,
    },
  );

  revalidatePath(`/painel/clientes/${dados.data.clienteId}`);

  return { status: "sucesso", mensagem: "Recomendação enviada por WhatsApp." };
}

/** Envia o PDF da recomendação por e-mail, como anexo — via Brevo (`enviarEmailNotificacao`). */
export async function enviarRecomendacaoEmail(formData: FormData): Promise<EstadoAnalise> {
  let usuarioAtual;

  try {
    usuarioAtual = await exigirProfissional();
  } catch (erro) {
    if (erro instanceof ErroAutorizacao) return { status: "erro", mensagem: erro.message };
    throw erro;
  }

  const dados = enviarRecomendacaoSchema.safeParse({
    id: formData.get("id"),
    clienteId: formData.get("clienteId"),
  });

  if (!dados.success) return erroDeValidacao(dados.error);

  const contexto = await carregarContextoEnvio(dados.data.id, dados.data.clienteId);
  if (!contexto) return { status: "erro", mensagem: "Análise não encontrada." };
  if (contexto.tipo !== "recomendacao") {
    return { status: "erro", mensagem: "Envio disponível só para recomendação terapêutica." };
  }
  if (!contexto.cliente.email) {
    return { status: "erro", mensagem: "Cliente não tem e-mail cadastrado." };
  }

  const { buffer, nomeArquivo } = await gerarPdfParaEnvio(
    contexto,
    usuarioAtual.name ?? "Essencial Centro",
  );
  const primeiroNome = contexto.cliente.nome.trim().split(/\s+/)[0] ?? contexto.cliente.nome;

  const resultado = await enviarEmailNotificacao({
    destinatarioEmail: contexto.cliente.email,
    destinatarioNome: contexto.cliente.nome,
    titulo: "Sua recomendação terapêutica — Essencial Centro",
    mensagem: `Olá, ${primeiroNome}! Segue em anexo sua recomendação terapêutica.`,
    anexo: { conteudoBase64: buffer.toString("base64"), nomeArquivo },
  });

  if (!resultado.sent) {
    return { status: "erro", mensagem: resultado.error ?? "E-mail não está configurado." };
  }

  await registrarEnvioRecomendacao(
    dados.data.id,
    dados.data.clienteId,
    contexto.enviosRegistrados,
    {
      canal: "email",
      em: new Date().toISOString(),
      porId: usuarioAtual.id,
    },
  );

  revalidatePath(`/painel/clientes/${dados.data.clienteId}`);

  return { status: "sucesso", mensagem: "Recomendação enviada por e-mail." };
}
