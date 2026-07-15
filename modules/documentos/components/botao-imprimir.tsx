"use client";

import { Printer } from "lucide-react";

export function BotaoImprimir() {
  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo print:hidden"
      onClick={() => window.print()}
      type="button"
    >
      <Printer className="size-4" aria-hidden="true" />
      Imprimir / Salvar PDF
    </button>
  );
}
