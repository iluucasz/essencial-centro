import type { ComponentType } from "react";

export function CardKpi({
  icone: Icone,
  label,
  valor,
  destaque,
}: {
  icone: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  valor: string;
  destaque?: "positivo" | "neutro";
}) {
  return (
    <div className="grid gap-2 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <span className="flex size-9 items-center justify-center rounded-lg bg-lilas/35 text-roxo">
        <Icone className="size-4" aria-hidden={true} />
      </span>
      <span className="text-sm text-muted">{label}</span>
      <span
        className={`text-2xl font-semibold ${destaque === "positivo" ? "text-brand" : "text-foreground"}`}
      >
        {valor}
      </span>
    </div>
  );
}
