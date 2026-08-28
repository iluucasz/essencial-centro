import { Cake, MessageSquareText, Send } from "lucide-react";

import { FormularioAniversario } from "@/modules/whatsapp/components/formulario-aniversario";
import { FormularioCampanha } from "@/modules/whatsapp/components/formulario-campanha";
import { HistoricoAniversarios } from "@/modules/whatsapp/components/historico-aniversarios";
import { HistoricoCampanhas } from "@/modules/whatsapp/components/historico-campanhas";
import { MensagensPredefinidas } from "@/modules/whatsapp/components/mensagens-predefinidas";
import {
  listarClientesComTelefone,
  listarHistoricoAniversarios,
  listarHistoricoCampanhas,
  listarMensagensPredefinidas,
  obterConfiguracaoAniversario,
} from "@/modules/whatsapp/queries";

/**
 * Estende o tempo padrão de Server Actions disparadas nesta página — o envio de campanha manda
 * mensagem por mensagem, sequencialmente (ver comentário em modules/whatsapp/actions.ts). Só faz
 * efeito nessa página, não afeta o resto do painel.
 */
export const maxDuration = 120;

export default async function WhatsAppPage() {
  const [
    configuracaoAniversario,
    historicoAniversarios,
    mensagensPredefinidas,
    clientes,
    historicoCampanhas,
  ] = await Promise.all([
    obterConfiguracaoAniversario(),
    listarHistoricoAniversarios(),
    listarMensagensPredefinidas(),
    listarClientesComTelefone(),
    listarHistoricoCampanhas(),
  ]);

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand">WhatsApp</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground">
          Automações e envios de mensagens por WhatsApp — área interna, não visível ao cliente.
        </p>
      </header>

      <section className="grid gap-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Cake className="size-5 text-roxo" aria-hidden="true" />
            Mensagem de aniversário
          </h2>
          <p className="mt-1 text-sm text-muted">
            No dia do aniversário, o cliente com telefone cadastrado recebe uma mensagem automática
            — só uma vez por ano, mesmo que a automação rode mais de uma vez no dia.
          </p>
        </div>

        <div className="border-t border-border/70 pt-4">
          <FormularioAniversario
            ativoInicial={configuracaoAniversario.ativo}
            brindeInicial={configuracaoAniversario.brinde}
          />
        </div>

        <div className="grid gap-2 border-t border-border/70 pt-4">
          <h3 className="text-sm font-semibold text-foreground">Últimos envios</h3>
          <HistoricoAniversarios envios={historicoAniversarios} />
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <MessageSquareText className="size-5 text-roxo" aria-hidden="true" />
            Mensagens predefinidas
          </h2>
          <p className="mt-1 text-sm text-muted">
            Modelos que você pode reaproveitar em vários envios, sem escrever tudo de novo.
          </p>
        </div>

        <div className="border-t border-border/70 pt-4">
          <MensagensPredefinidas mensagens={mensagensPredefinidas} />
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Send className="size-5 text-roxo" aria-hidden="true" />
            Enviar mensagem
          </h2>
          <p className="mt-1 text-sm text-muted">
            Escreva na hora ou parta de um modelo, e mande pra todos os clientes ou só pra quem você
            escolher.
          </p>
        </div>

        <div className="border-t border-border/70 pt-4">
          <FormularioCampanha clientes={clientes} mensagensPredefinidas={mensagensPredefinidas} />
        </div>

        <div className="grid gap-2 border-t border-border/70 pt-4">
          <h3 className="text-sm font-semibold text-foreground">Últimos envios</h3>
          <HistoricoCampanhas campanhas={historicoCampanhas} />
        </div>
      </section>
    </div>
  );
}
