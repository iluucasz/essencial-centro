import Link from "next/link";
import { Bell, BellOff, Check } from "lucide-react";

import { marcarNotificacaoComoLida } from "@/modules/notificacoes/actions";
import type { Notificacao } from "@/modules/notificacoes/schema";

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(data);
}

export function ListaNotificacoes({ notificacoes }: { notificacoes: Notificacao[] }) {
  if (notificacoes.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        <BellOff className="size-4 shrink-0" aria-hidden="true" />
        Nenhuma notificação por enquanto.
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {notificacoes.map((notificacao) => {
        const conteudo = (
          /*
            `min-w-0` no bloco de texto e `shrink-0` no ícone: sem isso, uma mensagem longa (comum nos
            lembretes de agendamento, que citam serviço + data + hora por extenso) forçava a linha
            flex a alargar além da viewport em vez de quebrar — a página inteira "estourava" no mobile.
          */
          <span className="flex min-w-0 items-start gap-3">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${notificacao.lida ? "bg-creme text-muted" : "bg-lilas/35 text-roxo"}`}
            >
              <Bell className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold break-words text-foreground">
                {notificacao.titulo}
              </span>
              <span className="mt-1 block text-sm break-words text-muted">
                {notificacao.mensagem}
              </span>
              <span className="mt-1.5 block text-xs text-muted">
                {formatarData(notificacao.criadoEm)}
              </span>
            </span>
          </span>
        );

        return (
          <li
            key={notificacao.id}
            className={`grid gap-3 rounded-2xl border p-4 transition sm:grid-cols-[1fr_auto] sm:items-center ${
              notificacao.lida ? "border-border bg-surface opacity-70" : "border-roxo/20 bg-surface"
            }`}
          >
            {notificacao.link ? (
              <Link className="min-w-0 hover:opacity-80" href={notificacao.link}>
                {conteudo}
              </Link>
            ) : (
              <div className="min-w-0">{conteudo}</div>
            )}

            {!notificacao.lida ? (
              <form
                action={marcarNotificacaoComoLida}
                className="justify-self-stretch sm:justify-self-end"
              >
                <input name="id" type="hidden" value={notificacao.id} />
                <button
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:w-auto"
                  type="submit"
                >
                  <Check className="size-3.5" aria-hidden="true" />
                  Marcar como lida
                </button>
              </form>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
