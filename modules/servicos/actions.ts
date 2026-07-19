"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { agendamento } from "@/modules/agenda/schema";
import { autorizarPapel } from "@/modules/auth/rbac";
import { pacote } from "@/modules/pacotes/schema";
import { sessao } from "@/modules/sessoes/schema";

import {
  criarServicoSchema,
  excluirOpcaoServicoSchema,
  opcaoServico,
  servico,
  tiposOpcaoServico,
  type CriarServicoInput,
} from "./schema";

export type EstadoFormularioServico = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

export type EstadoExclusaoServico = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

export type EstadoExclusaoOpcaoServico = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

export type EstadoCriacaoOpcaoServico = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  opcao?: { id: string; nome: string };
};

const estadoInicial: EstadoFormularioServico = { status: "inicial" };
const estadoInicialExclusao: EstadoExclusaoServico = { status: "inicial" };
const estadoInicialExclusaoOpcao: EstadoExclusaoOpcaoServico = { status: "inicial" };
const estadoInicialCriacaoOpcao: EstadoCriacaoOpcaoServico = { status: "inicial" };
const servicoIdSchema = z.string().uuid("Serviço inválido.");
const criarOpcaoServicoSchema = z.object({
  tipo: z.enum(tiposOpcaoServico, "Tipo de opção inválido."),
  nome: z.string().trim().min(2, "Informe um nome com pelo menos 2 letras.").max(120),
});

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function checkboxAtivo(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function parseFormularioServico(formData: FormData) {
  return criarServicoSchema.safeParse({
    nome: getValor(formData, "nome"),
    grupo: getValor(formData, "grupo"),
    descricao: getValor(formData, "descricao"),
    indicacao: getValor(formData, "indicacao"),
    contraindicacoes: getValor(formData, "contraindicacoes"),
    duracaoMinutos: getValor(formData, "duracaoMinutos"),
    periodicidade: getValor(formData, "periodicidade"),
    valorCentavos: getValor(formData, "valor"),
    preparo: getValor(formData, "preparo"),
    cuidadosPosteriores: getValor(formData, "cuidadosPosteriores"),
  });
}

/** Toda vez que um serviço é salvo, o grupo/periodicidade usados entram (se ainda não
 * existirem) na lista de opções do formulário — é assim que "Outro" fica disponível pra
 * próxima seleção, sem precisar de uma tela separada de cadastro. */
async function garantirOpcoesServico(dados: CriarServicoInput, criadoPorId: string) {
  const valores = [
    { tipo: "grupo" as const, nome: dados.grupo },
    ...(dados.periodicidade ? [{ tipo: "periodicidade" as const, nome: dados.periodicidade }] : []),
  ];

  await Promise.all(
    valores.map((valor) =>
      db
        .insert(opcaoServico)
        .values({ ...valor, criadoPorId })
        .onConflictDoNothing({ target: [opcaoServico.tipo, opcaoServico.nome] }),
    ),
  );
}

export async function criarServico(_: EstadoFormularioServico = estadoInicial, formData: FormData) {
  const usuario = autorizarPapel(await auth(), ["profissional"]);
  const parsed = parseFormularioServico(formData);

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do serviço.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioServico;
  }

  await db.insert(servico).values({
    ...parsed.data,
    criadoPorId: usuario.id,
    atualizadoPorId: usuario.id,
  });
  await garantirOpcoesServico(parsed.data, usuario.id);

  revalidatePath("/painel/servicos");

  return {
    status: "sucesso",
    mensagem: "Serviço cadastrado com sucesso.",
  } satisfies EstadoFormularioServico;
}

export async function atualizarServico(
  _: EstadoFormularioServico = estadoInicial,
  formData: FormData,
) {
  const usuario = autorizarPapel(await auth(), ["profissional"]);
  const servicoId = servicoIdSchema.safeParse(getValor(formData, "id"));
  const parsed = parseFormularioServico(formData);

  if (!servicoId.success) {
    return {
      status: "erro",
      mensagem: "Serviço inválido.",
      campos: { id: servicoId.error.flatten().formErrors },
    } satisfies EstadoFormularioServico;
  }

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do serviço.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioServico;
  }

  const atualizados = await db
    .update(servico)
    .set({
      ...parsed.data,
      ativo: checkboxAtivo(getValor(formData, "ativo")),
      atualizadoPorId: usuario.id,
      atualizadoEm: new Date(),
    })
    .where(eq(servico.id, servicoId.data))
    .returning({ id: servico.id });

  if (atualizados.length === 0) {
    return {
      status: "erro",
      mensagem: "Serviço não encontrado.",
    } satisfies EstadoFormularioServico;
  }

  await garantirOpcoesServico(parsed.data, usuario.id);

  revalidatePath("/painel/servicos");

  return {
    status: "sucesso",
    mensagem: "Serviço atualizado com sucesso.",
  } satisfies EstadoFormularioServico;
}

