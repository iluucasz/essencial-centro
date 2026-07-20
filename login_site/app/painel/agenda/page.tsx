import { Button } from "@heroui/react"
import { Plus, Clock } from "lucide-react"
import { PageHeader, Panel } from "@/components/dashboard/ui"

const DAYS = ["Seg 14", "Ter 15", "Qua 16", "Qui 17", "Sex 18"]
const HOURS = ["09h", "10h", "11h", "14h", "15h", "16h", "17h"]

type Slot = { day: number; hour: number; span: number; client: string; service: string; tone: "green" | "clay" | "sage" }

const SLOTS: Slot[] = [
  { day: 0, hour: 0, span: 1, client: "Ana S.", service: "Corporal", tone: "green" },
  { day: 0, hour: 3, span: 1, client: "Beatriz L.", service: "Massoterapia", tone: "sage" },
  { day: 1, hour: 1, span: 1, client: "Elaine C.", service: "Limpeza", tone: "green" },
  { day: 1, hour: 5, span: 1, client: "Carla M.", service: "Avaliação", tone: "clay" },
  { day: 3, hour: 3, span: 1, client: "Ana S.", service: "Corporal", tone: "green" },
  { day: 3, hour: 6, span: 1, client: "Fernanda A.", service: "Capilar", tone: "sage" },
  { day: 4, hour: 0, span: 1, client: "Daniela R.", service: "Cílios", tone: "green" },
  { day: 4, hour: 4, span: 1, client: "Beatriz L.", service: "Massoterapia", tone: "sage" },
]

const TONE: Record<Slot["tone"], string> = {
  green: "bg-forest/12 border-forest/30 text-forest-deep",
  clay: "bg-clay/15 border-clay/40 text-clay",
  sage: "bg-sage/60 border-sage-deep/50 text-forest-deep",
}

export default function AgendaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Agenda"
        subtitle="Semana de 14 a 18 de julho."
        action={
          <Button variant="primary">
            <Plus className="h-4 w-4" />
            Novo agendamento
          </Button>
        }
      />

      <Panel className="overflow-x-auto p-0">
        <div className="min-w-[720px]">
          {/* Header row */}
          <div className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-line">
            <div className="p-3" />
            {DAYS.map((d) => (
              <div
                key={d}
                className="border-l border-line p-3 text-center text-sm font-medium text-ink"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Hour rows */}
          {HOURS.map((h, hourIdx) => (
            <div
              key={h}
              className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-line last:border-b-0"
            >
              <div className="flex items-start justify-end p-3 text-xs text-ink-soft">{h}</div>
              {DAYS.map((_, dayIdx) => {
                const slot = SLOTS.find((s) => s.day === dayIdx && s.hour === hourIdx)
                return (
                  <div key={dayIdx} className="min-h-16 border-l border-line p-1.5">
                    {slot && (
                      <div className={`h-full rounded-lg border p-2 ${TONE[slot.tone]}`}>
                        <p className="text-xs font-semibold leading-tight">{slot.client}</p>
                        <p className="flex items-center gap-1 text-[11px] leading-tight opacity-80">
                          <Clock className="h-3 w-3" />
                          {slot.service}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
