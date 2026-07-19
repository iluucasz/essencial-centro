import type { ComponentType } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

const coresIcone = {
  muted: "text-muted",
  roxo: "text-roxo",
  brand: "text-brand",
  dourado: "text-dourado",
  perigo: "text-perigo",
} as const;

export function CardKpi({
  icone: Icone,
  label,
  valor,
  destaque,
  cor = "muted",
  tendencia,
}: {
  icone: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  valor: string;
  destaque?: "positivo" | "neutro";
  cor?: keyof typeof coresIcone;
  tendencia?: { percentual: number; rotulo: string };
}) {
  return (
    <div className="flex h-full min-h-36 flex-col rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <span className={`flex min-w-0 items-center gap-1.5 text-sm ${coresIcone[cor]}`}>
        <Icone className="size-4 shrink-0" aria-hidden={true} />
        <span className="min-w-0 text-muted">{label}</span>
      </span>
      <span
        className={`mt-4 min-w-0 text-2xl leading-tight font-semibold break-words sm:text-3xl ${destaque === "positivo" ? "text-brand" : "text-foreground"}`}
      >
        {valor}
      </span>
      {tendencia ? (
        <span className="mt-auto flex min-h-5 items-center gap-1.5 text-xs">
          <span
            className={`flex items-center gap-0.5 font-medium ${
              tendencia.percentual >= 0 ? "text-brand" : "text-perigo"
            }`}
          >
            {tendencia.percentual >= 0 ? (
              <TrendingUp className="size-3" aria-hidden="true" />
            ) : (
              <TrendingDown className="size-3" aria-hidden="true" />
            )}
            {Math.abs(tendencia.percentual)}%
          </span>
          <span className="text-muted">{tendencia.rotulo}</span>
        </span>
      ) : (
        <span className="mt-auto min-h-5" aria-hidden="true" />
      )}
    </div>
  );
}
