import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  confirmarPresencaViaBiometria,
  obterAgendamentoDoClienteHoje,
} from "@/modules/agenda/checkin-biometria";
import { cliente } from "@/modules/clientes/schema";

import { codigoValido, qualidadeCadastroValida } from "./cadastro";
import { type EntradaDecisaoIdentificacao, decidirResultadoIdentificacao } from "./decisao";
import { calcularHashTemplate } from "./hash";
import {
  biometriaCliente,
  codigoCadastroBiometria,
  tentativaIdentificacaoBiometrica,
  type RelatarIdentificacaoInput,
} from "./schema";

/** Autorização da ponte física — nunca uma sessão de usuário, só um segredo compartilhado. */
export function autorizarSegredoBridge(request: Request): boolean {
  const segredo = process.env.BIOMETRIA_BRIDGE_SECRET;
  return Boolean(segredo) && request.headers.get("authorization") === `Bearer ${segredo}`;
}

export async function resolverCodigoCadastro(codigo: string) {
  const [registro] = await db
    .select()
    .from(codigoCadastroBiometria)
    .where(eq(codigoCadastroBiometria.codigo, codigo))
    .limit(1);

  if (!registro || !codigoValido(registro, new Date())) return null;

  const [c] = await db
    .select({ nome: cliente.nome })
    .from(cliente)
    .where(eq(cliente.id, registro.clienteId))
    .limit(1);

  return {
    clienteId: registro.clienteId,
    clienteNome: c?.nome ?? "",
    dedo: registro.dedo,
    expiraEm: registro.expiraEm,
  };
}

export async function finalizarCadastro(input: {
  codigo: string;
  templateBase64: string;
  qualidadeCaptura: number;
}) {
  const [registro] = await db
    .select()
    .from(codigoCadastroBiometria)
    .where(eq(codigoCadastroBiometria.codigo, input.codigo))
    .limit(1);

  if (!registro || !codigoValido(registro, new Date())) {
    return { tipo: "codigo_invalido" as const };
  }

  if (!qualidadeCadastroValida(input.qualidadeCaptura)) {
    return { tipo: "qualidade_insuficiente" as const };
  }

  const [c] = await db
    .select({ nome: cliente.nome, consentimentoBiometria: cliente.consentimentoBiometria })
    .from(cliente)
    .where(eq(cliente.id, registro.clienteId))
    .limit(1);

  if (!c?.consentimentoBiometria) {
    return { tipo: "sem_consentimento" as const };
  }

  // Desativa qualquer cadastro ativo pro mesmo cliente+dedo antes de inserir o novo — o índice
  // único parcial é a rede de segurança real se isso correr em paralelo.
  await db
    .update(biometriaCliente)
    .set({ ativo: false })
    .where(
      and(
        eq(biometriaCliente.clienteId, registro.clienteId),
        eq(biometriaCliente.dedo, registro.dedo),
        eq(biometriaCliente.ativo, true),
      ),
    );

  const [nova] = await db
    .insert(biometriaCliente)
    .values({
      clienteId: registro.clienteId,
      dedo: registro.dedo,
      templateBase64: input.templateBase64,
      templateHash: calcularHashTemplate(input.templateBase64),
      qualidadeCaptura: input.qualidadeCaptura,
      criadoPorId: registro.criadoPorId,
    })
    .returning();

  await db
    .update(codigoCadastroBiometria)
    .set({ consumidoEm: new Date(), biometriaGeradaId: nova!.id })
    .where(eq(codigoCadastroBiometria.id, registro.id));

  return {
    tipo: "sucesso" as const,
    biometriaId: nova!.id,
    clienteId: registro.clienteId,
    clienteNome: c.nome,
    dedo: registro.dedo,
  };
}

async function registrarTentativa(valores: typeof tentativaIdentificacaoBiometrica.$inferInsert) {
  const [tentativa] = await db.insert(tentativaIdentificacaoBiometrica).values(valores).returning();

  return tentativa!;
}

/**
 * A ponte é tratada como "relatora não confiável": ela roda o FTRIdentify localmente (é quem tem
 * o SDK) e reporta um resultado, mas aqui revalidamos tudo — existência/posse do cadastro
 * reportado, limiares de FAR/qualidade/ambiguidade próprios — antes de gravar o check-in.
 */
export async function relatarIdentificacao(input: RelatarIdentificacaoInput) {
  if (input.biometriaId === null) {
    const tentativa = await registrarTentativa({
      resultado: "sem_match",
      biometriaIdReportada: null,
      clienteId: null,
      agendamentoId: null,
      farAtingido: null,
      farSegundoColocado: null,
      qualidade: input.qualidade,
    });

    return { resultado: "sem_match" as const, tentativaId: tentativa.id };
  }

  const [bio] = await db
    .select()
    .from(biometriaCliente)
    .where(and(eq(biometriaCliente.id, input.biometriaId), eq(biometriaCliente.ativo, true)))
    .limit(1);

  const agendamento = bio ? await obterAgendamentoDoClienteHoje(bio.clienteId, new Date()) : null;

  const entrada: EntradaDecisaoIdentificacao =
    !bio || !agendamento
      ? { situacao: "claim_invalida" }
      : agendamento.checkinEm !== null
        ? { situacao: "ja_confirmado" }
        : {
            situacao: "claim_valida",
            qualidade: input.qualidade,
            farAtingido: input.farAtingido!,
            farSegundoColocado: input.farSegundoColocado ?? null,
          };

  const resultado = decidirResultadoIdentificacao(entrada);

  if (resultado === "confirmado" && agendamento) {
    await confirmarPresencaViaBiometria(agendamento.id);
    revalidatePath("/painel/agenda");
  }

  const tentativa = await registrarTentativa({
    resultado,
    // `bio?.id` (nunca `input.biometriaId` cru): a coluna é uma FK de verdade — se a ponte
    // reportar um ID que não existe (ou de uma biometria já desativada), gravar o valor bruto
    // viola a constraint e derruba a rota com 500. `null` aqui já deixa claro, no próprio log de
    // auditoria, que o "claim" não correspondia a nenhum cadastro real.
    biometriaIdReportada: bio?.id ?? null,
    clienteId: bio?.clienteId ?? null,
    agendamentoId: agendamento?.id ?? null,
    farAtingido: input.farAtingido,
    farSegundoColocado: input.farSegundoColocado ?? null,
    qualidade: input.qualidade,
  });

  const incluirDetalhes = resultado === "confirmado" || resultado === "ja_confirmado";
  let clienteNome: string | null = null;

  if (incluirDetalhes && bio) {
    const [c] = await db
      .select({ nome: cliente.nome })
      .from(cliente)
      .where(eq(cliente.id, bio.clienteId))
      .limit(1);
    clienteNome = c?.nome ?? null;
  }

  return {
    resultado,
    tentativaId: tentativa.id,
    cliente: incluirDetalhes && bio ? { id: bio.clienteId, nome: clienteNome ?? "" } : undefined,
    agendamento:
      incluirDetalhes && agendamento
        ? { id: agendamento.id, servicoNome: agendamento.servicoNome, inicio: agendamento.inicio }
        : undefined,
  };
}
