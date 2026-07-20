"use client"

import { useState } from "react"
import { Card, Chip } from "@heroui/react"
import { Clock } from "lucide-react"
import { SERVICES } from "@/lib/clinic"

const CATEGORIES = ["Todos", "Corporal", "Facial", "Terapias", "Beleza"] as const

export function ServicesSection() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("Todos")

  const filtered =
    active === "Todos"
      ? SERVICES
      : SERVICES.filter((s) => s.category === active)

  return (
    <section id="servicos" className="scroll-mt-20 bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-forest">
            Nossos serviços
          </span>
          <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Cuidado completo, do corpo à autoestima
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-ink-soft">
            Cada área de atendimento tem sua própria ficha de avaliação e um
            plano de tratamento personalizado.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active === cat
                  ? "bg-forest text-cream"
                  : "bg-sage/50 text-forest-deep hover:bg-sage"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => (
            <Card
              key={service.slug}
              variant="default"
              className="group border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-forest/30 hover:shadow-lg hover:shadow-forest/5"
            >
              <Card.Content className="p-6">
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage/60 text-forest transition-colors group-hover:bg-forest group-hover:text-cream">
                    <service.icon className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <Chip color="default" size="sm">
                    {service.category}
                  </Chip>
                </div>
                <h3 className="mt-5 font-serif text-xl font-semibold text-ink">
                  {service.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-forest">
                  {service.short}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {service.description}
                </p>
                <div className="mt-5 flex items-center gap-1.5 border-t border-line pt-4 text-xs font-medium text-ink-soft">
                  <Clock className="h-3.5 w-3.5" />
                  Duração aproximada: {service.duration}
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
