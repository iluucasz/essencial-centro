import type { ReactNode } from "react";
import Link from "next/link";
import { Eye, Search, SlidersHorizontal, UserRound } from "lucide-react";

import type { FiltroCliente } from "@/modules/clientes/filtro";

type ClienteResumo = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  dataNascimento: Date;
  objetivoTratamento: string | null;
  criadoEm: Date;
};

const opcoesFiltro: Array<{ valor: FiltroCliente; rotulo: string }> = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "com-contato", rotulo: "Com contato" },
  { valor: "sem-contato", rotulo: "Sem contato" },
  { valor: "com-objetivo", rotulo: "Com objetivo" },
  { valor: "sem-objetivo", rotulo: "Sem objetivo" },
];

const formatadorData = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export function ListaClientes({
  clientes,
  busca,
  filtro,
  total,
  acao,
}: {
  clientes: ClienteResumo[];
  busca?: string;
  filtro: FiltroCliente;
  total: number;
  acao: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Clientes cadastrados</h2>
          <p className="mt-1 text-sm text-muted">
            {clientes.length} de {total} {total === 1 ? "registro" : "registros"}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
          <form
            className="flex w-full flex-wrap items-center gap-2 lg:w-auto"
            action="/painel/clientes"
          >
            <label className="sr-only" htmlFor="busca">
              Buscar cliente
            </label>
            <div className="relative min-w-56 flex-1 lg:w-80 lg:flex-none">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                className="h-10 w-full rounded-lg border border-border bg-surface pr-3 pl-9 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
                defaultValue={busca}
                id="busca"
                name="busca"
                placeholder="Buscar cliente"
              />
            </div>

            <label className="sr-only" htmlFor="filtro">
              Filtrar clientes
            </label>
            <select
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
              defaultValue={filtro}
              id="filtro"
              name="filtro"
            >
              {opcoesFiltro.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </select>

            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              type="submit"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filtrar
            </button>
          </form>

          {acao}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-border text-xs font-medium text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Contato</th>
              <th className="px-4 py-3 font-medium">Objetivo</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
              <th className="w-28 px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clientes.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={5}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id} className="transition hover:bg-creme">
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-lilas/35 text-roxo">
                        <UserRound className="size-4" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block font-medium text-foreground">{cliente.nome}</span>
                        <span className="mt-0.5 block text-xs text-muted">
                          Nasc. {formatadorData.format(cliente.dataNascimento)}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle text-muted">
                    {[cliente.email, cliente.telefone].filter(Boolean).join(" · ") ||
                      "Sem contato cadastrado"}
                  </td>
                  <td className="max-w-xs px-4 py-4 align-middle text-muted">
                    <span className="line-clamp-2">
                      {cliente.objetivoTratamento ?? "Sem objetivo registrado"}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle text-muted">
                    {formatadorData.format(cliente.criadoEm)}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <Link
                      className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition hover:bg-creme hover:text-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                      href={`/painel/clientes/${cliente.id}`}
                      title="Abrir cadastro"
                    >
                      <Eye className="size-4" aria-hidden="true" />
                      <span className="sr-only">Abrir cadastro de {cliente.nome}</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
