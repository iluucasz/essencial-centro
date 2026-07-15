import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";

import { ListaNotificacoes } from "@/modules/notificacoes/components/lista-notificacoes";
import { listarMinhasNotificacoes } from "@/modules/notificacoes/queries";

export default async function NotificacoesPage() {
  const notificacoes = await listarMinhasNotificacoes();

  return (
    <main className="min-h-screen bg-creme px-6 py-8">
      <div className="mx-auto grid max-w-2xl gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
          href="/portal"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao portal
        </Link>

        <header>
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <Bell className="size-4" aria-hidden="true" />
            Área do cliente
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-roxo">Notificações</h1>
        </header>

        <ListaNotificacoes notificacoes={notificacoes} />
      </div>
    </main>
  );
}
