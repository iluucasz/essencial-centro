import { asc, desc, eq, ilike } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { opcaoServico, servico, type TipoOpcaoServico } from "./schema";

export async function listarServicos(busca?: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const termo = busca?.trim();

  return db
    .select()
    .from(servico)
    .where(termo ? ilike(servico.nome, `%${termo}%`) : undefined)
    .orderBy(desc(servico.criadoEm));
}

/** Usado pela página de detalhe do serviço. */
export async function obterServico(id: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const [registro] = await db.select().from(servico).where(eq(servico.id, id)).limit(1);

  return registro ?? null;
}

/** Opções de "Grupo"/"Periodicidade" do formulário de serviço — padrões primeiro, depois as
 * criadas pela profissional em ordem alfabética. */
export async function listarOpcoesServico(tipo: TipoOpcaoServico) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  return db
    .select({ id: opcaoServico.id, nome: opcaoServico.nome, padrao: opcaoServico.padrao })
    .from(opcaoServico)
    .where(eq(opcaoServico.tipo, tipo))
    .orderBy(desc(opcaoServico.padrao), asc(opcaoServico.nome));
}
