"use server";

import { randomUUID } from "node:crypto";
import { del } from "@vercel/blob";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarEscrita } from "@/modules/auth/rbac";
import { blocosSite, chavesBloco, descreverErroBloco, type ChaveBloco } from "./blocos";
import { blocoSite, conteudoSite, historicoBlocoSite, historicoConteudoSite } from "./schema";
import { conteudoSiteSchema, midiaEnviadaNoSite } from "./validacao";

export type ResultadoConteudoSite = { sucesso: boolean; mensagem: string };

const idSchema = z.uuid();

function atualizarPaginas() {
  revalidatePath("/");
  revalidatePath("/painel/site");
}

/**
 * Só apaga arquivo enviado pela própria tela (foto, vídeo ou música) que nenhum item usa mais —
 * fotos fixas do site (`/profissionais_modelos`) ficam.
 */
async function apagarArquivosSemUso(...arquivos: string[]) {
  for (const arquivo of arquivos) {
    if (!midiaEnviadaNoSite(arquivo)) continue;
    const [emUso] = await db
      .select({ id: conteudoSite.id })
      .from(conteudoSite)
      .where(or(eq(conteudoSite.midia, arquivo), eq(conteudoSite.musica, arquivo)))
      .limit(1);
    const [emBloco] = await db
      .select({ chave: blocoSite.chave })
      .from(blocoSite)
      .where(sql`${blocoSite.valor}::text like ${`%${arquivo}%`}`)
      .limit(1);
    if (!emUso && !emBloco) await del(arquivo).catch(() => {});
  }
}

async function buscarConteudo(id: string) {
  const [registro] = await db.select().from(conteudoSite).where(eq(conteudoSite.id, id)).limit(1);
  return registro;
}

export async function salvarConteudoSite(entrada: unknown): Promise<ResultadoConteudoSite> {
  const usuario = autorizarEscrita(await auth(), ["profissional"]);
  const resultado = conteudoSiteSchema.safeParse(entrada);
  if (!resultado.success) return { sucesso: false, mensagem: resultado.error.issues[0].message };
  const { id, ...dados } = resultado.data;
  const registro = { ...dados, atualizadoPorId: usuario.id, atualizadoEm: new Date() };

  if (id) {
    const anterior = await buscarConteudo(id);
    if (!anterior) return { sucesso: false, mensagem: "Este conteúdo não existe mais." };
    await db.batch([
      db.update(conteudoSite).set(registro).where(eq(conteudoSite.id, id)),
      db.insert(historicoConteudoSite).values({ conteudoId: id, usuarioId: usuario.id, dados }),
    ]);
    await apagarArquivosSemUso(
      ...[anterior.midia, anterior.musica].filter(
        (arquivo) => arquivo !== dados.midia && arquivo !== dados.musica,
      ),
    );
  } else {
    // Item novo entra no fim da seção; a ordem depois é ajustada pelas setas da tela.
    const [{ ultima }] = await db
      .select({ ultima: sql<number>`coalesce(max(${conteudoSite.ordem}), -1)::int` })
      .from(conteudoSite)
      .where(eq(conteudoSite.tipo, dados.tipo));
    const novoId = randomUUID();
    await db.batch([
      db.insert(conteudoSite).values({ id: novoId, ordem: ultima + 1, ...registro }),
      db.insert(historicoConteudoSite).values({ conteudoId: novoId, usuarioId: usuario.id, dados }),
    ]);
  }

  atualizarPaginas();
  return {
    sucesso: true,
    mensagem: dados.publicado ? "Publicado no site." : "Rascunho salvo. Ainda não aparece no site.",
  };
}

export async function alternarPublicacaoConteudo(
  id: string,
  publicado: boolean,
): Promise<ResultadoConteudoSite> {
  const usuario = autorizarEscrita(await auth(), ["profissional"]);
  if (!idSchema.safeParse(id).success) return { sucesso: false, mensagem: "Conteúdo inválido." };
  const atual = await buscarConteudo(id);
  if (!atual) return { sucesso: false, mensagem: "Este conteúdo não existe mais." };

  // Publicar passa pela mesma validação do formulário (autorização, nota, mídia obrigatória).
  const validacao = conteudoSiteSchema.safeParse({ ...atual, publicado });
  if (publicado && !validacao.success)
    return {
      sucesso: false,
      mensagem: `Não dá para publicar ainda: ${validacao.error.issues[0].message} Abra para editar.`,
    };

  await db.batch([
    db
      .update(conteudoSite)
      .set({ publicado, atualizadoPorId: usuario.id, atualizadoEm: new Date() })
      .where(eq(conteudoSite.id, id)),
    db.insert(historicoConteudoSite).values({
      conteudoId: id,
      usuarioId: usuario.id,
      dados: { acao: publicado ? "publicado" : "ocultado" },
    }),
  ]);
  atualizarPaginas();
  return { sucesso: true, mensagem: publicado ? "Publicado no site." : "Ocultado do site." };
}

