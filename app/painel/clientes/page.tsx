import { Search, UsersRound } from "lucide-react";

import { FormularioCliente } from "@/modules/clientes/components/formulario-cliente";
import { ListaClientes } from "@/modules/clientes/components/lista-clientes";
import { listarClientes } from "@/modules/clientes/queries";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const { busca } = await searchParams;
  const clientes = await listarClientes(busca);

  return (
    <main className="min-h-screen bg-creme px-6 py-8">
      <div className="mx-auto grid max-w-6xl gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-muted">
              <UsersRound className="size-4" aria-hidden="true" />
              Área profissional
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-brand">Clientes</h1>
            <p className="mt-2 max-w-2xl text-sm text-foreground">
              Cadastro reutilizável para agenda, fichas, sessões e evolução clínica.
            </p>
          </div>

          <form className="flex w-full max-w-sm gap-2" action="/painel/clientes">
            <label className="sr-only" htmlFor="busca">
              Buscar cliente
            </label>
            <input
              className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
              defaultValue={busca}
              id="busca"
              name="busca"
              placeholder="Buscar por nome ou e-mail"
            />
            <button
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-surface px-3 text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              type="submit"
            >
              <Search className="size-4" aria-hidden="true" />
              <span className="sr-only">Buscar</span>
            </button>
          </form>
        </header>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_440px]">
          <section className="grid gap-4">
            <h2 className="text-lg font-semibold text-foreground">Cadastrados</h2>
            <ListaClientes clientes={clientes} />
          </section>

          <aside>
            <FormularioCliente />
          </aside>
        </div>
      </div>
    </main>
  );
}
