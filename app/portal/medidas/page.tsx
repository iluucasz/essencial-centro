import Link from "next/link";
import { ArrowLeft, Ruler } from "lucide-react";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { TabelaEvolucao } from "@/modules/medidas/components/tabela-evolucao";
import { listarMinhaEvolucao } from "@/modules/medidas/queries";

export default async function MinhaEvolucaoPage() {
  let evolucao: Awaited<ReturnType<typeof listarMinhaEvolucao>> = [];
  let erro: string | null = null;

  try {
    evolucao = await listarMinhaEvolucao();
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
            <Ruler className="size-4" aria-hidden="true" />
            Área do cliente
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-roxo">Minha evolução</h1>
          <p className="mt-2 text-sm text-foreground">
            Comparação entre a primeira e a mais recente medida de cada região.
          </p>
        </header>

        {erro ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            {erro}
          </div>
        ) : (
          <TabelaEvolucao evolucao={evolucao} />
        )}
      </div>
    </main>
  );
}
