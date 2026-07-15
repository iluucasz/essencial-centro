import type { ComponentType } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

const coresBadge = {
  roxo: "bg-lilas/35 text-roxo",
  brand: "bg-brand/15 text-brand",
  dourado: "bg-dourado/20 text-dourado",
  perigo: "bg-perigo/15 text-perigo",
} as const;

export function CardKpi({
  icone: Icone,
  label,
  valor,
  destaque,
  cor = "roxo",
  tendencia,
}: {
  icone: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  valor: string;
  destaque?: "positivo" | "neutro";
  cor?: keyof typeof coresBadge;
  tendencia?: { percentual: number; rotulo: string };
}) {
  return (
    <div className="grid gap-2 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className={`flex size-9 items-center justify-center rounded-lg ${coresBadge[cor]}`}>
          <Icone className="size-4" aria-hidden={true} />
        </span>
        {tendencia ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              tendencia.percentual >= 0 ? "bg-brand/15 text-brand" : "bg-perigo/15 text-perigo"
            }`}
          >
            {tendencia.percentual >= 0 ? (
              <TrendingUp className="size-3" aria-hidden="true" />
            ) : (
              <TrendingDown className="size-3" aria-hidden="true" />
            )}
            {Math.abs(tendencia.percentual)}%
          </span>
        ) : null}
      </div>
      <span className="text-sm text-muted">{label}</span>
      <span
        className={`text-2xl font-semibold ${destaque === "positivo" ? "text-brand" : "text-foreground"}`}
      >
        {valor}
      </span>
      {tendencia ? <span className="text-xs text-muted">{tendencia.rotulo}</span> : null}
    </div>
  );
}
