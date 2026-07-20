import { PageHeader } from "@/components/dashboard/ui"
import { MeasurementChart } from "@/components/dashboard/measurement-chart"
import { MEASUREMENTS } from "@/lib/data"
import { TrendingDown } from "lucide-react"

const RESULTS = [
  { area: "Cintura", start: 84, end: 76 },
  { area: "Abdômen", start: 92, end: 83 },
  { area: "Quadril", start: 104, end: 98 },
]

export default function MinhaEvolucaoPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Minha evolução"
        subtitle="Veja em números os resultados conquistados ao longo do seu tratamento."
      />

      <div className="grid gap-5 sm:grid-cols-3">
        {RESULTS.map((r) => (
          <div key={r.area} className="rounded-3xl border border-line bg-surface p-6">
            <p className="text-sm text-ink-soft">{r.area}</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-serif text-3xl text-forest">-{r.start - r.end} cm</span>
            </div>
            <p className="mt-2 flex items-center gap-1 text-sm text-ink-soft">
              <TrendingDown className="h-4 w-4 text-forest" />
              {r.start} cm → {r.end} cm
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="mb-1 font-serif text-xl text-ink">Evolução de medidas</h2>
        <p className="mb-6 text-sm text-ink-soft">Comparativo por sessão (em centímetros).</p>
        <MeasurementChart data={MEASUREMENTS} />
      </section>

      <section className="rounded-3xl border border-forest/20 bg-sage/30 p-6 sm:p-8">
        <h2 className="font-serif text-xl text-ink">Parabéns pela dedicação</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Você já concluiu 6 das 10 sessões do seu plano, com uma redução total de 23 cm. Continue
          seguindo as orientações da sua profissional para manter a evolução até o fim do tratamento.
        </p>
      </section>
    </div>
  )
}
