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
    <div className="grid gap-2 rounded-2xl bg-surface p-4 shadow-sm sm:p-5">
      <span className={`flex items-center gap-1.5 text-sm ${coresIcone[cor]}`}>
        <Icone className="size-4" aria-hidden={true} />
        <span className="text-muted">{label}</span>
      </span>
      <span
        className={`text-2xl font-semibold sm:text-3xl ${destaque === "positivo" ? "text-brand" : "text-foreground"}`}
      >
        {valor}
      </span>
      {tendencia ? (
        <span className="flex items-center gap-1.5 text-xs">
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
      ) : null}
    </div>
  );
}
