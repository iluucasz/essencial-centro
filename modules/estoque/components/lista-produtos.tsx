import Link from "next/link";
import { PackageSearch, TriangleAlert } from "lucide-react";

import { MenuAcoesProduto } from "./menu-acoes-produto";

type ProdutoResumo = {
  id: string;
  nome: string;
  unidade: string | null;
  estoqueMinimo: number | null;
  ativo: boolean;
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
          <div className="grid gap-2 rounded-lg border border-border bg-surface p-3 transition hover:bg-creme sm:grid-cols-[1fr_auto] sm:items-center">
            <Link className="min-w-0" href={`/painel/estoque/${p.id}`}>
              <span className="block truncate text-sm font-medium text-foreground">{p.nome}</span>
              <span className="mt-1 block text-sm text-muted">
                {p.disponivel} {p.unidade ?? "un."} disponíveis
                {p.ativo ? "" : " · inativo"}
              </span>
            </Link>
            <span className="flex items-center justify-between gap-2 sm:justify-end">
              {p.avisoEstoqueBaixo ? (
                <span className="flex items-center gap-1 rounded-full bg-perigo/15 px-2.5 py-1 text-xs font-medium text-perigo">
                  <TriangleAlert className="size-3" aria-hidden="true" />
                  Estoque baixo
                </span>
              ) : null}
              <MenuAcoesProduto produto={p} />
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
