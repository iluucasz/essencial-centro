"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import QRCode from "qrcode";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { lancamentoFinanceiro } from "@/modules/financeiro/schema";
import { notificarCliente } from "@/modules/notificacoes/criar-notificacao";
import { deveAvisarPacoteAcabando } from "@/modules/pacotes/progresso";
import { obterProgressoPacote } from "@/modules/pacotes/queries";
import { servico } from "@/modules/servicos/schema";

import { urlCheckin } from "./checkin-url";
import { mensagemAtendimentoCancelado, mensagemAtendimentoMarcado } from "./mensagem-notificacao";
import { listarAgendamentosDoProfissionalNoDia } from "./queries";
import {
  agendamento,
  atualizarAgendamentoSchema,
  atualizarStatusAgendamentoSchema,
  concluirAgendamentoSchema,
  confirmarPresencaSchema,
  criarAgendamentoSchema,
} from "./schema";
import { encontrarConflito } from "./sobreposicao";

export type EstadoFormularioAgendamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

export type EstadoExclusaoAgendamento = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
};

const estadoInicial: EstadoFormularioAgendamento = { status: "inicial" };
const estadoInicialExclusao: EstadoExclusaoAgendamento = { status: "inicial" };
const formatadorDataDescricao = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function getValor(formData: FormData, nome: string) {
  return formData.get(nome);
}

function dataFinanceiraDoAgendamento(data: Date) {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
}

async function nomeDoServico(servicoId: string) {
  const [registro] = await db
    .select({ nome: servico.nome })
    .from(servico)
    .where(eq(servico.id, servicoId))
    .limit(1);

  return registro?.nome ?? "serviço";
}

/** QR de presença de um agendamento em base64 puro (sem prefixo data:), pra anexar no WhatsApp. */
async function qrCheckinBase64(agendamentoId: string) {
  const dataUrl = await QRCode.toDataURL(await urlCheckin(agendamentoId), {
    margin: 1,
    width: 320,
  });

  return dataUrl.split(",")[1] ?? "";
}

async function notificarPacoteAcabandoSeNecessario(pacoteId: string | null) {
  if (!pacoteId) return;

  const info = await obterProgressoPacote(pacoteId);
  if (!info || !deveAvisarPacoteAcabando(info.progresso.sessoesRestantes)) return;

  const acabou = info.progresso.sessoesRestantes === 0;

  await notificarCliente({
    clienteId: info.clienteId,
    tipo: "pacote_acabando",
    titulo: acabou ? "Pacote concluído" : "Última sessão do seu pacote",
    mensagem: acabou
      ? "Você concluiu todas as sessões do seu pacote. Fale com a gente para renovar!"
      : "Você tem apenas 1 sessão restante no seu pacote atual.",
    link: "/portal/evolucao",
  });
}

