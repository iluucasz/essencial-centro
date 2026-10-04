import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { blocosPadrao, blocosSite, chavesBloco, type BlocosSite, type ChaveBloco } from "./blocos";
import { blocoSite, conteudoSite } from "./schema";

export async function listarConteudosSite() {
  autorizarPapel(await auth(), ["profissional"]);
  return db
    .select()
    .from(conteudoSite)
    .orderBy(asc(conteudoSite.ordem), asc(conteudoSite.atualizadoEm));
}

/** Projeção editorial explícita: nunca consulta cadastros, fotos clínicas ou prontuários. */
export async function listarConteudosPublicos() {
  return db
    .select({
      id: conteudoSite.id,
      nota: conteudoSite.nota,
      tipo: conteudoSite.tipo,
      titulo: conteudoSite.titulo,
      subtitulo: conteudoSite.subtitulo,
      texto: conteudoSite.texto,
      tipoMidia: conteudoSite.tipoMidia,
      midia: conteudoSite.midia,
      filtro: conteudoSite.filtro,
      somOriginal: conteudoSite.somOriginal,
      musica: conteudoSite.musica,
      volumeMusica: conteudoSite.volumeMusica,
      ordem: conteudoSite.ordem,
    })
    .from(conteudoSite)
    .where(and(eq(conteudoSite.publicado, true), eq(conteudoSite.autorizacaoPublicacao, true)))
    .orderBy(asc(conteudoSite.ordem), asc(conteudoSite.atualizadoEm));
}

/**
 * Textos das seções fixas do site, já mesclados com o padrão. Público: é o conteúdo da home.
 * Registro inválido (formato antigo, edição manual) é ignorado e o bloco volta ao padrão.
 */
export async function obterBlocosSite(): Promise<{
  blocos: BlocosSite;
  personalizados: ChaveBloco[];
}> {
  const registros = await db
    .select({ chave: blocoSite.chave, valor: blocoSite.valor })
    .from(blocoSite);
  const blocos: Record<string, unknown> = blocosPadrao();
  const personalizados: ChaveBloco[] = [];
  for (const { chave, valor } of registros) {
    if (!chavesBloco.includes(chave as ChaveBloco)) continue;
    const resultado = blocosSite[chave as ChaveBloco].schema.safeParse(valor);
    if (!resultado.success) continue;
    blocos[chave] = resultado.data;
    personalizados.push(chave as ChaveBloco);
  }
  return { blocos: blocos as BlocosSite, personalizados };
}
