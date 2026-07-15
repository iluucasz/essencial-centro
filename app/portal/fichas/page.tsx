import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { rotulosStatusFicha, rotulosTipoFicha } from "@/modules/fichas/schema";
import { listarMinhasFichas } from "@/modules/fichas/queries";

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(data);
}

export default async function MinhasFichasPage() {
  let fichas: Awaited<ReturnType<typeof listarMinhasFichas>> = [];
  let erro: string | null = null;

  try {
    fichas = await listarMinhasFichas();
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
            <ClipboardList className="size-4" aria-hidden="true" />
            Área do cliente
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-roxo">Minhas fichas</h1>
          <p className="mt-2 text-sm text-foreground">
            Suas respostas e as orientações da profissional. Observações internas não aparecem aqui.
          </p>
        </header>

        {erro ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            {erro}
          </div>
        ) : fichas.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            Nenhuma ficha registrada ainda.
          </div>
        ) : (
          <ul className="grid gap-4">
            {fichas.map((ficha) => {
              const respostas = ficha.respostas as {
                relato?: { objetivoTratamento?: string; queixaPrincipal?: string };
                compartilhado?: { resumoTratamento?: string; orientacoes?: string };
              };

              return (
                <li
                  key={ficha.id}
                  className="grid gap-3 rounded-lg border border-border bg-surface p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {rotulosTipoFicha[ficha.tipo]}
                    </span>
                    <span className="text-xs text-muted">
                      {formatarData(ficha.criadoEm)} · {rotulosStatusFicha[ficha.status]}
                    </span>
                  </div>

                  {respostas.relato?.objetivoTratamento ? (
                    <p className="text-sm text-foreground">
                      <span className="font-medium">Objetivo: </span>
                      {respostas.relato.objetivoTratamento}
                    </p>
                  ) : null}

                  {respostas.compartilhado?.orientacoes ? (
                    <p className="text-sm text-foreground">
                      <span className="font-medium">Orientações: </span>
                      {respostas.compartilhado.orientacoes}
                    </p>
                  ) : null}

                  {respostas.compartilhado?.resumoTratamento ? (
                    <p className="text-sm text-foreground">
                      <span className="font-medium">Resumo: </span>
                      {respostas.compartilhado.resumoTratamento}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
