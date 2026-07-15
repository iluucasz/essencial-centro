import { CheckCircle2, MessageCircle, XCircle } from "lucide-react";

import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { FormularioTesteWhatsApp } from "@/modules/notificacoes/components/formulario-teste-whatsapp";
import { consultarStatusConexaoWhatsApp } from "@/modules/notificacoes/whatsapp";

export default async function ConfiguracoesPage() {
  await exigirUsuarioAtual(["profissional"]);

  const status = await consultarStatusConexaoWhatsApp();

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand">Configurações</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground">
          Diagnóstico de integrações — área interna, não visível ao cliente.
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold text-foreground">WhatsApp (Evolution API)</h2>

        <div className="grid gap-2 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle className="size-4 text-muted" aria-hidden="true" />
            <span className="font-medium text-foreground">
              {status.configured ? `Instância: ${status.instance}` : "Não configurado"}
            </span>
          </div>

          {status.configured ? (
            <div className="flex items-center gap-2 text-sm">
              {status.connected ? (
                <>
                  <CheckCircle2 className="size-4 text-brand" aria-hidden="true" />
                  <span className="text-brand">Conectado</span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-perigo" aria-hidden="true" />
                  <span className="text-perigo">
                    Desconectado{status.error ? ` — ${status.error}` : ""}
                  </span>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Configure EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE no ambiente.
            </p>
          )}
        </div>

        {status.configured ? (
          <div className="grid gap-3 rounded-lg border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-foreground">Enviar mensagem de teste</h3>
            <FormularioTesteWhatsApp />
          </div>
        ) : null}
      </section>
    </div>
  );
}
