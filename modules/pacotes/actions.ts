"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { listarAgendamentosMarcadosDoProfissionalNoPeriodo } from "@/modules/agenda/queries";
import { agendamento, interpretarDataHoraParede } from "@/modules/agenda/schema";
import { autorizarPapel } from "@/modules/auth/rbac";
import { notificarCliente } from "@/modules/notificacoes/criar-notificacao";
import { ocorrenciasEmConflito } from "@/modules/recorrencia/gerar";
import { mensagemAgendaGerada } from "@/modules/recorrencia/mensagem";
import { servico } from "@/modules/servicos/schema";

import { agendarContratoSchema, criarPacoteSchema, pacote } from "./schema";

const UM_DIA_MS = 24 * 60 * 60 * 1000;
const formatadorDataErro = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
});

export type EstadoFormularioPacote = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

export type EstadoExclusaoPacote = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

const estadoInicial: EstadoFormularioPacote = { status: "inicial" };
const estadoInicialExclusao: EstadoExclusaoPacote = { status: "inicial" };
const pacoteIdSchema = z.string().uuid("Pacote inválido.");

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function checkboxAtivo(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function parseFormularioPacote(formData: FormData) {
  return criarPacoteSchema.safeParse({
    clienteId: getValor(formData, "clienteId"),
    servicoId: getValor(formData, "servicoId"),
    planoPacoteId: getValor(formData, "planoPacoteId"),
    profissionalId: getValor(formData, "profissionalId"),
    quantidadeSessoes: getValor(formData, "quantidadeSessoes"),
    valorCentavos: getValor(formData, "valor"),
    formaPagamento: getValor(formData, "formaPagamento"),
    situacaoPagamento: getValor(formData, "situacaoPagamento"),
    modalidade: getValor(formData, "modalidade") || undefined,
    observacoes: getValor(formData, "observacoes"),
  });
}

export async function criarPacote(_: EstadoFormularioPacote = estadoInicial, formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);
  const parsed = parseFormularioPacote(formData);

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do contrato.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioPacote;
  }

  await db.insert(pacote).values({
    ...parsed.data,
    criadoPorId: usuarioAtual.id,
    atualizadoPorId: usuarioAtual.id,
  });

  revalidatePath("/painel/pacotes");

  return {
    status: "sucesso",
    mensagem: "Contrato cadastrado com sucesso.",
  } satisfies EstadoFormularioPacote;
}

/**
 * Fluxo "novo agendamento": cria de uma vez 1 contrato (linha `pacote`) + N agendamentos `marcado`
 * (uma linha por data enviada na tabela). Duração de cada sessão = a do serviço. Conflito com a
 * agenda da profissional é bloqueante (não cria nada). Consumo/lembrete seguem por agendamento.
 */
