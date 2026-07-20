import Image from "next/image"
import { Check } from "lucide-react"

const HIGHLIGHTS = [
  "Atendimento individualizado e humanizado",
  "Protocolos baseados em avaliação criteriosa",
  "Registro fotográfico e de medidas com consentimento",
  "Ambiente acolhedor e higienizado",
]

export function AboutSection() {
  return (
    <section id="sobre" className="scroll-mt-20 bg-cream py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="relative order-2 lg:order-1">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-line shadow-xl shadow-forest/5">
            <Image
              src="/images/professional.png"
              alt="Profissional responsável pela clínica Essencial Centro"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -right-4 -top-4 hidden rounded-2xl border border-line bg-clay px-5 py-4 text-cream shadow-lg sm:block">
            <p className="font-serif text-2xl font-semibold">100%</p>
            <p className="text-xs text-cream/85">dedicação a cada cliente</p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-forest">
            Sobre a clínica
          </span>
          <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Cuidado essencial, com técnica e carinho
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-ink-soft">
            O Essencial Centro nasceu para unir estética, saúde e bem-estar em
            uma experiência organizada e transparente. Aqui, cada detalhe do seu
            tratamento é registrado com responsabilidade e respeito à sua
            privacidade.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-forest text-cream">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span className="text-ink-soft">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
