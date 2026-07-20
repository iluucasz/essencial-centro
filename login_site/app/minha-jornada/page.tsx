import { PageHeader, StatCard } from "@/components/dashboard/ui"
import { CLIENT_NEXT_SESSIONS, CLIENT_GUIDANCE, SESSION_HISTORY } from "@/lib/data"
import { CalendarDays, MapPin, Clock, Check, Lightbulb } from "lucide-react"

export default function MeuTratamentoPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Olá, Ana"
        subtitle="Acompanhe aqui a sua jornada de cuidado na Essencial Centro."
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard label="Plano atual" value="Estética Corporal" change="10 sessões" />
        <StatCard label="Progresso" value="6 de 10" change="60% concluído" />
        <StatCard label="Redução total" value="-23 cm" change="em 6 sessões" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Próximas sessões */}
        <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-forest" strokeWidth={1.75} />
            <h2 className="font-serif text-xl text-ink">Próximas sessões</h2>
          </div>
          <ul className="space-y-4">
            {CLIENT_NEXT_SESSIONS.map((s, i) => (
              <li
                key={s.date}
                className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 ${
                  i === 0 ? "border-forest/30 bg-sage/30" : "border-line bg-cream-deep/50"
                }`}
              >
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-forest text-cream">
                  <span className="text-lg font-semibold leading-none">{s.date.split(" ")[0]}</span>
                  <span className="text-[10px] uppercase tracking-wide">{s.date.split(" ")[1]}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-ink">{s.service}</p>
                  <div className="mt-1 flex items-center gap-4 text-sm text-ink-soft">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {s.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {s.place}
                    </span>
                  </div>
                </div>
                {i === 0 && (
                  <span className="rounded-full bg-forest px-3 py-1 text-xs font-medium text-cream">
                    Próxima
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Orientações */}
        <section className="rounded-3xl border border-line bg-forest p-6 text-cream sm:p-8">
          <div className="mb-6 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-sage" strokeWidth={1.75} />
            <h2 className="font-serif text-xl">Orientações da sua profissional</h2>
          </div>
          <ul className="space-y-4">
            {CLIENT_GUIDANCE.map((g) => (
              <li key={g} className="flex items-start gap-3 text-sm leading-relaxed text-cream/90">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" strokeWidth={2.5} />
                {g}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Histórico */}
      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="mb-6 font-serif text-xl text-ink">Histórico de sessões</h2>
        <ol className="relative space-y-6 border-l border-line pl-6">
          {SESSION_HISTORY.map((s) => (
            <li key={s.session} className="relative">
              <span className="absolute -left-[1.9rem] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-surface bg-forest" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-ink">{s.session}</p>
                <span className="text-sm text-ink-soft">{s.date}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.note}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
