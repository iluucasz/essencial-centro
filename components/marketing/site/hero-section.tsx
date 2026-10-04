import Link from "next/link";
import { ArrowRight, Flower2, Leaf } from "lucide-react";
import { CLINIC, criarLinkAvaliacao } from "@/lib/marketing/clinic";
import {
  blocoFaixaPadrao,
  blocoInicioPadrao,
  type BlocoFaixa,
  type BlocoInicio,
} from "@/modules/site-publico/blocos";
import { CarrosselDestaques } from "@/modules/site-publico/components/carrossel-destaques";
import type { ConteudoPublico } from "@/modules/site-publico/validacao";

export function HeroSection({
  destaques = [],
  textos = blocoInicioPadrao,
  faixa = blocoFaixaPadrao,
  whatsapp = CLINIC.whatsapp,
}: {
  destaques?: ConteudoPublico[];
  textos?: BlocoInicio;
  faixa?: BlocoFaixa;
  /** Número do contato editável (só dígitos, com DDI). */
  whatsapp?: string;
}) {
  return (
    <section id="inicio" className="relative overflow-hidden bg-creme pt-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 size-[32rem] rounded-full bg-lilas/20 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:pt-20 lg:pb-24">
        <div>
          <span className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-roxo uppercase">
            <Flower2 className="size-5" strokeWidth={1.4} />
            {textos.selo}
          </span>
          <h1 className="mt-7 font-serif text-5xl leading-[1.08] tracking-tight text-brand sm:text-6xl lg:text-7xl">
            {textos.tituloLinha1}
            <br />
            <span className="font-normal text-roxo italic">{textos.tituloLinha2}</span>
          </h1>
          <div className="mt-7 h-px w-20 bg-dourado" />
          <p className="mt-7 max-w-md text-lg leading-relaxed text-muted">{textos.chamada}</p>
          <p className="mt-4 max-w-lg leading-relaxed text-muted">{textos.paragrafo}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={criarLinkAvaliacao(undefined, whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-brand px-6 py-3.5 text-sm font-medium text-surface transition-colors hover:bg-roxo"
            >
              {textos.botaoPrincipal}
              <ArrowRight className="size-4" />
            </a>
            <Link
              href="/#servicos"
              className="inline-flex items-center justify-center rounded-full border border-brand/25 px-6 py-3.5 text-sm font-medium text-brand transition-colors hover:bg-lilas/20"
            >
              {textos.botaoSecundario}
            </Link>
          </div>
          {textos.rodape && (
            <p className="mt-8 flex items-center gap-2 text-xs text-brand">
              <Leaf className="size-4 text-salvia" />
              {textos.rodape}
            </p>
          )}
        </div>
        <CarrosselDestaques itens={destaques} />
      </div>
      <div className="border-y border-lilas/25 bg-lilas/15 px-4 py-5 text-center text-xs font-medium tracking-[0.18em] text-roxo uppercase">
        {faixa.palavras.map((palavra, posicao) => (
          <span key={`${palavra}-${posicao}`}>
            {posicao > 0 && (
              <span aria-hidden="true" className="mx-3 text-dourado">
                ·
              </span>
            )}
            {palavra}
          </span>
        ))}
      </div>
    </section>
  );
}
