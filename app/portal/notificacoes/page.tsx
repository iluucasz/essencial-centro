import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";

import { ListaNotificacoes } from "@/modules/notificacoes/components/lista-notificacoes";
import { listarMinhasNotificacoes } from "@/modules/notificacoes/queries";

export default async function NotificacoesPage() {
  const notificacoes = await listarMinhasNotificacoes();

  return (
    <main className="area-interna mx-auto min-h-screen w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-5 sm:gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
          href="/portal"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao portal
        </Link>

        <header className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
            <Bell className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted">Área do cliente</p>
            <h1 className="text-xl font-semibold text-roxo sm:text-2xl">Notificações</h1>
          </div>
        </header>

        <ListaNotificacoes notificacoes={notificacoes} />
      </div>
    </main>
  );
}
