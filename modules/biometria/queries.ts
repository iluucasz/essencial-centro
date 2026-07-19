import { and, asc, eq, inArray } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { listarClientesComAgendamentoPendenteHoje } from "@/modules/agenda/queries";
import { cliente } from "@/modules/clientes/schema";

import { biometriaCliente } from "./schema";

/** Seção "Biometria" em /painel/clientes/[id]. */
export async function listarBiometriasDoCliente(clienteId: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  return db
    .select({
      id: biometriaCliente.id,
      dedo: biometriaCliente.dedo,
      qualidadeCaptura: biometriaCliente.qualidadeCaptura,
      criadoEm: biometriaCliente.criadoEm,
    })
    .from(biometriaCliente)
    .where(and(eq(biometriaCliente.clienteId, clienteId), eq(biometriaCliente.ativo, true)))
    .orderBy(asc(biometriaCliente.dedo));
}

/**
 * Pool de candidatos pro FTRIdentify da ponte — só quem tem atendimento marcado hoje e ainda não
 * fez check-in (listarClientesComAgendamentoPendenteHoje, modules/agenda/queries.ts). Sem
 * checagem de role própria — chamado só pela rota GET /api/biometria/candidatos, já autenticada
 * pelo BIOMETRIA_BRIDGE_SECRET. Sem paginação de propósito: o objetivo de desenho é que esse pool
 * fique sempre pequeno — se crescer muito, isso é um sinal pra revisar, não algo a resolver aqui.
 */
export async function obterCandidatosDeHoje() {
  const pendentes = await listarClientesComAgendamentoPendenteHoje();
  const clienteIds = [...new Set(pendentes.map((p) => p.clienteId))];

  if (clienteIds.length === 0) return [];

  return db
    .select({
      biometriaId: biometriaCliente.id,
      clienteId: biometriaCliente.clienteId,
      clienteNome: cliente.nome,
      dedo: biometriaCliente.dedo,
      templateBase64: biometriaCliente.templateBase64,
      qualidadeCaptura: biometriaCliente.qualidadeCaptura,
    })
    .from(biometriaCliente)
    .innerJoin(cliente, eq(cliente.id, biometriaCliente.clienteId))
    .where(and(eq(biometriaCliente.ativo, true), inArray(biometriaCliente.clienteId, clienteIds)));
}
