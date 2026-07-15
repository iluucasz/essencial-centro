import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { obterMinhaEvolucao } from "@/modules/evolucao/queries";
import { ResumoEvolucao } from "@/modules/evolucao/components/resumo-evolucao";

export default async function MinhaEvolucaoCompletaPage() {
  let resumo: Awaited<ReturnType<typeof obterMinhaEvolucao>> | null = null;
  let erro: string | null = null;

  try {
    resumo = await obterMinhaEvolucao();
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      erro = error.message;
    } else {
      throw error;
    }
  }

  return (
    <main className="min-h-screen bg-creme px-6 py-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
          href="/portal"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao portal
        </Link>

        <header>
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <TrendingUp className="size-4" aria-hidden="true" />
            Área do cliente
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-roxo">Minha jornada</h1>
          <p className="mt-2 text-sm text-foreground">
            Tudo que você já conquistou no seu tratamento, em um só lugar.
          </p>
        </header>

        {erro || !resumo ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            {erro ?? "Não foi possível carregar sua evolução."}
          </div>
        ) : (
          <ResumoEvolucao resumo={resumo} />
        )}
      </div>
    </main>
  );
}