function formatarListaPt(itens: string[]) {
  if (itens.length <= 1) return itens.join("");
  if (itens.length === 2) return itens.join(" e ");

  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

/** Só as tabelas com `onDelete: "restrict"` em `servicoId` bloqueiam a exclusão de fato
 * (ficha usa `set null`, então não entra aqui). Conta cada uma pra dizer exatamente o que
 * está vinculado, em vez de uma mensagem genérica. */
async function descreverVinculosServico(servicoId: string) {
  const [[{ total: totalAgendamentos }], [{ total: totalPacotes }], [{ total: totalSessoes }]] =
    await Promise.all([
      db.select({ total: count() }).from(agendamento).where(eq(agendamento.servicoId, servicoId)),
      db.select({ total: count() }).from(pacote).where(eq(pacote.servicoId, servicoId)),
      db.select({ total: count() }).from(sessao).where(eq(sessao.servicoId, servicoId)),
    ]);

  const vinculos: string[] = [];

  if (totalAgendamentos > 0) {
    vinculos.push(
      `${totalAgendamentos} ${totalAgendamentos === 1 ? "agendamento" : "agendamentos"}`,
    );
  }
  if (totalPacotes > 0) {
    vinculos.push(`${totalPacotes} ${totalPacotes === 1 ? "pacote" : "pacotes"}`);
  }
  if (totalSessoes > 0) {
    vinculos.push(`${totalSessoes} ${totalSessoes === 1 ? "sessão" : "sessões"}`);
  }

  return vinculos;
}

export async function alternarAtivoServico(formData: FormData) {
  autorizarPapel(await auth(), ["profissional"]);

  const id = formData.get("id");
  const ativoAtual = formData.get("ativoAtual");
  if (typeof id !== "string" || typeof ativoAtual !== "string") return;

  await db
    .update(servico)
    .set({ ativo: ativoAtual !== "true", atualizadoEm: new Date() })
    .where(eq(servico.id, id));

  revalidatePath("/painel/servicos");
}

export async function excluirServico(
  _: EstadoExclusaoServico = estadoInicialExclusao,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional"]);
  const servicoId = servicoIdSchema.safeParse(getValor(formData, "servicoId"));
  const exclusaoConfirmada = checkboxAtivo(getValor(formData, "confirmarExclusao"));

  if (!servicoId.success) {
    return {
      status: "erro",
      mensagem: "Serviço inválido.",
    } satisfies EstadoExclusaoServico;
  }

  if (!exclusaoConfirmada) {
    return {
      status: "erro",
      mensagem: "Confirme que entende a exclusão antes de continuar.",
    } satisfies EstadoExclusaoServico;
  }

  const vinculos = await descreverVinculosServico(servicoId.data);

  if (vinculos.length > 0) {
    return {
      status: "erro",
      mensagem:
        `Não é possível excluir: há ${formatarListaPt(vinculos)} vinculados a este serviço. ` +
        `Cancele ou exclua esses registros nas telas de Agenda, Pacotes ou Sessões antes de ` +
        `excluir o serviço — ou, pra manter o histórico, edite o serviço e desmarque "Serviço ` +
        `ativo" em vez de excluí-lo.`,
    } satisfies EstadoExclusaoServico;
  }

  try {
    const excluidos = await db
      .delete(servico)
      .where(eq(servico.id, servicoId.data))
      .returning({ id: servico.id });

    if (excluidos.length === 0) {
      return {
        status: "erro",
        mensagem: "Serviço não encontrado.",
      } satisfies EstadoExclusaoServico;
    }
  } catch {
    return {
      status: "erro",
      mensagem:
        "Não foi possível excluir este serviço porque ele está vinculado a outros registros.",
    } satisfies EstadoExclusaoServico;
  }

  revalidatePath("/painel/servicos");

  return {
    status: "sucesso",
    mensagem: "Serviço excluído com sucesso.",
  } satisfies EstadoExclusaoServico;
}

/** Adiciona uma opção de "Grupo"/"Periodicidade" na hora, pelo botão "Adicionar novo" do
 * formulário de serviço — sem precisar salvar o serviço inteiro pra ela ficar disponível.
 * Se o nome já existir pro mesmo tipo, apenas retorna a opção existente (sem duplicar nem
 * dar erro) — permite reusar o mesmo fluxo pra "selecionar" um valor que já existe. */
export async function criarOpcaoServico(
  _: EstadoCriacaoOpcaoServico = estadoInicialCriacaoOpcao,
  formData: FormData,
) {
  const usuario = autorizarPapel(await auth(), ["profissional"]);
  const parsed = criarOpcaoServicoSchema.safeParse({
    tipo: getValor(formData, "tipo"),
    nome: getValor(formData, "nome"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    } satisfies EstadoCriacaoOpcaoServico;
  }

  const [criada] = await db
    .insert(opcaoServico)
    .values({ ...parsed.data, criadoPorId: usuario.id })
    .onConflictDoUpdate({
      target: [opcaoServico.tipo, opcaoServico.nome],
      set: { nome: parsed.data.nome },
    })
    .returning({ id: opcaoServico.id, nome: opcaoServico.nome });

  revalidatePath("/painel/servicos");

  return {
    status: "sucesso",
    opcao: criada,
  } satisfies EstadoCriacaoOpcaoServico;
}

export async function excluirOpcaoServico(
  _: EstadoExclusaoOpcaoServico = estadoInicialExclusaoOpcao,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional"]);
  const parsed = excluirOpcaoServicoSchema.safeParse({ id: getValor(formData, "id") });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Opção inválida.",
    } satisfies EstadoExclusaoOpcaoServico;
  }

  const excluidos = await db
    .delete(opcaoServico)
    .where(and(eq(opcaoServico.id, parsed.data.id), eq(opcaoServico.padrao, false)))
    .returning({ id: opcaoServico.id });

  if (excluidos.length === 0) {
    return {
      status: "erro",
      mensagem: "Essa opção não existe mais ou é uma opção padrão, que não pode ser excluída.",
    } satisfies EstadoExclusaoOpcaoServico;
  }

  revalidatePath("/painel/servicos");

  return {
    status: "sucesso",
    mensagem: "Opção excluída com sucesso.",
  } satisfies EstadoExclusaoOpcaoServico;
}
