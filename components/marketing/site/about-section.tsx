import Image from "next/image";
import { Check } from "lucide-react";

import { RESPONSAVEL } from "@/lib/marketing/clinic";

const HIGHLIGHTS = [
  "Atendimento individualizado e humanizado",
  "Protocolos baseados em avaliação criteriosa",
  "Registro fotográfico e de medidas com consentimento",
  "Ambiente acolhedor e higienizado",
];

export function AboutSection() {
  return (
    <section id="sobre" className="scroll-mt-20 bg-cream py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="relative order-2 lg:order-1">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-line shadow-xl shadow-forest/5">
            <Image
              src="/profissionais_modelos/prof_3.png"
              alt={`${RESPONSAVEL.nome}, ${RESPONSAVEL.titulo} responsável pelo Essencial Centro`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-top"
            />
          </div>
          {/* Assina a foto: numa clínica, saber quem atende importa mais que um selo genérico. */}
          <div className="absolute -top-4 -right-4 hidden max-w-56 rounded-2xl border border-line bg-clay px-5 py-4 text-cream shadow-lg sm:block">
            <p className="font-serif text-xl font-semibold">{RESPONSAVEL.nome}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-cream/85">{RESPONSAVEL.titulo}</p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <span className="text-sm font-semibold tracking-[0.16em] text-forest uppercase">
            Sobre a clínica
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            Cuidado essencial, com técnica e carinho
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-pretty text-ink-soft">
            O Essencial Centro nasceu para unir estética, saúde e bem-estar em uma experiência
            organizada e transparente. Aqui, cada detalhe do seu tratamento é registrado com
            responsabilidade e respeito à sua privacidade.
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
  );
}
