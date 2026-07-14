"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";

import { auth, signIn, signOut } from "@/auth";

import { contarUsuarios, criarUsuarioComSenha } from "./credenciais";
import { autorizarPapel } from "./rbac";
import { credenciaisEntradaSchema, criarUsuarioSchema } from "./schema";

export type EstadoFormularioAuth = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioAuth = { status: "inicial" };

function erroValidacao(
  campos: Record<string, string[] | undefined>,
  mensagem: string,
): EstadoFormularioAuth {
  return {
    status: "erro",
    mensagem,
    campos,
  };
}

function isEmailDuplicado(error: unknown) {
  return error instanceof Error && error.message.includes("usuario_email_unique");
}

export async function entrar(_: EstadoFormularioAuth = estadoInicial, formData: FormData) {
  const parsed = credenciaisEntradaSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return erroValidacao(parsed.error.flatten().fieldErrors, "Revise os dados de entrada.");
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      senha: parsed.data.senha,
      redirectTo: "/entrar/redirecionar",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        status: "erro",
        mensagem: "E-mail ou senha inválidos.",
      } satisfies EstadoFormularioAuth;
    }

    throw error;
  }

  return estadoInicial;
}

export async function sair() {
  await signOut({ redirectTo: "/entrar" });
}

export async function criarPrimeiroAcesso(
  _: EstadoFormularioAuth = estadoInicial,
  formData: FormData,
) {
  const totalUsuarios = await contarUsuarios();
  if (totalUsuarios > 0) {
    return {
      status: "erro",
      mensagem: "O primeiro acesso já foi configurado.",
    } satisfies EstadoFormularioAuth;
  }

  const parsed = criarUsuarioSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    role: "profissional",
  });

  if (!parsed.success) {
    return erroValidacao(parsed.error.flatten().fieldErrors, "Revise os dados do primeiro acesso.");
  }

  try {
    await criarUsuarioComSenha(parsed.data);
  } catch (error) {
    if (isEmailDuplicado(error)) {
      return {
        status: "erro",
        mensagem: "Já existe um usuário com este e-mail.",
      } satisfies EstadoFormularioAuth;
    }

    throw error;
  }

  revalidatePath("/entrar");

  await signIn("credentials", {
    email: parsed.data.email,
    senha: parsed.data.senha,
    redirectTo: "/entrar/redirecionar",
  });

  return estadoInicial;
}

export async function criarUsuario(_: EstadoFormularioAuth = estadoInicial, formData: FormData) {
  const sessao = await auth();
  autorizarPapel(sessao, ["profissional"]);

  const parsed = criarUsuarioSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    role: formData.get("role"),
    clienteId: formData.get("clienteId"),
  });

  if (!parsed.success) {
    return erroValidacao(parsed.error.flatten().fieldErrors, "Revise os dados do usuário.");
  }

  try {
    await criarUsuarioComSenha(parsed.data);
  } catch (error) {
    if (isEmailDuplicado(error)) {
      return {
        status: "erro",
        mensagem: "Já existe um usuário com este e-mail.",
      } satisfies EstadoFormularioAuth;
    }

    throw error;
  }

  revalidatePath("/painel");

  return {
    status: "sucesso",
    mensagem: "Usuário criado com sucesso.",
  } satisfies EstadoFormularioAuth;
}