export async function moverConteudo(
  id: string,
  direcao: "acima" | "abaixo",
): Promise<ResultadoConteudoSite> {
  const usuario = autorizarEscrita(await auth(), ["profissional"]);
  if (!idSchema.safeParse(id).success) return { sucesso: false, mensagem: "Conteúdo inválido." };
  const atual = await buscarConteudo(id);
  if (!atual) return { sucesso: false, mensagem: "Este conteúdo não existe mais." };

  const secao = await db
    .select({ id: conteudoSite.id })
    .from(conteudoSite)
    .where(eq(conteudoSite.tipo, atual.tipo))
    .orderBy(asc(conteudoSite.ordem), asc(conteudoSite.atualizadoEm));
  const ids = secao.map((item) => item.id);
  const posicao = ids.indexOf(id);
  const destino = direcao === "acima" ? posicao - 1 : posicao + 1;
  if (destino < 0 || destino >= ids.length) return { sucesso: true, mensagem: "" };

  [ids[posicao], ids[destino]] = [ids[destino], ids[posicao]];
  // Renumera a seção inteira (0, 1, 2…) — corrige também ordens repetidas de cadastros antigos.
  const [primeira, ...demais] = ids.map((itemId, ordem) =>
    db
      .update(conteudoSite)
      .set({ ordem, atualizadoPorId: usuario.id })
      .where(and(eq(conteudoSite.id, itemId), eq(conteudoSite.tipo, atual.tipo))),
  );
  await db.batch([primeira, ...demais]);
  atualizarPaginas();
  return { sucesso: true, mensagem: "" };
}

export async function excluirConteudoSite(id: string): Promise<ResultadoConteudoSite> {
  const usuario = autorizarEscrita(await auth(), ["profissional"]);
  if (!idSchema.safeParse(id).success) return { sucesso: false, mensagem: "Conteúdo inválido." };
  const atual = await buscarConteudo(id);
  if (!atual) return { sucesso: false, mensagem: "Este conteúdo não existe mais." };

  await db.batch([
    db.insert(historicoConteudoSite).values({
      conteudoId: id,
      usuarioId: usuario.id,
      dados: { acao: "excluido", titulo: atual.titulo, tipo: atual.tipo },
    }),
    db.delete(conteudoSite).where(eq(conteudoSite.id, id)),
  ]);
  await apagarArquivosSemUso(atual.midia, atual.musica);
  atualizarPaginas();
  return { sucesso: true, mensagem: "Conteúdo excluído." };
}

/** Todas as URLs de arquivo enviado pela tela que aparecem dentro de um bloco (ex.: artes do catálogo). */
function arquivosDoBloco(valor: unknown): string[] {
  if (typeof valor === "string") return midiaEnviadaNoSite(valor) ? [valor] : [];
  if (Array.isArray(valor)) return valor.flatMap(arquivosDoBloco);
  if (valor && typeof valor === "object") return Object.values(valor).flatMap(arquivosDoBloco);
  return [];
}

const chaveBlocoSchema = z.enum(chavesBloco);

export async function salvarBlocoSite(
  chave: ChaveBloco,
  entrada: unknown,
): Promise<ResultadoConteudoSite> {
  const usuario = autorizarEscrita(await auth(), ["profissional"]);
  if (!chaveBlocoSchema.safeParse(chave).success)
    return { sucesso: false, mensagem: "Seção inválida." };
  const resultado = blocosSite[chave].schema.safeParse(entrada);
  if (!resultado.success) return { sucesso: false, mensagem: descreverErroBloco(resultado.error) };

  const [anterior] = await db
    .select({ valor: blocoSite.valor })
    .from(blocoSite)
    .where(eq(blocoSite.chave, chave))
    .limit(1);
  const registro = { valor: resultado.data, atualizadoPorId: usuario.id, atualizadoEm: new Date() };
  await db.batch([
    db
      .insert(blocoSite)
      .values({ chave, ...registro })
      .onConflictDoUpdate({ target: blocoSite.chave, set: registro }),
    db.insert(historicoBlocoSite).values({ chave, usuarioId: usuario.id, dados: resultado.data }),
  ]);
  const novos = new Set(arquivosDoBloco(resultado.data));
  await apagarArquivosSemUso(
    ...arquivosDoBloco(anterior?.valor).filter((arquivo) => !novos.has(arquivo)),
  );
  atualizarPaginas();
  return { sucesso: true, mensagem: "Alterações publicadas no site." };
}

export async function restaurarBlocoSite(chave: ChaveBloco): Promise<ResultadoConteudoSite> {
  const usuario = autorizarEscrita(await auth(), ["profissional"]);
  if (!chaveBlocoSchema.safeParse(chave).success)
    return { sucesso: false, mensagem: "Seção inválida." };
  const [anterior] = await db
    .select({ valor: blocoSite.valor })
    .from(blocoSite)
    .where(eq(blocoSite.chave, chave))
    .limit(1);
  await db.batch([
    db.insert(historicoBlocoSite).values({
      chave,
      usuarioId: usuario.id,
      dados: { acao: "restaurado ao padrão" },
    }),
    db.delete(blocoSite).where(eq(blocoSite.chave, chave)),
  ]);
  await apagarArquivosSemUso(...arquivosDoBloco(anterior?.valor));
  atualizarPaginas();
  return { sucesso: true, mensagem: "Textos originais restaurados." };
}
