"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { violaConstraintUnica } from "@/lib/db-erros";
import { autorizarEscrita } from "@/modules/auth/rbac";
import { enviarWhatsAppTexto, normalizarTelefone } from "@/modules/notificacoes/whatsapp";

import {
  conviteExpirado,
  expiracaoConvite,
  gerarTokenConvite,
  mensagemConviteWhatsApp,
} from "./convite";
import { lerFormularioCliente } from "./formulario";
import { cadastroPublicoClienteSchema, cliente, conviteCadastroCliente } from "./schema";
import { urlCadastroPublico } from "./url-publica";

export type ResultadoEnvioCadastro =
  | { status: "sucesso"; url: string; enviado: boolean; aviso?: string }
  | { status: "erro"; mensagem: string };

const enviarCadastroSchema = z.object({
  telefone: z
    .string()
    .trim()
    .refine((valor) => normalizarTelefone(valor) !== null, "Informe um WhatsApp válido com DDD."),
});

/**
 * Gera um convite de autocadastro e envia o link ao WhatsApp informado. Não cria cliente nem acesso
 * ao portal — o cadastro só nasce quando o próprio cliente envia o formulário. Sempre devolve a URL
 * para envio manual se o WhatsApp falhar.
 */
export async function enviarCadastroPorWhatsApp(input: unknown): Promise<ResultadoEnvioCadastro> {
  const usuarioAtual = autorizarEscrita(await auth(), ["profissional", "recepcao"]);
  const parsed = enviarCadastroSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: parsed.error.issues[0]?.message ?? "Informe um WhatsApp válido com DDD.",
    };
  }

  const token = gerarTokenConvite();

  await db.insert(conviteCadastroCliente).values({
    telefone: parsed.data.telefone,
    token,
    tokenExpiraEm: expiracaoConvite(),
    criadoPorId: usuarioAtual.id,
  });

  const url = await urlCadastroPublico(token);
  const resultado = await enviarWhatsAppTexto({
    telefone: parsed.data.telefone,
    mensagem: mensagemConviteWhatsApp(url),
  });

  return {
    status: "sucesso",
    url,
    enviado: resultado.sent,
    aviso: resultado.sent
      ? undefined
      : (resultado.error ?? "Não foi possível enviar pelo WhatsApp — copie o link e envie."),
  };
}

export type EstadoCadastroPublico = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const LINK_INDISPONIVEL = "Este link não está mais disponível. Peça um novo à Essencial Centro.";

async function reabrirConvite(id: string) {
  await db
    .update(conviteCadastroCliente)
    .set({ status: "pendente", concluidoEm: null })
    .where(eq(conviteCadastroCliente.id, id));
}

/**
 * Recebe o autocadastro pelo link público — SEM sessão. Autoriza só pelo token (existente, pendente,
 * não expirado). O convite é reservado ANTES de inserir (UPDATE amarrado ao status), então um duplo
 * clique não cria dois clientes; se a inserção falhar, o convite volta a pendente para nova tentativa.
 * Não cria acesso ao portal. NÃO chama `revalidatePath` (re-renderizaria a página pública atual —
 * ver `enviarFichaPublica`); o painel de clientes é dinâmico e já busca dado fresco.
 */
export async function concluirCadastroPublico(
  _: EstadoCadastroPublico,
  formData: FormData,
): Promise<EstadoCadastroPublico> {
  const token = formData.get("token");

  if (typeof token !== "string" || token.length < 10) {
    return { status: "erro", mensagem: LINK_INDISPONIVEL };
  }

  const parsed = cadastroPublicoClienteSchema.safeParse(lerFormularioCliente(formData));

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados destacados.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  const [convite] = await db
    .select()
    .from(conviteCadastroCliente)
    .where(eq(conviteCadastroCliente.token, token))
    .limit(1);

  if (!convite || convite.status !== "pendente") {
    return { status: "erro", mensagem: LINK_INDISPONIVEL };
  }

  if (conviteExpirado(convite.tokenExpiraEm)) {
    return { status: "erro", mensagem: "Este link expirou. Peça um novo à Essencial Centro." };
  }

  const reservados = await db
    .update(conviteCadastroCliente)
    .set({ status: "concluido", concluidoEm: new Date() })
    .where(
      and(eq(conviteCadastroCliente.id, convite.id), eq(conviteCadastroCliente.status, "pendente")),
    )
    .returning({ id: conviteCadastroCliente.id });

  if (reservados.length === 0) return { status: "erro", mensagem: LINK_INDISPONIVEL };

  try {
    const [criado] = await db
      .insert(cliente)
      .values({ ...parsed.data, criadoPorId: convite.criadoPorId })
      .returning({ id: cliente.id });

    if (!criado) throw new Error("Cliente não retornado após a inserção.");

    await db
      .update(conviteCadastroCliente)
      .set({ clienteId: criado.id })
      .where(eq(conviteCadastroCliente.id, convite.id));
  } catch (error) {
    await reabrirConvite(convite.id);

    if (violaConstraintUnica(error, "cliente_email_unique")) {
      return {
        status: "erro",
        mensagem: "Revise os dados destacados.",
        campos: {
          email: ["Este e-mail já está cadastrado. Use outro ou fale com a Essencial Centro."],
        },
      };
    }

    throw error;
  }

  return { status: "sucesso" };
}
