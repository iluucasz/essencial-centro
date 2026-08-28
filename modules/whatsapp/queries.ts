import "server-only";

import { count, desc, eq, isNotNull } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";

import {
  campanhaMensagem,
  configuracaoAniversario,
  envioAniversario,
  envioCampanhaMensagem,
  mensagemPredefinida,
} from "./schema";

/** Linha única de configuração — cria com os padrões (`ativo: false`) se ainda não existe. */
export async function obterConfiguracaoAniversario() {
  autorizarPapel(await auth(), ["profissional"]);

  return obterConfiguracaoAniversarioParaJob();
}

/**
 * Mesma leitura, SEM checar sessão — pro job (cron e gatilho preguiçoso via `after()`) usar.
 * Nenhum dos dois tem sessão de usuário disponível: o cron autentica por `CRON_SECRET`, e dentro de
 * `after()` de Server Component nem é permitido ler `cookies()`/`headers()` (lança em runtime) —
 * foi exatamente isso que fazia o disparo automático marcar "já rodei hoje" e travar antes de
 * mandar qualquer mensagem, silenciosamente. A tela (`obterConfiguracaoAniversario`, acima) continua
 * autorizada, porque ali sempre há sessão de verdade.
 */
export async function obterConfiguracaoAniversarioParaJob() {
  const [registro] = await db.select().from(configuracaoAniversario).limit(1);

  return registro ?? { id: null, ativo: false, brinde: null, ultimoDisparoAutomaticoEm: null };
}

/**
 * Candidatos ao disparo do dia: só quem tem telefone cadastrado (sem ele não há como enviar).
 * Sem checagem de role própria — só a rota de cron e a action de disparo manual chamam isto, e
 * ambas já autorizam antes de chegar aqui (mesmo padrão de `listarAgendamentosParaLembretes`).
 */
export async function listarClientesParaAniversario() {
  return db
    .select({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      dataNascimento: cliente.dataNascimento,
    })
    .from(cliente)
    .where(isNotNull(cliente.telefone));
}

/** Últimos envios, pra profissional ver que a automação está funcionando de verdade. */
export async function listarHistoricoAniversarios(limite = 20) {
  autorizarPapel(await auth(), ["profissional"]);

  return db
    .select({
      id: envioAniversario.id,
      clienteNome: cliente.nome,
      enviadoEm: envioAniversario.enviadoEm,
    })
    .from(envioAniversario)
    .innerJoin(cliente, eq(cliente.id, envioAniversario.clienteId))
    .orderBy(desc(envioAniversario.enviadoEm))
    .limit(limite);
}

/** Biblioteca de mensagens reaproveitáveis, mais recente primeiro. */
export async function listarMensagensPredefinidas() {
  autorizarPapel(await auth(), ["profissional"]);

  return db.select().from(mensagemPredefinida).orderBy(desc(mensagemPredefinida.atualizadoEm));
}

/** Clientes elegíveis pra campanha — só quem tem telefone, sem o qual não há como enviar. */
export async function listarClientesComTelefone() {
  autorizarPapel(await auth(), ["profissional"]);

  return db
    .select({ id: cliente.id, nome: cliente.nome, telefone: cliente.telefone })
    .from(cliente)
    .where(isNotNull(cliente.telefone))
    .orderBy(cliente.nome);
}

/**
 * Histórico de campanhas com contagem de sucesso/falha por envio — a profissional precisa ver que
 * a mensagem realmente saiu, não só que o botão foi clicado.
 */
export async function listarHistoricoCampanhas(limite = 20) {
  autorizarPapel(await auth(), ["profissional"]);

  const campanhas = await db
    .select({
      id: campanhaMensagem.id,
      conteudo: campanhaMensagem.conteudo,
      destinatarios: campanhaMensagem.destinatarios,
      criadoEm: campanhaMensagem.criadoEm,
    })
    .from(campanhaMensagem)
    .orderBy(desc(campanhaMensagem.criadoEm))
    .limit(limite);

  if (campanhas.length === 0) return [];

  const contagens = await db
    .select({
      campanhaId: envioCampanhaMensagem.campanhaId,
      status: envioCampanhaMensagem.status,
      total: count(),
    })
    .from(envioCampanhaMensagem)
    .groupBy(envioCampanhaMensagem.campanhaId, envioCampanhaMensagem.status);

  const contagemPorCampanha = new Map<string, { enviados: number; falhas: number }>();

  for (const linha of contagens) {
    const atual = contagemPorCampanha.get(linha.campanhaId) ?? { enviados: 0, falhas: 0 };

    if (linha.status === "enviado") atual.enviados += linha.total;
    else atual.falhas += linha.total;

    contagemPorCampanha.set(linha.campanhaId, atual);
  }

  return campanhas.map((campanha) => ({
    ...campanha,
    ...(contagemPorCampanha.get(campanha.id) ?? { enviados: 0, falhas: 0 }),
  }));
}
