"use client";

import { useState } from "react";
import { CalendarClock, PackageCheck, RefreshCcw } from "lucide-react";

import type { ProgressoPacote } from "@/modules/pacotes/progresso";

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "UTC",
});

export type PacoteDestaqueCliente = {
  id: string;
  progresso: ProgressoPacote;
  proximaSessao: Date | string | null;
  servicoNome: string;
};

function formatarProximaSessao(data: Date | string | null) {
  if (!data) return "não agendada";

  return formatadorDataHora.format(new Date(data));
}

export function DestaquePacoteCliente({ pacotes }: { pacotes: PacoteDestaqueCliente[] }) {
  const [indice, setIndice] = useState(0);

  if (pacotes.length === 0) {
    return (
      <div className="flex h-full items-start gap-3 rounded-3xl border border-border bg-surface/90 p-4 text-sm text-muted">
        <span className="rounded-2xl bg-brand/10 p-2 text-brand">
          <PackageCheck className="size-4" aria-hidden="true" />
        </span>
        <span className="pt-1">Nenhum pacote ativo registrado para este cliente.</span>
      </div>
    );
  }

  const indiceAtual = Math.min(indice, pacotes.length - 1);
  const pacote = pacotes[indiceAtual];
  const temMaisDeUmPacote = pacotes.length > 1;

  function trocarPacote() {
    setIndice((atual) => (atual + 1) % pacotes.length);
  }

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-roxo/10 bg-surface/90 p-4 shadow-sm">
      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-lilas/25 text-roxo">
              <PackageCheck className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">
                {pacote.servicoNome}
              </span>
              <span className="text-xs text-muted">Pacote em acompanhamento</span>
            </span>
          </span>

          <span className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">
            {pacote.progresso.sessoesRealizadas}/{pacote.progresso.quantidadeSessoes}
          </span>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted">
            <span>Progresso</span>
            <span className="text-brand">{pacote.progresso.percentualConcluido}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-creme">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${pacote.progresso.percentualConcluido}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {temMaisDeUmPacote ? (
            <button
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-roxo transition hover:border-roxo/20 hover:bg-lilas/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              onClick={trocarPacote}
              title="Trocar pacote em destaque"
              type="button"
            >
              <RefreshCcw className="size-3.5" aria-hidden="true" />
              Trocar pacote
            </button>
          ) : null}
          {temMaisDeUmPacote ? (
            <span className="text-xs font-semibold text-muted">
              {indiceAtual + 1} de {pacotes.length}
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 rounded-2xl bg-brand/5 px-3 py-2 text-sm text-foreground">
        <CalendarClock className="size-4 shrink-0 text-brand" aria-hidden="true" />
        <span>
          Próxima sessão: <strong>{formatarProximaSessao(pacote.proximaSessao)}</strong>
        </span>
      </p>
    </div>
  );
}
