import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { agoraBrasilia } from "@/lib/utils";

import { devDispararAutomaticamente } from "./aniversario";
import { dispararMensagensAniversario } from "./aniversario-job";
import { configuracaoAniversario } from "./schema";

/**
 * Gatilho "preguiçoso" da automação de aniversário — chamado (via `after()`, sem atrasar a
 * resposta) sempre que alguém abre o painel, em `app/painel/layout.tsx`. Existe porque o cron da
 * Vercel só dispara em produção deployada: sem isto, a automação simplesmente não roda em dev
 * local nem antes do primeiro deploy com `CRON_SECRET` configurado.
 *
 * Sem checagem de role/sessão própria de propósito — quem chama já passou pela autorização do
 * layout do painel; e mesmo que rodasse em duplicidade (duas abas abertas ao mesmo tempo), o
 * índice único de `envio_aniversario` (cliente+ano) já impede mensagem duplicada de verdade,
 * então não há necessidade de lock pesado aqui — só de evitar trabalho repetido.
 */
export async function dispararAniversariosSeNecessarioHoje() {
  const [configuracao] = await db
    .select({
      id: configuracaoAniversario.id,
      ativo: configuracaoAniversario.ativo,
      ultimoDisparoAutomaticoEm: configuracaoAniversario.ultimoDisparoAutomaticoEm,
    })
    .from(configuracaoAniversario)
    .limit(1);

  if (!configuracao) return;

  const hoje = agoraBrasilia();

  if (!devDispararAutomaticamente(configuracao, hoje)) return;

  // Marca ANTES de disparar: reduz (não precisa eliminar) chance de duas requisições simultâneas
  // repetirem o trabalho — a garantia real contra mensagem duplicada é o índice único do envio.
  await db
    .update(configuracaoAniversario)
    .set({ ultimoDisparoAutomaticoEm: hoje })
    .where(eq(configuracaoAniversario.id, configuracao.id));

  await dispararMensagensAniversario();
}
