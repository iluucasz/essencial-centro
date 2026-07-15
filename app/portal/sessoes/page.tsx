import Link from "next/link";
import { ArrowLeft, NotebookPen } from "lucide-react";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { listarMinhasSessoes } from "@/modules/sessoes/queries";

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(data);
}

export default async function MinhasSessoesPage() {
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
    <main className="min-h-screen bg-creme px-6 py-8">
      <div className="mx-auto grid max-w-3xl gap-6">
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
        ) : sessoes.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            Nenhuma sessão registrada ainda.
          </div>
        ) : (
          <ul className="grid gap-4">
            {sessoes.map((sessao) => (
              <li
                key={sessao.id}
                className="grid gap-2 rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {sessao.regiaoTratada ?? "Sessão"}
                  </span>
                  <span className="text-xs text-muted">{formatarData(sessao.dataHora)}</span>
                </div>

                {sessao.escalaDorAntes !== null && sessao.escalaDorDepois !== null ? (
                  <p className="text-sm text-foreground">
                    Dor antes/depois: {sessao.escalaDorAntes} → {sessao.escalaDorDepois}
                  </p>
                ) : null}

                {sessao.orientacoesPosAtendimento ? (
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Orientações: </span>
                    {sessao.orientacoesPosAtendimento}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