export async function criarAgendamento(
  _: EstadoFormularioAgendamento = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = criarAgendamentoSchema.safeParse({
    clienteId: getValor(formData, "clienteId"),
    servicoId: getValor(formData, "servicoId"),
    profissionalId: getValor(formData, "profissionalId"),
    pacoteId: getValor(formData, "pacoteId"),
    inicio: getValor(formData, "inicio"),
    duracaoMinutos: getValor(formData, "duracaoMinutos"),
    modalidade: getValor(formData, "modalidade") || undefined,
    observacoes: getValor(formData, "observacoes"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do agendamento.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioAgendamento;
  }

  const {
    clienteId,
    servicoId,
    profissionalId,
    pacoteId,
    inicio,
    duracaoMinutos,
    modalidade,
    observacoes,
  } = parsed.data;

  const agendamentosDoDia = await listarAgendamentosDoProfissionalNoDia(profissionalId, inicio);
  const conflito = encontrarConflito({ inicio, duracaoMinutos }, agendamentosDoDia);

  if (conflito) {
    return {
      status: "erro",
      mensagem: "A profissional já tem um agendamento marcado nesse horário.",
    } satisfies EstadoFormularioAgendamento;
  }

  const [criado] = await db
    .insert(agendamento)
    .values({
      clienteId,
      servicoId,
      profissionalId,
      pacoteId,
      inicio,
      duracaoMinutos,
      modalidade,
      observacoes,
      criadoPorId: usuarioAtual.id,
      atualizadoPorId: usuarioAtual.id,
    })
    .returning({ id: agendamento.id });

  await notificarCliente({
    clienteId,
    tipo: "agendamento_criado",
    titulo: "Atendimento marcado",
    mensagem: mensagemAtendimentoMarcado(await nomeDoServico(servicoId), inicio),
    link: "/portal/agendamentos",
    whatsappImagemBase64: criado ? await qrCheckinBase64(criado.id) : undefined,
  });

  revalidatePath("/painel/agenda");
  revalidatePath(`/painel/clientes/${clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Agendamento criado com sucesso.",
  } satisfies EstadoFormularioAgendamento;
}

export async function atualizarAgendamento(
  _: EstadoFormularioAgendamento = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = atualizarAgendamentoSchema.safeParse({
    id: getValor(formData, "id"),
    clienteId: getValor(formData, "clienteId"),
    servicoId: getValor(formData, "servicoId"),
    profissionalId: getValor(formData, "profissionalId"),
    pacoteId: getValor(formData, "pacoteId"),
    inicio: getValor(formData, "inicio"),
    duracaoMinutos: getValor(formData, "duracaoMinutos"),
    modalidade: getValor(formData, "modalidade") || undefined,
    observacoes: getValor(formData, "observacoes"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados do agendamento.",
      campos: parsed.error.flatten().fieldErrors,
    } satisfies EstadoFormularioAgendamento;
  }

  const { id, clienteId, servicoId, profissionalId, pacoteId, inicio, duracaoMinutos } =
    parsed.data;

  const agendamentosDoDia = await listarAgendamentosDoProfissionalNoDia(profissionalId, inicio);
  const conflito = encontrarConflito(
    { inicio, duracaoMinutos },
    agendamentosDoDia.filter((item) => item.id !== id),
  );

  if (conflito) {
    return {
      status: "erro",
      mensagem: "A profissional já tem um agendamento marcado nesse horário.",
    } satisfies EstadoFormularioAgendamento;
  }

  const [anterior] = await db
    .select({ inicio: agendamento.inicio })
    .from(agendamento)
    .where(eq(agendamento.id, id))
    .limit(1);

  const atualizados = await db
    .update(agendamento)
    .set({
      clienteId,
      servicoId,
      profissionalId,
      pacoteId,
      inicio,
      duracaoMinutos,
      modalidade: parsed.data.modalidade,
      observacoes: parsed.data.observacoes,
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
    })
    .where(eq(agendamento.id, id))
    .returning({ id: agendamento.id });

  if (atualizados.length === 0) {
    return {
      status: "erro",
      mensagem: "Agendamento não encontrado.",
    } satisfies EstadoFormularioAgendamento;
  }

  if (anterior && anterior.inicio.getTime() !== inicio.getTime()) {
    await notificarCliente({
      clienteId,
      tipo: "geral",
      titulo: "Atendimento remarcado",
      mensagem: mensagemAtendimentoMarcado(await nomeDoServico(servicoId), inicio, true),
      link: "/portal/agendamentos",
      whatsappImagemBase64: await qrCheckinBase64(id),
    });
  }

  revalidatePath("/painel/agenda");
  revalidatePath(`/painel/clientes/${clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Agendamento atualizado com sucesso.",
  } satisfies EstadoFormularioAgendamento;
}

export async function excluirAgendamento(
  _: EstadoExclusaoAgendamento = estadoInicialExclusao,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const id = getValor(formData, "id");
  const clienteId = getValor(formData, "clienteId");
  const exclusaoConfirmada = getValor(formData, "confirmarExclusao");

  if (typeof id !== "string") {
    return {
      status: "erro",
      mensagem: "Agendamento inválido.",
    } satisfies EstadoExclusaoAgendamento;
  }

  if (exclusaoConfirmada !== "true") {
    return {
      status: "erro",
      mensagem: "Confirme que entende a exclusão antes de continuar.",
    } satisfies EstadoExclusaoAgendamento;
  }

  const [aExcluir] = await db
    .select({
      clienteId: agendamento.clienteId,
      servicoId: agendamento.servicoId,
      inicio: agendamento.inicio,
    })
    .from(agendamento)
    .where(eq(agendamento.id, id))
    .limit(1);

  const excluidos = await db
    .delete(agendamento)
    .where(eq(agendamento.id, id))
    .returning({ id: agendamento.id });

  if (excluidos.length === 0) {
    return {
      status: "erro",
      mensagem: "Agendamento não encontrado.",
    } satisfies EstadoExclusaoAgendamento;
  }

  if (aExcluir) {
    await notificarCliente({
      clienteId: aExcluir.clienteId,
      tipo: "geral",
      titulo: "Atendimento cancelado",
      mensagem: mensagemAtendimentoCancelado(
        await nomeDoServico(aExcluir.servicoId),
        aExcluir.inicio,
      ),
      link: "/portal/agendamentos",
    });
  }

  revalidatePath("/painel/agenda");
  if (typeof clienteId === "string") {
    revalidatePath(`/painel/clientes/${clienteId}`);
  }

  return {
    status: "sucesso",
    mensagem: "Agendamento excluído com sucesso.",
  } satisfies EstadoExclusaoAgendamento;
}

async function aplicarStatusAgendamento(formData: FormData): Promise<EstadoFormularioAgendamento> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = atualizarStatusAgendamentoSchema.safeParse({
    id: getValor(formData, "id"),
    status: getValor(formData, "status"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Status de agendamento inválido.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  const filtroAtualizacao =
    parsed.data.status === "realizado"
      ? and(eq(agendamento.id, parsed.data.id), isNotNull(agendamento.checkinEm))
      : eq(agendamento.id, parsed.data.id);

  const [atualizado] = await db
    .update(agendamento)
    .set({
      status: parsed.data.status,
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
    })
    .where(filtroAtualizacao)
    .returning({
      pacoteId: agendamento.pacoteId,
      clienteId: agendamento.clienteId,
      servicoId: agendamento.servicoId,
      inicio: agendamento.inicio,
    });

  if (!atualizado && parsed.data.status === "realizado") {
    return {
      status: "erro",
      mensagem: "Confirme a presença antes de concluir o atendimento.",
    };
  }

  if (!atualizado) {
    return {
      status: "erro",
      mensagem: "Agendamento não encontrado.",
    };
  }

  if (parsed.data.status === "cancelado" && atualizado) {
    await notificarCliente({
      clienteId: atualizado.clienteId,
      tipo: "geral",
      titulo: "Atendimento cancelado",
      mensagem: mensagemAtendimentoCancelado(
        await nomeDoServico(atualizado.servicoId),
        atualizado.inicio,
      ),
      link: "/portal/agendamentos",
    });
  }

  if (parsed.data.status === "realizado" && atualizado?.pacoteId) {
    const info = await obterProgressoPacote(atualizado.pacoteId);

    if (info && deveAvisarPacoteAcabando(info.progresso.sessoesRestantes)) {
      const acabou = info.progresso.sessoesRestantes === 0;

      await notificarCliente({
        clienteId: info.clienteId,
        tipo: "pacote_acabando",
        titulo: acabou ? "Pacote concluído" : "Última sessão do seu pacote",
        mensagem: acabou
          ? "Você concluiu todas as sessões do seu pacote. Fale com a gente para renovar!"
          : "Você tem apenas 1 sessão restante no seu pacote atual.",
        link: "/portal/evolucao",
      });
    }
  }

  revalidatePath("/painel/agenda");
  revalidatePath(`/painel/clientes/${atualizado.clienteId}`);

  return {
    status: "sucesso",
    mensagem:
      parsed.data.status === "cancelado"
        ? "Agendamento cancelado."
        : parsed.data.status === "falta"
          ? "Falta registrada."
          : "Atendimento marcado como realizado.",
  };
}

export async function atualizarStatusAgendamento(formData: FormData) {
  await aplicarStatusAgendamento(formData);
}

export async function confirmarStatusAgendamento(
  _: EstadoFormularioAgendamento = estadoInicial,
  formData: FormData,
): Promise<EstadoFormularioAgendamento> {
  return aplicarStatusAgendamento(formData);
}

export async function concluirAgendamento(
  _: EstadoFormularioAgendamento = estadoInicial,
  formData: FormData,
): Promise<EstadoFormularioAgendamento> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = concluirAgendamentoSchema.safeParse({
    id: getValor(formData, "id"),
    situacaoPagamentoSessao: getValor(formData, "situacaoPagamentoSessao"),
    valorSessaoCentavos: getValor(formData, "valorSessao"),
    formaPagamento: getValor(formData, "formaPagamento"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Revise os dados para concluir o atendimento.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  const [registro] = await db
    .select({
      id: agendamento.id,
      clienteId: agendamento.clienteId,
      pacoteId: agendamento.pacoteId,
      servicoNome: servico.nome,
      inicio: agendamento.inicio,
      status: agendamento.status,
      checkinEm: agendamento.checkinEm,
    })
    .from(agendamento)
    .innerJoin(servico, eq(servico.id, agendamento.servicoId))
    .where(eq(agendamento.id, parsed.data.id))
    .limit(1);

  if (!registro) {
    return { status: "erro", mensagem: "Agendamento não encontrado." };
  }

  if (registro.status !== "marcado") {
    return { status: "erro", mensagem: "Este agendamento já foi resolvido." };
  }

  if (!registro.checkinEm) {
    return {
      status: "erro",
      mensagem: "Confirme a presença antes de concluir o atendimento.",
    } satisfies EstadoFormularioAgendamento;
  }

  const atualizados = await db
    .update(agendamento)
    .set({
      status: "realizado",
      atualizadoPorId: usuarioAtual.id,
      atualizadoEm: new Date(),
    })
    .where(
      and(
        eq(agendamento.id, parsed.data.id),
        eq(agendamento.status, "marcado"),
        isNotNull(agendamento.checkinEm),
      ),
    )
    .returning({ id: agendamento.id });

  if (atualizados.length === 0) {
    return { status: "erro", mensagem: "Este agendamento já foi resolvido." };
  }

  const deveLancarPagamento = parsed.data.situacaoPagamentoSessao !== "nao_lancar";

  if (deveLancarPagamento && parsed.data.valorSessaoCentavos) {
    const situacaoLancamento = parsed.data.situacaoPagamentoSessao === "pago" ? "pago" : "pendente";

    await db.insert(lancamentoFinanceiro).values({
      tipo: "receita",
      categoria: "atendimento",
      descricao: `Sessão realizada - ${registro.servicoNome} (${formatadorDataDescricao.format(
        registro.inicio,
      )})`,
      valorCentavos: parsed.data.valorSessaoCentavos,
      data: dataFinanceiraDoAgendamento(registro.inicio),
      formaPagamento: parsed.data.formaPagamento,
      situacao: situacaoLancamento,
      clienteId: registro.clienteId,
      pacoteId: registro.pacoteId,
      criadoPorId: usuarioAtual.id,
      atualizadoPorId: usuarioAtual.id,
    });
  }

  await notificarPacoteAcabandoSeNecessario(registro.pacoteId);

  revalidatePath("/painel/agenda");
  revalidatePath("/painel/financeiro");
  revalidatePath("/painel/pacotes");
  revalidatePath(`/painel/clientes/${registro.clienteId}`);

  redirect(`/painel/clientes/${registro.clienteId}?aba=sessoes&novoAtendimento=${registro.id}`);
}

/** Confirma presença (chegada na clínica) — destino do QR Code mostrado ao cliente no portal. */
async function aplicarConfirmacaoPresenca(
  formData: FormData,
): Promise<EstadoFormularioAgendamento> {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = confirmarPresencaSchema.safeParse({
    id: getValor(formData, "id"),
  });

  if (!parsed.success) {
    return {
      status: "erro",
      mensagem: "Agendamento inválido para confirmação de presença.",
      campos: parsed.error.flatten().fieldErrors,
    };
  }

  const [atualizado] = await db
    .update(agendamento)
    .set({ checkinEm: new Date() })
    .where(
      and(
        eq(agendamento.id, parsed.data.id),
        eq(agendamento.status, "marcado"),
        isNull(agendamento.checkinEm),
      ),
    )
    .returning({ clienteId: agendamento.clienteId });

  if (!atualizado) {
    return {
      status: "erro",
      mensagem: "Este agendamento não pode confirmar presença agora.",
    };
  }

  revalidatePath("/painel/agenda");
  revalidatePath(`/painel/checkin/${parsed.data.id}`);
  revalidatePath(`/painel/clientes/${atualizado.clienteId}`);

  return {
    status: "sucesso",
    mensagem: "Presença confirmada.",
  };
}

export async function confirmarPresenca(formData: FormData) {
  await aplicarConfirmacaoPresenca(formData);
}

export async function confirmarPresencaAgendamento(
  _: EstadoFormularioAgendamento = estadoInicial,
  formData: FormData,
): Promise<EstadoFormularioAgendamento> {
  return aplicarConfirmacaoPresenca(formData);
}
