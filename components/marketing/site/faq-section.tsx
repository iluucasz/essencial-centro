"use client";

import { Accordion } from "@heroui/react";
import { blocoDuvidasPadrao, type BlocoDuvidas } from "@/modules/site-publico/blocos";

export function FaqSection({ conteudo = blocoDuvidasPadrao }: { conteudo?: BlocoDuvidas }) {
  return (
    <section className="bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold tracking-[0.16em] text-forest uppercase">
            {conteudo.selo}
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            {conteudo.titulo}
          </h2>
        </div>

        <Accordion className="mt-10">
          {conteudo.perguntas.map((item, i) => (
            <Accordion.Item key={i} id={`faq-${i}`}>
              <Accordion.Heading>
                <Accordion.Trigger className="text-left font-serif text-lg text-ink">
                  {item.pergunta}
                  <Accordion.Indicator />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel className="whitespace-pre-line text-ink-soft">
                {item.resposta}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
