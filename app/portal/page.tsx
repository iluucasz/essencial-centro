import Link from "next/link";
import {
  CalendarClock,
  ClipboardList,
  IdCard,
  ImageIcon,
  NotebookPen,
  Ruler,
  TrendingUp,
} from "lucide-react";

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

      <div className="mx-auto mt-8 max-w-5xl">
        <Link
          className="flex items-center gap-3 rounded-2xl bg-brand p-5 text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          href="/portal/evolucao"
        >
          <span className="rounded-lg bg-white/15 p-2">
            <TrendingUp className="size-6" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-lg font-semibold">Minha jornada</span>
            <span className="block text-sm text-brand-foreground/80">
              Sessões, medidas, dor, fotos e pacotes — tudo em um só lugar.
            </span>
          </span>
        </Link>
      </div>

      <div className="mx-auto mt-4 grid max-w-5xl gap-4 sm:grid-cols-2">
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
          href="/portal/medidas"
        >
          <span className="rounded-lg bg-lilas/35 p-2 text-roxo">
            <Ruler className="size-5" aria-hidden="true" />
          </span>
          Minhas medidas
        </Link>

        <Link
          className="inline-flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          href="/portal/fotos"
        >
          <span className="rounded-lg bg-lilas/35 p-2 text-roxo">
            <ImageIcon className="size-5" aria-hidden="true" />
          </span>
          Minhas fotos
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
