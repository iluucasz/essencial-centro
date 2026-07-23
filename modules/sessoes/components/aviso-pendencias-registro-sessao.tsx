import Link from "next/link";
import { CalendarClock, ChevronRight, NotebookPen, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export type PendenciaRegistroSessao = {
  agendamentoId: string;
  clienteId: string;
  clienteNome: string;
  inicio: Date;
  servicoNome: string;
};

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function rotuloQuantidade(quantidade: number) {
  return `${quantidade} ${quantidade === 1 ? "sessão precisa" : "sessões precisam"}`;
}

export function hrefSessoesCliente(clienteId: string) {
  return `/painel/clientes/${clienteId}?aba=sessoes`;
}

export function AvisoPendenciasRegistroSessaoPainel({
  pendencias,
  total,
}: {
  pendencias: PendenciaRegistroSessao[];
  total: number;
}) {
  if (total === 0) return null;

  const pendenciasOcultas = Math.max(total - pendencias.length, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-dourado/25 bg-dourado/10">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dourado/20 px-4 py-4 sm:px-5">
        <span className="flex min-w-0 items-start gap-3">
          <span className="rounded-2xl bg-dourado/15 p-2.5 text-dourado">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">
              Sessões clínicas para preencher
            </h2>
            <p className="mt-1 text-sm text-muted">
              {rotuloQuantidade(total)} de registro após atendimento realizado.
            </p>
          </span>
        </span>
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-dourado">
          {total} pendente{total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid divide-y divide-dourado/20">
        {pendencias.map((pendencia) => (
          <Link
            className="group grid gap-3 px-4 py-3 text-sm transition hover:bg-surface/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
            href={hrefSessoesCliente(pendencia.clienteId)}
            key={pendencia.agendamentoId}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="rounded-xl bg-surface p-2 text-dourado transition group-hover:text-roxo">
                <NotebookPen className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-foreground">
                  {pendencia.clienteNome}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted">
                  {pendencia.servicoNome} · {formatadorDataHora.format(pendencia.inicio)}
                </span>
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition group-hover:text-roxo">
              Abrir sessões
              <ChevronRight className="size-4" aria-hidden="true" />
            </span>
          </Link>
        ))}

        {pendenciasOcultas > 0 ? (
          <p className="px-4 py-3 text-xs font-medium text-muted sm:px-5">
            +{pendenciasOcultas} pendência{pendenciasOcultas === 1 ? "" : "s"} em outros clientes.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function AvisoPendenciasRegistroSessaoCliente({
  className,
  href,
  quantidade,
}: {
  className?: string;
  href: string;
  quantidade: number;
}) {
  if (quantidade === 0) return null;

  return (
    <Link
      className={cn(
        "group grid gap-3 rounded-2xl border border-dourado/25 bg-dourado/10 p-4 transition hover:bg-dourado/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-5",
        className,
      )}
      href={href}
    >
      <span className="rounded-2xl bg-dourado/15 p-2.5 text-dourado">
        <CalendarClock className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">
          {rotuloQuantidade(quantidade)} ser preenchida{quantidade === 1 ? "" : "s"}
        </span>
        <span className="mt-1 block text-sm text-muted">
          Atendimento realizado sem registro clínico. Abra a aba Sessões para completar.
        </span>
      </span>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition group-hover:text-roxo">
        Abrir sessões
        <ChevronRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
