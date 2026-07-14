import Link from "next/link";
import { UserRound } from "lucide-react";

type ClienteResumo = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  objetivoTratamento: string | null;
};

export function ListaClientes({ clientes }: { clientes: ClienteResumo[] }) {
  if (clientes.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
        Nenhum cliente cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <ul className="divide-y divide-border">
        {clientes.map((cliente) => (
          <li key={cliente.id}>
            <Link
              className="grid gap-2 p-4 transition hover:bg-creme md:grid-cols-[1fr_auto]"
              href={`/painel/clientes/${cliente.id}`}
            >
              <span className="flex items-start gap-3">
                <span className="mt-0.5 rounded-lg bg-lilas/35 p-2 text-roxo">
                  <UserRound className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium text-foreground">{cliente.nome}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {[cliente.email, cliente.telefone].filter(Boolean).join(" · ") ||
                      "Sem contato cadastrado"}
                  </span>
                </span>
              </span>
              <span className="text-sm text-muted">
                {cliente.objetivoTratamento ?? "Sem objetivo registrado"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
