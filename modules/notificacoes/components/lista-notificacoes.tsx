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
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <BellOff className="size-4" aria-hidden="true" />
        Nenhuma notificação por enquanto.
      </div>
    );
  }

  return (
    <ul className="grid gap-2">
      {notificacoes.map((notificacao) => {
        const conteudo = (
          <>
            <span className="flex items-start gap-3">
              <span
                className={`mt-0.5 rounded-lg p-2 ${notificacao.lida ? "bg-creme text-muted" : "bg-lilas/35 text-roxo"}`}
              >
                <Bell className="size-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-medium text-foreground">{notificacao.titulo}</span>
                <span className="mt-1 block text-sm text-muted">{notificacao.mensagem}</span>
                <span className="mt-1 block text-xs text-muted">
                  {formatarData(notificacao.criadoEm)}
                </span>
              </span>
            </span>
          </>
        );

        return (
          <li
            key={notificacao.id}
            className={`grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-[1fr_auto] sm:items-start ${
              notificacao.lida ? "opacity-70" : ""
            }`}
          >
            {notificacao.link ? (
              <Link className="hover:opacity-80" href={notificacao.link}>
                {conteudo}
              </Link>
            ) : (
              <div>{conteudo}</div>
            )}

            {!notificacao.lida ? (
              <form action={marcarNotificacaoComoLida}>
                <input name="id" type="hidden" value={notificacao.id} />
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
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
