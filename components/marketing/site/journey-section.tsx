import Image from "next/image";
import { JOURNEY_STEPS, DIFFERENTIALS } from "@/lib/marketing/clinic";

export function JourneySection() {
  return (
    <section id="jornada" className="scroll-mt-20 bg-forest py-20 text-cream sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-sm font-semibold tracking-[0.16em] text-clay-soft uppercase">
              Como funciona
            </span>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Mais que uma agenda: uma jornada digital do seu tratamento
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-pretty text-cream/75">
              Do primeiro atendimento aos resultados, tudo fica registrado e organizado. Você
              acompanha de onde começou, o que foi feito e o que já conquistou.
            </p>

            <ol className="mt-10 space-y-6">
              {JOURNEY_STEPS.map((step) => (
                <li key={step.number} className="flex gap-4">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-cream/25 font-serif text-lg font-semibold text-clay-soft">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="font-serif text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-cream/70">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-cream/15">
              <Image
                src="/images/journey.png"
                alt="Acompanhamento digital do tratamento: tablet, caderno e folhas de eucalipto"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {DIFFERENTIALS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-cream/15 bg-forest-deep/40 p-4"
                >
                  <item.icon className="h-6 w-6 text-clay-soft" strokeWidth={1.75} />
                  <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-cream/65">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
