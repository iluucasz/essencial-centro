import Link from "next/link";
import { ArrowLeft, NotebookPen } from "lucide-react";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { ListaSessoesPortal } from "@/modules/sessoes/components/lista-sessoes-portal";
import { listarMinhasSessoes } from "@/modules/sessoes/queries";

export default async function MinhasSessoesPage({
  searchParams,
}: {
  searchParams: Promise<{ sessao?: string }>;
}) {
  const { sessao: sessaoDestaqueId } = await searchParams;
  let sessoes: Awaited<ReturnType<typeof listarMinhasSessoes>> = [];
  let erro: string | null = null;

  try {
    sessoes = await listarMinhasSessoes();
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      erro = error.message;
    } else {
      throw error;
    }
  }

  return (
    <main className="area-interna mx-auto min-h-screen w-full max-w-[1600px] bg-creme px-6 py-8">
      <div className="grid gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
          href="/portal"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao portal
        </Link>

        <header>
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <NotebookPen className="size-4" aria-hidden="true" />
            Área do cliente
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-roxo">Minhas sessões</h1>
          <p className="mt-2 text-sm text-foreground">
            Seu relato e as orientações de cada atendimento. Avaliações internas não aparecem aqui.
          </p>
        </header>

        {erro ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            {erro}
          </div>
        ) : (
          <ListaSessoesPortal sessaoDestaqueId={sessaoDestaqueId} sessoes={sessoes} />
        )}
      </div>
    </main>
  );
}
