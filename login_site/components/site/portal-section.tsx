import Link from "next/link"
import { buttonVariants } from "@heroui/react"
import { Stethoscope, HeartHandshake, ArrowRight } from "lucide-react"

const PANELS = [
  {
    icon: Stethoscope,
    label: "Para a profissional",
    title: "Painel de gestão",
    description:
      "Gerencie clientes, agenda, fichas de anamnese, medidas, fotografias e a evolução de cada tratamento.",
    features: ["Prontuário digital", "Agenda e sessões", "Fichas inteligentes"],
    href: "/acesso?perfil=profissional",
    cta: "Entrar como profissional",
  },
  {
    icon: HeartHandshake,
    label: "Para o cliente",
    title: "Meu tratamento",
    description:
      "Acompanhe próximas sessões, evolução de medidas, orientações e documentos autorizados, com privacidade.",
    features: ["Minha evolução", "Documentos e termos", "Próximas sessões"],
    href: "/acesso?perfil=cliente",
    cta: "Entrar como cliente",
  },
]

export function PortalSection() {
  return (
    <section className="bg-sage/40 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-forest">
            Área restrita
          </span>
          <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Um portal para cada necessidade
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-ink-soft">
            Acesso seguro e separado por perfil, com as permissões adequadas
            para cada pessoa.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {PANELS.map((panel) => (
            <div
              key={panel.title}
              className="flex flex-col rounded-3xl border border-line bg-surface p-8 shadow-sm transition-shadow hover:shadow-lg hover:shadow-forest/5"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-cream">
                <panel.icon className="h-7 w-7" strokeWidth={1.75} />
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-forest">
                {panel.label}
              </p>
              <h3 className="mt-1 font-serif text-2xl font-semibold text-ink">
                {panel.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {panel.description}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {panel.features.map((f) => (
                  <li
                    key={f}
                    className="rounded-full bg-sage/60 px-3 py-1 text-xs font-medium text-forest-deep"
                  >
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={panel.href}
                className={`${buttonVariants({ variant: "primary" })} mt-8 w-full`}
              >
                {panel.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
