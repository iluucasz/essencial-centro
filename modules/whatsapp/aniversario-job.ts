import "server-only";

import { db } from "@/db";
import { agoraBrasilia } from "@/lib/utils";
import { violaConstraintUnica } from "@/lib/db-erros";
import { enviarWhatsAppTexto } from "@/modules/notificacoes/whatsapp";

import { ehAniversarioHoje, mensagemAniversario } from "./aniversario";
import { listarClientesParaAniversario, obterConfiguracaoAniversarioParaJob } from "./queries";
import { envioAniversario } from "./schema";

/**
 * Chamado pelo cron (`app/api/cron/aniversarios`) e pelo disparo manual (`dispararAniversariosAgora`
 * em actions.ts) — mesma função, pra "Disparar agora" testar exatamente o que vai rodar sozinho.
 *
 * Idempotência: insere o registro do envio ANTES de mandar a mensagem; se já existe (índice único
 * cliente+ano), a inserção falha e o cliente é pulado — protege contra o cron rodar duas vezes no
 * mesmo dia sem precisar de lock. Falha no envio não desfaz o registro nem tenta de novo amanhã,
 * mesma filosofia de `agendamento.lembreteDiaAnteriorEm` (ver modules/agenda/lembretes.ts).
 */
export async function dispararMensagensAniversario() {
  const configuracao = await obterConfiguracaoAniversarioParaJob();

  if (!configuracao.ativo) {
    return { ativo: false, analisados: 0, enviados: 0 };
  }

  const hoje = agoraBrasilia();
  const ano = hoje.getUTCFullYear();
  const candidatos = await listarClientesParaAniversario();

  let enviados = 0;

  for (const item of candidatos) {
    if (!item.telefone || !ehAniversarioHoje(item.dataNascimento, hoje)) continue;

    try {
      await db.insert(envioAniversario).values({ clienteId: item.id, ano });
    } catch (erro) {
      if (violaConstraintUnica(erro, "envio_aniversario_cliente_ano_unique")) continue;

      throw erro;
    }

    const primeiroNome = item.nome.trim().split(/\s+/)[0] ?? item.nome;

    await enviarWhatsAppTexto({
      telefone: item.telefone,
      mensagem: mensagemAniversario({ primeiroNome, brinde: configuracao.brinde }),
    });

    enviados += 1;
  }

  return { ativo: true, analisados: candidatos.length, enviados };
}
