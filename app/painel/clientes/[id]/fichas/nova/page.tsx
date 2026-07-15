import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { getCliente } from "@/modules/clientes/queries";
import { FormularioFichaEsteticaCorporal } from "@/modules/fichas/components/formulario-ficha-estetica-corporal";
import { listarServicos } from "@/modules/servicos/queries";

export default async function NovaFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await exigirUsuarioAtual(["profissional", "recepcao"]);
  const [cliente, servicos] = await Promise.all([getCliente(id), listarServicos()]);

  if (!cliente) {
    notFound();
  }

  if (usuario.role !== "profissional") {
    return (
      <div className="mx-auto grid max-w-3xl gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
          href={`/painel/clientes/${id}`}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para o cliente
        </Link>
        <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          Somente a profissional pode preencher fichas de avaliação.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Link
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
        href={`/painel/clientes/${id}`}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para o cliente
      </Link>

      <FormularioFichaEsteticaCorporal
        clienteId={id}
        clienteNome={cliente.nome}
        servicos={servicos.map((s) => ({ id: s.id, nome: s.nome }))}
      />
    </div>
  );
}
