import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, LayoutTemplate } from "lucide-react";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { ListaModelos, type ModeloAdmin } from "@/modules/fichas/components/lista-modelos";
import { listarModelosFicha } from "@/modules/fichas/modelos-queries";

export default async function ModelosFichaPage() {
  try {
    await exigirUsuarioAtual(["profissional"]);
  } catch (error) {
    if (error instanceof ErroAutorizacao) redirect("/painel");
    throw error;
  }

  const modelos = await listarModelosFicha();
  const modelosAdmin: ModeloAdmin[] = modelos.map((modelo) => ({
    id: modelo.id,
    nome: modelo.nome,
    descricao: modelo.descricao,
    ativo: modelo.ativo,
    campos: modelo.campos,
  }));

  return (
    <div className="grid min-w-0 gap-6">
      <nav aria-label="Caminho da página" className="flex flex-wrap items-center gap-2 text-sm">
        <Link className="font-medium text-muted transition hover:text-brand" href="/painel">
          Painel
        </Link>
        <ChevronRight className="size-4 text-muted" aria-hidden="true" />
        <span className="font-semibold text-brand" aria-current="page">
          Modelos de ficha
        </span>
      </nav>

      <header className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lilas/25 text-roxo">
          <LayoutTemplate className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Modelos de ficha</h1>
          <p className="mt-1 text-sm text-muted">
            Crie e edite os formulários de anamnese usados no atendimento.
          </p>
        </div>
      </header>

      <ListaModelos modelos={modelosAdmin} />
    </div>
  );
}
