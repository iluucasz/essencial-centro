"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { agendamento } from "@/modules/agenda/schema";
import { autorizarPapel } from "@/modules/auth/rbac";
import { usuario } from "@/modules/auth/schema";
import { biometriaCliente, tentativaIdentificacaoBiometrica } from "@/modules/biometria/schema";
import { documento } from "@/modules/documentos/schema";
import { ficha } from "@/modules/fichas/schema";
import { lancamentoFinanceiro } from "@/modules/financeiro/schema";
import { foto } from "@/modules/fotos/schema";
import { medida } from "@/modules/medidas/schema";
import { medicamentoInformado } from "@/modules/medicamentos/schema";
import { pacote } from "@/modules/pacotes/schema";
import { sessao } from "@/modules/sessoes/schema";

import { cliente, criarClienteSchema } from "./schema";

export type EstadoFormularioCliente = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioCliente = { status: "inicial" };
const clienteIdSchema = z.string().uuid("Cliente inválido.");

export type EstadoExclusaoCliente = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

const estadoInicialExclusao: EstadoExclusaoCliente = { status: "inicial" };

function checkboxAtivo(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function isEmailDuplicado(error: unknown) {
  return error instanceof Error && error.message.includes("cliente_email_unique");
}

function parseFormularioCliente(formData: FormData) {
  return criarClienteSchema.safeParse({
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
}

export async function criarCliente(_: EstadoFormularioCliente = estadoInicial, formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);
  const parsed = parseFormularioCliente(formData);

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
      criadoPorId: usuarioAtual.id,
      atualizadoPorId: usuarioAtual.id,
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

export async function atualizarCliente(
  _: EstadoFormularioCliente = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);
  const clienteId = clienteIdSchema.safeParse(getValor(formData, "id"));
  const parsed = parseFormularioCliente(formData);

  if (!clienteId.success) {
    return {
      status: "erro",
      mensagem: "Cliente inválido.",
      campos: { id: clienteId.error.flatten().formErrors },
    } satisfies EstadoFormularioCliente;
  }

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do cliente.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioCliente;
  }

  try {
    const atualizados = await db
      .update(cliente)
      .set({
        ...parsed.data,
        atualizadoPorId: usuarioAtual.id,
        atualizadoEm: new Date(),
      })
      .where(eq(cliente.id, clienteId.data))
      .returning({ id: cliente.id });

    if (atualizados.length === 0) {
      return {
        status: "erro",
        mensagem: "Cliente não encontrado.",
      } satisfies EstadoFormularioCliente;
    }
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
  revalidatePath(`/painel/clientes/${clienteId.data}`);

  return {
    status: "sucesso",
    mensagem: "Cliente atualizado com sucesso.",
  } satisfies EstadoFormularioCliente;
}

export async function excluirCliente(
  _: EstadoExclusaoCliente = estadoInicialExclusao,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);
  const clienteId = clienteIdSchema.safeParse(getValor(formData, "clienteId"));
  const exclusaoConfirmada = checkboxAtivo(getValor(formData, "confirmarExclusao"));

  if (!clienteId.success) {
    return {
      status: "erro",
      mensagem: "Cliente inválido.",
    } satisfies EstadoExclusaoCliente;
  }

  if (!exclusaoConfirmada) {
    return {
      status: "erro",
      mensagem: "Confirme que entende a exclusão antes de continuar.",
    } satisfies EstadoExclusaoCliente;
  }

  try {
    const [registro] = await db
      .select({ id: cliente.id })
      .from(cliente)
      .where(eq(cliente.id, clienteId.data))
      .limit(1);

    if (!registro) {
      return {
        status: "erro",
        mensagem: "Cliente não encontrado.",
      } satisfies EstadoExclusaoCliente;
    }

    // O driver neon-http não suporta `transaction()`; `batch()` roda tudo numa única transação HTTP,
    // preservando esta ordem (dependente de FK: soltar/limpar vínculos antes de apagar o cadastro).
    await db.batch([
      db
        .update(usuario)
        .set({ clienteId: null, atualizadoEm: new Date() })
        .where(eq(usuario.clienteId, clienteId.data)),

      db
        .update(lancamentoFinanceiro)
        .set({
          clienteId: null,
          atualizadoPorId: usuarioAtual.id,
          atualizadoEm: new Date(),
        })
        .where(eq(lancamentoFinanceiro.clienteId, clienteId.data)),

      db
        .update(tentativaIdentificacaoBiometrica)
        .set({ clienteId: null })
        .where(eq(tentativaIdentificacaoBiometrica.clienteId, clienteId.data)),

      db.delete(biometriaCliente).where(eq(biometriaCliente.clienteId, clienteId.data)),
      db.delete(foto).where(eq(foto.clienteId, clienteId.data)),
      db.delete(medida).where(eq(medida.clienteId, clienteId.data)),
      db.delete(documento).where(eq(documento.clienteId, clienteId.data)),
      db.delete(ficha).where(eq(ficha.clienteId, clienteId.data)),
      db.delete(medicamentoInformado).where(eq(medicamentoInformado.clienteId, clienteId.data)),
      db.delete(sessao).where(eq(sessao.clienteId, clienteId.data)),
      db.delete(agendamento).where(eq(agendamento.clienteId, clienteId.data)),
      db.delete(pacote).where(eq(pacote.clienteId, clienteId.data)),
      db.delete(cliente).where(eq(cliente.id, clienteId.data)),
    ]);
  } catch {
    return {
      status: "erro",
      mensagem:
        "Não foi possível excluir este cliente agora. Tente novamente ou fale com a administração.",
    } satisfies EstadoExclusaoCliente;
  }

  revalidatePath("/painel/clientes");
  revalidatePath(`/painel/clientes/${clienteId.data}`);

  return {
    status: "sucesso",
    mensagem: "Cliente excluído com sucesso.",
  } satisfies EstadoExclusaoCliente;
}

/** Opt-in separado do cadastro — biometria exige presença física, cadastro de cliente não. */
export async function registrarConsentimentoBiometria(formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const clienteId = getValor(formData, "clienteId");
  const consentimento = getValor(formData, "consentimento") === "true";
  if (typeof clienteId !== "string") return;

  await db
    .update(cliente)
    .set({
      consentimentoBiometria: consentimento,
      consentimentoBiometriaEm: consentimento ? new Date() : null,
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
    })
    .where(eq(cliente.id, clienteId));

  revalidatePath(`/painel/clientes/${clienteId}`);
}
