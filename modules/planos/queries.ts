import { asc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { servico } from "@/modules/servicos/schema";

import { planoPacote } from "./schema";

/** Pacotes (faixas) de um serviço — usados na página do serviço e no seletor do agendamento. */
export async function listarPlanosDoServico(servicoId: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  return db
    .select({
      id: planoPacote.id,
      nome: planoPacote.nome,
      quantidadeSessoes: planoPacote.quantidadeSessoes,
      valorCentavos: planoPacote.valorCentavos,
      ativo: planoPacote.ativo,
    })
    .from(planoPacote)
    .where(eq(planoPacote.servicoId, servicoId))
    .orderBy(asc(planoPacote.quantidadeSessoes));
}

export type ServicoComPlanos = {
  id: string;
  nome: string;
  duracaoMinutos: number;
  valorCentavos: number | null;
  planos: {
    id: string;
    nome: string | null;
    quantidadeSessoes: number;
    valorCentavos: number;
  }[];
};

/**
 * Serviços ativos com os pacotes (faixas) de cada um — alimenta o fluxo de novo agendamento:
 * escolhido o serviço, o seletor mostra "avulsa" + os pacotes dele, e a duração da sessão vem daqui.
 */
export async function listarServicosComPlanos(): Promise<ServicoComPlanos[]> {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const [servicos, planos] = await Promise.all([
    db
      .select({
        id: servico.id,
        nome: servico.nome,
        duracaoMinutos: servico.duracaoMinutos,
        valorCentavos: servico.valorCentavos,
      })
      .from(servico)
      .where(eq(servico.ativo, true))
      .orderBy(asc(servico.nome)),
    db
      .select({
        id: planoPacote.id,
        servicoId: planoPacote.servicoId,
        nome: planoPacote.nome,
        quantidadeSessoes: planoPacote.quantidadeSessoes,
        valorCentavos: planoPacote.valorCentavos,
      })
      .from(planoPacote)
      .where(eq(planoPacote.ativo, true))
      .orderBy(asc(planoPacote.quantidadeSessoes)),
  ]);

  const porServico = new Map<string, ServicoComPlanos["planos"]>();
  for (const plano of planos) {
    const lista = porServico.get(plano.servicoId) ?? [];
    lista.push({
      id: plano.id,
      nome: plano.nome,
      quantidadeSessoes: plano.quantidadeSessoes,
      valorCentavos: plano.valorCentavos,
    });
    porServico.set(plano.servicoId, lista);
  }

  return servicos.map((s) => ({ ...s, planos: porServico.get(s.id) ?? [] }));
}
