import { NotebookPen, TrendingDown, TrendingUp } from "lucide-react";

import { calcularVariacaoDor } from "@/modules/sessoes/evolucao-dor";

type SessaoResumo = {
  id: string;
  dataHora: Date;
  regiaoTratada: string | null;
  escalaDorAntes: number | null;
  escalaDorDepois: number | null;
};

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" }).format(data);
}

export function ListaSessoes({ sessoes }: { sessoes: SessaoResumo[] }) {
  if (sessoes.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <NotebookPen className="size-4" aria-hidden="true" />
        Nenhuma sessão registrada ainda.
      </div>
    );
  }

  return (
    <ul className="grid gap-2">
      {sessoes.map((s) => {
        const variacao = calcularVariacaoDor(s.escalaDorAntes, s.escalaDorDepois);

        return (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3"
          >
            <span>
              <span className="block text-sm font-medium text-foreground">
                {s.regiaoTratada ?? "Sessão"}
              </span>
              <span className="text-xs text-muted">{formatarData(s.dataHora)}</span>
            </span>

            {variacao ? (
              <span
                className={`flex items-center gap-1 text-xs font-medium ${
                  variacao.melhora ? "text-brand" : "text-dourado"
                }`}
              >
                {variacao.melhora ? (
                  <TrendingDown className="size-3.5" aria-hidden="true" />
                ) : (
                  <TrendingUp className="size-3.5" aria-hidden="true" />
                )}
                Dor {s.escalaDorAntes} → {s.escalaDorDepois}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