export async function agendarContrato(
  _: EstadoFormularioPacote = estadoInicial,
  formData: FormData,
): Promise<EstadoFormularioPacote> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = agendarContratoSchema.safeParse({
    clienteId: getValor(formData, "clienteId"),
    servicoId: getValor(formData, "servicoId"),
    planoPacoteId: getValor(formData, "planoPacoteId"),
    profissionalId: getValor(formData, "profissionalId"),
    valorCentavos: getValor(formData, "valor"),
    formaPagamento: getValor(formData, "formaPagamento"),
    situacaoPagamento: getValor(formData, "situacaoPagamento"),
    modalidade: getValor(formData, "modalidade") || undefined,
    observacoes: getValor(formData, "observacoes"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do agendamento.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  const inicios: Date[] = [];
  for (const bruto of formData.getAll("dataHora")) {
    if (typeof bruto !== "string" || bruto.trim() === "") continue;
    const data = interpretarDataHoraParede(bruto);
    if (!data) return { status: "erro", mensagem: "Há uma data/horário inválido na tabela." };
    inicios.push(data);
  }

  if (inicios.length === 0) {
    return { status: "erro", mensagem: "Informe ao menos uma data para as sessões." };
  }
  if (inicios.length > 100) {
    return { status: "erro", mensagem: "Máximo de 100 sessões por agendamento." };
  }

  const [srv] = await db
    .select({ nome: servico.nome, duracaoMinutos: servico.duracaoMinutos })
    .from(servico)
    .where(eq(servico.id, parsed.data.servicoId))
    .limit(1);

  if (!srv) return { status: "erro", mensagem: "Serviço não encontrado." };

  const duracaoMinutos = srv.duracaoMinutos;
  const ocorrencias = inicios.map((inicio) => ({ inicio, duracaoMinutos }));
  const ordenadas = [...inicios].sort((a, b) => a.getTime() - b.getTime());
  const inicioSpan = ordenadas[0];
  const fimSpan = new Date(ordenadas[ordenadas.length - 1].getTime() + UM_DIA_MS);

  const existentes = await listarAgendamentosMarcadosDoProfissionalNoPeriodo(
    parsed.data.profissionalId,
    inicioSpan,
    fimSpan,
  );
  const conflitos = ocorrenciasEmConflito(ocorrencias, existentes);

  if (conflitos.length > 0) {
    const datas = conflitos.map((data) => formatadorDataErro.format(data)).join(", ");
    return {
      status: "erro",
      mensagem: `A profissional já tem agendamento em: ${datas}. Ajuste as datas e tente novamente.`,
    };
  }

  const {
    clienteId,
    servicoId,
    planoPacoteId,
    profissionalId,
    valorCentavos,
    formaPagamento,
    situacaoPagamento,
    modalidade,
    observacoes,
  } = parsed.data;
  const contratoId = crypto.randomUUID();

  await db.batch([
    db.insert(pacote).values({
      id: contratoId,
      clienteId,
      servicoId,
      planoPacoteId,
      profissionalId,
      quantidadeSessoes: inicios.length,
      valorCentavos,
      formaPagamento,
      situacaoPagamento,
      modalidade,
      observacoes,
      criadoPorId: usuarioAtual.id,
      atualizadoPorId: usuarioAtual.id,
    }),
    db.insert(agendamento).values(
      ocorrencias.map((ocorrencia) => ({
        clienteId,
        servicoId,
        profissionalId,
        pacoteId: contratoId,
        inicio: ocorrencia.inicio,
        duracaoMinutos,
        modalidade,
        observacoes,
        criadoPorId: usuarioAtual.id,
        atualizadoPorId: usuarioAtual.id,
      })),
    ),
  ]);

  await notificarCliente({
    clienteId,
    tipo: "agendamento_criado",
    titulo: "Atendimentos agendados",
    mensagem: mensagemAgendaGerada(srv.nome, inicios.length, inicioSpan),
    link: "/portal/agendamentos",
  });

  revalidatePath("/painel/agenda");
  revalidatePath("/painel/pacotes");
  revalidatePath(`/painel/clientes/${clienteId}`);

  return {
    status: "sucesso",
    mensagem: `Agendamento criado: ${inicios.length} atendimento(s) marcado(s).`,
  };
}

export async function atualizarPacote(
  _: EstadoFormularioPacote = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);
  const pacoteId = pacoteIdSchema.safeParse(getValor(formData, "id"));
  const parsed = parseFormularioPacote(formData);

  if (!pacoteId.success) {
    return {
      status: "erro",
      mensagem: "Pacote inválido.",
      campos: { id: pacoteId.error.flatten().formErrors },
    } satisfies EstadoFormularioPacote;
  }

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do pacote.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioPacote;
  }

  const atualizados = await db
    .update(pacote)
    .set({
      ...parsed.data,
      ativo: checkboxAtivo(getValor(formData, "ativo")),
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
    })
    .where(eq(pacote.id, pacoteId.data))
    .returning({ id: pacote.id });

  if (atualizados.length === 0) {
    return {
      status: "erro",
      mensagem: "Pacote não encontrado.",
    } satisfies EstadoFormularioPacote;
  }

  revalidatePath("/painel/pacotes");

  return {
    status: "sucesso",
    mensagem: "Pacote atualizado com sucesso.",
  } satisfies EstadoFormularioPacote;
}

export async function excluirPacote(
  _: EstadoExclusaoPacote = estadoInicialExclusao,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional"]);
  const pacoteId = pacoteIdSchema.safeParse(getValor(formData, "pacoteId"));
  const exclusaoConfirmada = checkboxAtivo(getValor(formData, "confirmarExclusao"));

  if (!pacoteId.success) {
    return {
      status: "erro",
      mensagem: "Pacote inválido.",
    } satisfies EstadoExclusaoPacote;
  }

  if (!exclusaoConfirmada) {
    return {
      status: "erro",
      mensagem: "Confirme que entende a exclusão antes de continuar.",
    } satisfies EstadoExclusaoPacote;
  }

  try {
    const excluidos = await db
      .delete(pacote)
      .where(eq(pacote.id, pacoteId.data))
      .returning({ id: pacote.id });

    if (excluidos.length === 0) {
      return {
        status: "erro",
        mensagem: "Pacote não encontrado.",
      } satisfies EstadoExclusaoPacote;
    }
  } catch {
    return {
      status: "erro",
      mensagem:
        "Não foi possível excluir este pacote agora. Verifique se existem vínculos financeiros ou operacionais.",
    } satisfies EstadoExclusaoPacote;
  }

  revalidatePath("/painel/pacotes");

  return {
    status: "sucesso",
    mensagem: "Pacote excluído com sucesso.",
  } satisfies EstadoExclusaoPacote;
}
