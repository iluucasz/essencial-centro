import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { violaConstraintUnica } from "@/lib/db-erros";
import { enviarWhatsAppTexto } from "@/modules/notificacoes/whatsapp";

import { mensagemBoasVindasPortal } from "./boas-vindas";
import { urlEntradaPortal } from "./entrada-url";
import { usuario } from "./schema";
import { gerarHashSenha } from "./senha";
import { gerarSenhaProvisoria } from "./senha-provisoria";

/**
 * Criação do acesso ao portal de um cliente. Fica separado de `criarUsuarioComSenha` (a tela
 * Usuários, onde a senha é digitada por quem cadastra) porque aqui a senha é GERADA e devolvida uma
 * única vez pra clínica repassar — depois só existe como hash.
 *
 * `whatsapp` reporta o envio da mensagem de boas-vindas: a profissional precisa saber se a senha
 * REALMENTE chegou ao cliente (pra decidir se repassa por outro meio), não só que a conta existe.
 */
export type ResultadoAcessoPortal =
  | { criado: true; email: string; senhaProvisoria: string; whatsapp: ResultadoEnvioWhatsApp }
  | { criado: false; motivo: "sem-email" | "email-em-uso" | "ja-tem-acesso" };

export type ResultadoEnvioWhatsApp =
  { enviado: true } | { enviado: false; motivo: "sem-telefone" | "falha-no-envio" };

/** Mensagem pra profissional — o motivo técnico não diz o que ela deve fazer a respeito. */
export const MOTIVOS_ACESSO_PORTAL: Record<
  Extract<ResultadoAcessoPortal, { criado: false }>["motivo"],
  string
> = {
  "sem-email": "Cliente sem e-mail cadastrado — o acesso ao portal precisa de um e-mail.",
  "email-em-uso": "Já existe um usuário com este e-mail. Vincule-o pela tela Usuários.",
  "ja-tem-acesso": "Este cliente já tem acesso ao portal.",
};

/**
 * Cria o usuário `cliente` vinculado ao cadastro, com senha provisória e `deveTrocarSenha`.
 *
 * Nunca lança por conflito: cliente sem e-mail e e-mail já usado por outra conta são situações
 * normais do balcão, não erros — devolvem `criado: false` pra que o cadastro do cliente siga em
 * frente. Perder o cliente inteiro porque o acesso ao portal falhou seria pior que não ter o acesso.
 */
export async function criarAcessoPortal({
  clienteId,
  nome,
  email,
  telefone,
}: {
  clienteId: string;
  nome: string;
  email: string | null | undefined;
  telefone: string | null | undefined;
}): Promise<ResultadoAcessoPortal> {
  const emailNormalizado = email?.trim().toLowerCase();

  if (!emailNormalizado) return { criado: false, motivo: "sem-email" };

  const [jaVinculado] = await db
    .select({ id: usuario.id })
    .from(usuario)
    .where(and(eq(usuario.clienteId, clienteId), eq(usuario.role, "cliente")))
    .limit(1);

  if (jaVinculado) return { criado: false, motivo: "ja-tem-acesso" };

  const senhaProvisoria = gerarSenhaProvisoria();
  const senhaHash = await gerarHashSenha(senhaProvisoria);

  try {
    await db.insert(usuario).values({
      name: nome,
      email: emailNormalizado,
      role: "cliente",
      clienteId,
      senhaHash,
      deveTrocarSenha: true,
    });
  } catch (erro) {
    // O índice único do e-mail é a checagem de verdade: entre o SELECT e o INSERT cabe outra sessão.
    if (violaConstraintUnica(erro, "usuario_email_unique")) {
      return { criado: false, motivo: "email-em-uso" };
    }

    throw erro;
  }

  const whatsapp = await enviarBoasVindasPortal({
    nome,
    telefone,
    email: emailNormalizado,
    senhaProvisoria,
  });

  return { criado: true, email: emailNormalizado, senhaProvisoria, whatsapp };
}

/**
 * Envia e-mail + senha provisória por WhatsApp direto pro telefone do cadastro — não por
 * `notificarCliente`, porque naquele instante o `usuario` acabou de nascer e ainda não teria
 * histórico algum de notificação in-app fazendo falta (o WhatsApp aqui É a notificação de boas-vindas).
 * Nunca lança: falha de envio não desfaz a conta, só informa a profissional pra repassar por outro meio.
 */
async function enviarBoasVindasPortal({
  nome,
  telefone,
  email,
  senhaProvisoria,
}: {
  nome: string;
  telefone: string | null | undefined;
  email: string;
  senhaProvisoria: string;
}): Promise<ResultadoEnvioWhatsApp> {
  if (!telefone) return { enviado: false, motivo: "sem-telefone" };

  const primeiroNome = nome.trim().split(/\s+/)[0] ?? nome;

  const resultado = await enviarWhatsAppTexto({
    telefone,
    mensagem: mensagemBoasVindasPortal({
      primeiroNome,
      email,
      senhaProvisoria,
      url: await urlEntradaPortal(),
    }),
  });

  return resultado.sent ? { enviado: true } : { enviado: false, motivo: "falha-no-envio" };
}

/**
 * Se o usuário logado ainda está preso na senha provisória. Lido do BANCO, não do JWT: o token é
 * emitido no login e continuaria dizendo `true` depois da troca, prendendo a pessoa num laço de
 * redirecionamento. É uma leitura por chave primária, barata o suficiente pra rodar no layout.
 */
export async function precisaDefinirSenha(usuarioId: string) {
  const [registro] = await db
    .select({ deveTrocarSenha: usuario.deveTrocarSenha })
    .from(usuario)
    .where(eq(usuario.id, usuarioId))
    .limit(1);

  return registro?.deveTrocarSenha === true;
}

/** Se o cliente já tem login no portal — decide se a profissional vê o botão "Criar acesso". */
export async function clienteTemAcessoPortal(clienteId: string) {
  const [registro] = await db
    .select({ id: usuario.id })
    .from(usuario)
    .where(and(eq(usuario.clienteId, clienteId), eq(usuario.role, "cliente")))
    .limit(1);

  return Boolean(registro);
}
