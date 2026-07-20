"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@heroui/react"
import { Plus, Search, ChevronRight } from "lucide-react"
import { PageHeader, Panel, StatusBadge, ProgressBar } from "@/components/dashboard/ui"
import { CLIENTS } from "@/lib/data"

const FILTERS = ["Todas", "Ativa", "Avaliação", "Concluída"] as const

export default function ClientesPage() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todas")

  const filtered = CLIENTS.filter((c) => {
    const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === "Todas" || c.status === filter
    return matchesQuery && matchesFilter
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        subtitle="Gerencie prontuários, fichas e evolução de cada cliente."
        action={
          <Button variant="primary">
            <Plus className="h-4 w-4" />
            Nova cliente
          </Button>
        }
      />

      <Panel className="p-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-xl border border-line bg-cream py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-forest focus:ring-2 focus:ring-forest/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f ? "bg-forest text-cream" : "bg-sage/40 text-forest-deep hover:bg-sage"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Serviço</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Progresso</th>
                <th className="px-6 py-3 font-medium">Próxima</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((client) => (
                <tr key={client.id} className="transition-colors hover:bg-sage/20">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/60 text-xs font-semibold text-forest">
                        {client.initials}
                      </span>
                      <span className="font-medium text-ink">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-ink-soft">{client.service}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-6 py-4">
                    <ProgressBar done={client.sessionsDone} total={client.sessionsTotal} />
                  </td>
                  <td className="px-6 py-4 text-ink-soft">{client.nextVisit ?? "—"}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/painel/clientes/${client.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline"
                    >
                      Abrir
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="divide-y divide-line md:hidden">
          {filtered.map((client) => (
            <li key={client.id}>
              <Link
                href={`/painel/clientes/${client.id}`}
                className="flex items-center gap-3 px-4 py-4"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-sage/60 text-sm font-semibold text-forest">
                  {client.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-ink">{client.name}</p>
                    <StatusBadge status={client.status} />
                  </div>
                  <p className="truncate text-xs text-ink-soft">{client.service}</p>
                  <div className="mt-1.5">
                    <ProgressBar done={client.sessionsDone} total={client.sessionsTotal} />
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 flex-none text-ink-soft" />
              </Link>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-ink-soft">
            Nenhuma cliente encontrada para os filtros atuais.
          </p>
        )}
      </Panel>
    </div>
  )
}
