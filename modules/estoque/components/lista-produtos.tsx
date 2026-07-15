import Link from "next/link";
import { PackageSearch, TriangleAlert } from "lucide-react";

type ProdutoResumo = {
  id: string;
  nome: string;
  unidade: string | null;
  disponivel: number;
  avisoEstoqueBaixo: boolean;
};

export function ListaProdutos({ produtos }: { produtos: ProdutoResumo[] }) {
  if (produtos.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <PackageSearch className="size-4" aria-hidden="true" />
        Nenhum produto cadastrado ainda.
      </div>
    );
  }

  return (
    <ul className="grid gap-2">
      {produtos.map((p) => (
        <li key={p.id}>
          <Link
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3 transition hover:bg-creme"
            href={`/painel/estoque/${p.id}`}
          >
            <span className="text-sm font-medium text-foreground">{p.nome}</span>
            <span className="flex items-center gap-2">
              <span className="text-sm text-muted">
                {p.disponivel} {p.unidade ?? "un."} disponíveis
              </span>
              {p.avisoEstoqueBaixo ? (
                <span className="flex items-center gap-1 rounded-full bg-perigo/15 px-2.5 py-1 text-xs font-medium text-perigo">
                  <TriangleAlert className="size-3" aria-hidden="true" />
                  Estoque baixo
                </span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
