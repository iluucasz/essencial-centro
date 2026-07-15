import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TrendingUp } from "lucide-react";

import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { getCliente } from "@/modules/clientes/queries";
import { obterResumoEvolucaoCliente } from "@/modules/evolucao/queries";
import { ResumoEvolucao } from "@/modules/evolucao/components/resumo-evolucao";

export default async function EvolucaoClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await exigirUsuarioAtual(["profissional", "recepcao"]);
  const cliente = await getCliente(id);

  if (!cliente) {
    notFound();
  }

  const voltar = (
    <Link
      className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
      href={`/painel/clientes/${id}`}
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Voltar para o cliente
    </Link>
  );

  if (usuario.role !== "profissional") {
    return (
      <div className="grid gap-6">
        {voltar}
        <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          Somente a profissional acessa a evolução clínica do cliente.
        </div>
      </div>
    );
  }

  const resumo = await obterResumoEvolucaoCliente(id);

  return (
    <div className="grid gap-6">
      {voltar}

      <header>
        <p className="flex items-center gap-2 text-sm font-medium text-muted">
          <TrendingUp className="size-4" aria-hidden="true" />
          Jornada do tratamento
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-brand">Evolução — {cliente.nome}</h1>
      </header>

      <ResumoEvolucao resumo={resumo} />
    </div>
  );
}
