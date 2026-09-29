"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Check, Flower2 } from "lucide-react";
import { SERVICES, criarLinkAvaliacao } from "@/lib/marketing/clinic";

export function ServicesSection() {
  const [active, setActive] = useState(SERVICES[0].slug);
  const service = SERVICES.find((item) => item.slug === active)!;

  return (
    <section id="servicos" className="scroll-mt-20 bg-creme py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Flower2 className="mx-auto mb-4 size-7 text-roxo" strokeWidth={1.25} />
          <span className="text-xs font-semibold tracking-[0.22em] text-roxo uppercase">
            Nosso catálogo
          </span>
          <h2 className="mt-3 font-serif text-3xl text-brand sm:text-4xl">
            Muitas formas de cuidar.
            <br />
            Uma só essência: você.
          </h2>
          <p className="mt-5 leading-relaxed text-muted">
            Da estética ao bem-estar, encontre um cuidado para o seu momento.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-[250px_1fr] lg:gap-10">
          <div
            className="flex flex-wrap content-start gap-2 lg:flex-col"
            role="group"
            aria-label="Categorias de atendimento"
          >
            {SERVICES.map((item) => (
              <button
                key={item.slug}
                type="button"
                aria-pressed={active === item.slug}
                aria-controls="detalhes-servico"
                onClick={() => setActive(item.slug)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo ${active === item.slug ? "bg-brand text-surface" : "bg-surface/60 text-brand hover:bg-lilas/20"}`}
              >
                <item.icon className="size-4 shrink-0" strokeWidth={1.5} />
                {item.name}
              </button>
            ))}
          </div>
          <div
            id="detalhes-servico"
            className="min-w-0 rounded-3xl border border-lilas/30 bg-surface p-6 sm:p-9"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-xs font-semibold tracking-widest text-roxo uppercase">
              {service.short}
            </span>
            <h3 className="mt-3 font-serif text-3xl text-brand">{service.name}</h3>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
              {service.description}
            </p>
            <ul className="mt-7 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {service.treatments.map((treatment) => (
                <li key={treatment} className="flex items-start gap-2.5 text-sm leading-relaxed">
                  <Check className="mt-1 size-4 shrink-0 text-salvia" />
                  {treatment}
                </li>
              ))}
            </ul>
            <a
              href={criarLinkAvaliacao(service.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-brand px-6 py-3 text-sm font-medium text-surface transition-colors hover:bg-roxo"
            >
              Conversar sobre {service.name.toLocaleLowerCase("pt-BR")}
              <ArrowUpRight className="size-4 shrink-0" />
            </a>
            {service.catalogs && (
              <details key={service.slug} className="mt-8 border-t border-border pt-5">
                <summary className="cursor-pointer text-sm font-medium text-roxo">
                  Ver páginas do catálogo e valores
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Material fornecido pela Essencial. Confirme valores, disponibilidade e o protocolo
                  indicado para você com a equipe.
                </p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {service.catalogs.map((catalog) => (
                    <a
                      key={catalog.image}
                      href={catalog.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="overflow-hidden rounded-xl border border-border bg-creme"
                    >
                      <Image
                        src={catalog.image}
                        alt={`Catálogo Essencial: ${catalog.title}. Abra para ampliar.`}
                        width={853}
                        height={1280}
                        sizes="(max-width: 640px) 90vw, 350px"
                        className="h-auto w-full"
                      />
                      <span className="flex items-center justify-between gap-2 p-3 text-xs font-medium text-roxo">
                        {catalog.title}
                        <ArrowUpRight className="size-4" />
                      </span>
                    </a>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
        <p className="mt-7 text-center text-xs leading-relaxed text-muted">
          Cada pessoa tem uma história. A indicação dos procedimentos depende de avaliação
          individual.
        </p>
      </div>
    </section>
  );
}
