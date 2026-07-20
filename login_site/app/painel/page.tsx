import Link from "next/link"
import { Button } from "@heroui/react"
import { Plus, Clock, ArrowUpRight, ArrowRight } from "lucide-react"
import { PageHeader, Panel, StatusBadge, ProgressBar } from "@/components/dashboard/ui"
import { DASHBOARD_STATS, TODAY_APPOINTMENTS, CLIENTS } from "@/lib/data"

const APPT_STATUS: Record<string, string> = {
  Confirmado: "bg-forest/12 text-forest",
  Aguardando: "bg-clay/15 text-clay",
  Avaliação: "bg-sage-deep/50 text-ink-soft",
}

export default function PainelHome() {
  const activeClients = CLIENTS.filter((c) => c.status === "Ativa").slice(0, 4)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Bom dia, Marina"
        subtitle="Aqui está o resumo da sua clínica hoje, 17 de julho."
        action={
          <Button variant="primary">
            <Plus className="h-4 w-4" />
            Nova cliente
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DASHBOARD_STATS.map((stat) => (
          <Panel key={stat.label}>
            <p className="text-sm text-ink-soft">{stat.label}</p>
            <p className="mt-2 font-serif text-3xl font-semibold text-ink">{stat.value}</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-forest">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {stat.change}
            </p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Agenda de hoje */}
        <Panel className="p-0">
          <div className="flex items-center justify-between border-b border-line p-6">
            <h2 className="font-serif text-lg font-semibold text-ink">Agenda de hoje</h2>
            <Link
              href="/painel/agenda"
              className="flex items-center gap-1 text-sm font-medium text-forest hover:underline"
            >
              Ver agenda
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {TODAY_APPOINTMENTS.map((appt) => (
              <li key={appt.time} className="flex items-center gap-4 px-6 py-4">
                <div className="flex w-14 flex-col items-center">
                  <span className="font-serif text-lg font-semibold text-ink">{appt.time}</span>
                </div>
                <div className="h-10 w-px bg-line" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{appt.client}</p>
                  <p className="flex items-center gap-1 text-sm text-ink-soft">
                    {appt.service}
                    <span className="text-ink-soft/50">·</span>
                    <Clock className="h-3.5 w-3.5" />
                    {appt.duration}
                  </p>
                </div>
                <span
                  className={`hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline ${APPT_STATUS[appt.status]}`}
                >
                  {appt.status}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Clientes ativas */}
        <Panel className="p-0">
          <div className="flex items-center justify-between border-b border-line p-6">
            <h2 className="font-serif text-lg font-semibold text-ink">Em acompanhamento</h2>
            <Link
              href="/painel/clientes"
              className="flex items-center gap-1 text-sm font-medium text-forest hover:underline"
            >
              Todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {activeClients.map((client) => (
              <li key={client.id} className="flex items-center gap-3 px-6 py-4">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-sage/60 text-sm font-semibold text-forest">
                  {client.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{client.name}</p>
                  <p className="truncate text-xs text-ink-soft">{client.service}</p>
                </div>
                <ProgressBar done={client.sessionsDone} total={client.sessionsTotal} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
