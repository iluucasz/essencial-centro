import { TrendingDown, Users, Star } from "lucide-react"
import { PageHeader, Panel } from "@/components/dashboard/ui"
import { MeasurementChart } from "@/components/dashboard/measurement-chart"
import { CLIENTS } from "@/lib/data"

const HIGHLIGHTS = [
  { icon: TrendingDown, label: "Redução média por cliente", value: "8,3 cm", sub: "em protocolos corporais" },
  { icon: Users, label: "Clientes com evolução registrada", value: "42", sub: "de 48 ativas" },
  { icon: Star, label: "Satisfação média", value: "4,9", sub: "de 5 estrelas" },
]

export default function EvolucaoPage() {
  const topClients = CLIENTS.filter((c) => c.sessionsDone > 0)
    .sort((a, b) => b.sessionsDone - a.sessionsDone)
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Evolução"
        subtitle="Panorama dos resultados registrados na clínica."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map((h) => (
          <Panel key={h.label}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage/60 text-forest">
              <h.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-serif text-3xl font-semibold text-ink">{h.value}</p>
            <p className="text-sm font-medium text-ink">{h.label}</p>
            <p className="text-xs text-ink-soft">{h.sub}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel>
          <h2 className="font-serif text-lg font-semibold text-ink">Média de medidas por sessão</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Evolução consolidada das clientes em protocolo corporal (cm).
          </p>
          <div className="mt-6">
            <MeasurementChart />
          </div>
        </Panel>

        <Panel className="p-0">
          <h2 className="border-b border-line p-6 font-serif text-lg font-semibold text-ink">
            Mais sessões realizadas
          </h2>
          <ul className="divide-y divide-line">
            {topClients.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-6 py-4">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-sage/60 text-xs font-semibold text-forest">
                  {c.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{c.name}</p>
                  <p className="truncate text-xs text-ink-soft">{c.service}</p>
                </div>
                <span className="font-serif text-lg font-semibold text-forest">
                  {c.sessionsDone}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
