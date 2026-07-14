import { LogOut } from "lucide-react";

import { sair } from "@/modules/auth/actions";

export function BotaoSair() {
  return (
    <form action={sair}>
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        type="submit"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Sair
      </button>
    </form>
  );
}
