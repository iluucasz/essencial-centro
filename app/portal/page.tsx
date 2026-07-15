import Link from "next/link";
import { CalendarClock, ClipboardList, IdCard, NotebookPen } from "lucide-react";

import { BotaoSair } from "@/modules/auth/components/botao-sair";
import { exigirUsuarioAtual } from "@/modules/auth/queries";

export default async function PortalPage() {
  const usuario = await exigirUsuarioAtual(["cliente"]);

  return (
    <main className="min-h-screen bg-creme px-6 py-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">Área do cliente</p>
          <h1 className="text-2xl font-semibold text-roxo">Portal Essencial Centro</h1>
          <p className="mt-2 text-sm text-foreground">Olá, {usuario.name ?? usuario.email}.</p>
        </div>
        <BotaoSair />
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-2">
        <Link
          className="inline-flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          href="/portal/agendamentos"
        >
          <span className="rounded-lg bg-lilas/35 p-2 text-roxo">
            <CalendarClock className="size-5" aria-hidden="true" />
          </span>
          Meus agendamentos
        </Link>

        <Link
          className="inline-flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          href="/portal/fichas"
        >
          <span className="rounded-lg bg-lilas/35 p-2 text-roxo">
            <ClipboardList className="size-5" aria-hidden="true" />
          </span>
          Minhas fichas
        </Link>

        <Link
          className="inline-flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          href="/portal/sessoes"
        >
          <span className="rounded-lg bg-lilas/35 p-2 text-roxo">
            <NotebookPen className="size-5" aria-hidden="true" />
          </span>
          Minhas sessões
        </Link>

        <Link
          className="inline-flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          href="/portal/dados"
        >
          <span className="rounded-lg bg-lilas/35 p-2 text-roxo">
            <IdCard className="size-5" aria-hidden="true" />
          </span>
          Meus dados
        </Link>
      </div>
    </main>
  );
}
