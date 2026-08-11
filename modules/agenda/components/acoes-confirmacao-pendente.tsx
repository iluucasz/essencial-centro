"use client";

import { useActionState } from "react";
import { CheckCheck, LoaderCircle, Send } from "lucide-react";

import { confirmarStatusAgendamento, type EstadoFormularioAgendamento } from "../actions";
import { reenviarPedidoConfirmacao, type ResultadoReenvio } from "../confirmacao-actions";

/**
 * Ações da profissional sobre um agendamento que ainda aguarda o "de acordo" do cliente: reenviar o
 * link no WhatsApp ou confirmar em nome dele (cliente que respondeu por telefone / na recepção).
 */
export function AcoesConfirmacaoPendente({ agendamentoId }: { agendamentoId: string }) {
  const [reenvio, reenviar, reenviando] = useActionState<ResultadoReenvio, FormData>(
    reenviarPedidoConfirmacao,
    { status: "inicial" },
  );
  const [marcacao, marcar, marcando] = useActionState<EstadoFormularioAgendamento, FormData>(
    confirmarStatusAgendamento,
    { status: "inicial" },
  );

  const aviso = marcacao.status !== "inicial" ? marcacao : reenvio;

  return (
    <div className="grid gap-3">
      <p className="rounded-xl bg-background px-3 py-2 text-sm text-muted">
        Aguardando a confirmação do cliente pelo link enviado no WhatsApp. O horário já está
        reservado na agenda.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <form action={reenviar}>
          <input name="agendamentoId" type="hidden" value={agendamentoId} />
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
            disabled={reenviando}
            type="submit"
          >
            {reenviando ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-3.5 text-roxo" aria-hidden="true" />
            )}
            Reenviar link
          </button>
        </form>

        <form action={marcar}>
          <input name="id" type="hidden" value={agendamentoId} />
          <input name="status" type="hidden" value="marcado" />
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-70"
            disabled={marcando}
            type="submit"
          >
            {marcando ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCheck className="size-3.5" aria-hidden="true" />
            )}
            Confirmar pelo cliente
          </button>
        </form>
      </div>

      {aviso.status === "erro" && aviso.mensagem ? (
        <p
          className="rounded-xl bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          {aviso.mensagem}
        </p>
      ) : null}

      {aviso.status === "sucesso" && aviso.mensagem ? (
        <p
          className="rounded-xl bg-brand/10 px-3 py-2 text-sm font-medium text-brand"
          role="status"
        >
          {aviso.mensagem}
        </p>
      ) : null}
    </div>
  );
}
