import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";

import { registroDor } from "./schema";
import { descreverRegiao, type LadoDor, type RegiaoDor } from "./regioes";

/** Colunas devolvidas em toda leitura — evita `select()` cru vazando coluna nova sem revisão. */
const colunas = {
  id: registroDor.id,
  regiao: registroDor.regiao,
  lado: registroDor.lado,
  intensidade: registroDor.intensidade,
  anterior: registroDor.anterior,
  alturaNormalizada: registroDor.alturaNormalizada,
  xNormalizado: registroDor.xNormalizado,
  observacao: registroDor.observacao,
  origem: registroDor.origem,
  registradoEm: registroDor.registradoEm,
};

export type PontoDor = {
  id: string;
  regiao: RegiaoDor;
  lado: LadoDor | null;
  intensidade: number;
  anterior: boolean;
  alturaNormalizada: number;
  xNormalizado: number;
  observacao: string | null;
  origem: "profissional" | "cliente";
  registradoEm: Date;
  descricao: string;
};

function comDescricao(registros: Omit<PontoDor, "descricao">[]): PontoDor[] {
  return registros.map((registro) => ({
    ...registro,
    descricao: descreverRegiao(registro.regiao, registro.lado),
  }));
}

/** Mapa de dor de um cliente, visto pela profissional. */
export async function listarDorDoCliente(clienteId: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const registros = await db
    .select(colunas)
    .from(registroDor)
    .where(eq(registroDor.clienteId, clienteId))
    .orderBy(desc(registroDor.registradoEm));

  return comDescricao(registros);
}

/**
 * Cliente atual pela sessão. Existe para o portal nunca receber `clienteId` do browser — o cliente
 * não escolhe de quem é o mapa que está lendo ou escrevendo.
 */
export async function exigirClienteIdDaSessao() {
  const usuario = autorizarPapel(await auth(), ["cliente"]);

  if (!usuario.clienteId) {
    throw new ErroAutorizacao(
      "Seu usuário ainda não está vinculado a um cadastro de cliente.",
      403,
    );
  }

  return usuario.clienteId;
}

/** Mapa do próprio cliente no portal — o `clienteId` vem da sessão, nunca do parâmetro. */
export async function listarMeuMapaDeDor() {
  const clienteId = await exigirClienteIdDaSessao();

  const registros = await db
    .select(colunas)
    .from(registroDor)
    .where(eq(registroDor.clienteId, clienteId))
    .orderBy(desc(registroDor.registradoEm));

  return comDescricao(registros);
}

/**
 * Último registro por região — é o que o modelo 3D pinta. Uma região marcada 5 vezes ao longo do
 * tratamento mostra o estado ATUAL, não cinco marcadores empilhados no mesmo lugar.
 */
export function resumirPorRegiao(pontos: PontoDor[]) {
  const porRegiao = new Map<string, PontoDor>();

  // `pontos` já vem do mais recente pro mais antigo: o primeiro de cada chave é o atual.
  for (const ponto of pontos) {
    const chave = `${ponto.regiao}:${ponto.lado ?? ""}`;
    if (!porRegiao.has(chave)) porRegiao.set(chave, ponto);
  }

  return [...porRegiao.values()].sort((a, b) => b.intensidade - a.intensidade);
}

/** Histórico de uma região específica, pra ver se a dor cedeu ao longo das sessões. */
export async function listarHistoricoDaRegiao(
  clienteId: string,
  regiao: RegiaoDor,
  lado: LadoDor | null,
) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const registros = await db
    .select(colunas)
    .from(registroDor)
    .where(
      and(
        eq(registroDor.clienteId, clienteId),
        eq(registroDor.regiao, regiao),
        lado ? eq(registroDor.lado, lado) : undefined,
      ),
    )
    .orderBy(desc(registroDor.registradoEm));

  return comDescricao(registros);
}
