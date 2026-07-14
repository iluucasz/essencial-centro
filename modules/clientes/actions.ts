"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { cliente, criarClienteSchema } from "./schema";

export type EstadoFormularioCliente = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioCliente = { status: "inicial" };

function checkboxAtivo(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function isEmailDuplicado(error: unknown) {
  return error instanceof Error && error.message.includes("cliente_email_unique");
}

export async function criarCliente(_: EstadoFormularioCliente = estadoInicial, formData: FormData) {
  const usuario = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = criarClienteSchema.safeParse({
    nome: getValor(formData, "nome"),
    dataNascimento: getValor(formData, "dataNascimento"),
    telefone: getValor(formData, "telefone"),
    email: getValor(formData, "email"),
    endereco: getValor(formData, "endereco"),
    contatoEmergenciaNome: getValor(formData, "contatoEmergenciaNome"),
    contatoEmergenciaTelefone: getValor(formData, "contatoEmergenciaTelefone"),
    profissao: getValor(formData, "profissao"),
    objetivoTratamento: getValor(formData, "objetivoTratamento"),
    alergias: getValor(formData, "alergias"),
    medicamentos: getValor(formData, "medicamentos"),
    condicoesSaude: getValor(formData, "condicoesSaude"),
    cirurgias: getValor(formData, "cirurgias"),
    contraindicacoes: getValor(formData, "contraindicacoes"),
    consentimentoDados: checkboxAtivo(getValor(formData, "consentimentoDados")),
    consentimentoImagem: checkboxAtivo(getValor(formData, "consentimentoImagem")),
    observacoesInternas: getValor(formData, "observacoesInternas"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do cliente.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioCliente;
  }

  try {
    await db.insert(cliente).values({
      ...parsed.data,
      criadoPorId: usuario.id,
      atualizadoPorId: usuario.id,
    });
  } catch (error) {
    if (isEmailDuplicado(error)) {
      return {
        status: "erro",
        mensagem: "Já existe um cliente com este e-mail.",
      } satisfies EstadoFormularioCliente;
    }

    throw error;
  }

  revalidatePath("/painel/clientes");

  return {
    status: "sucesso",
    mensagem: "Cliente cadastrado com sucesso.",
  } satisfies EstadoFormularioCliente;
}
