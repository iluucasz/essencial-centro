import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flower2, Leaf } from "lucide-react";
import { criarLinkAvaliacao } from "@/lib/marketing/clinic";

export function HeroSection() {
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
            Saúde · Beleza · Bem-estar
          </span>
          <h1 className="mt-7 font-serif text-5xl leading-[1.08] tracking-tight text-brand sm:text-6xl lg:text-7xl">
            Sua beleza,
            <br />
            <span className="font-normal text-roxo italic">nosso cuidado.</span>
          </h1>
          <div className="mt-7 h-px w-20 bg-dourado" />
          <p className="mt-7 max-w-md text-lg leading-relaxed text-muted">
            Um tempo para você. Um cuidado com a sua essência.
          </p>
          <p className="mt-4 max-w-lg leading-relaxed text-muted">
            Na Essencial Centro, em Mesquita, estética, massoterapia e bem-estar se encontram em um
            atendimento feito para acolher sua história e valorizar quem você é.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={criarLinkAvaliacao()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-brand px-6 py-3.5 text-sm font-medium text-surface transition-colors hover:bg-roxo"
            >
              Agendar minha avaliação
              <ArrowRight className="size-4" />
            </a>
            <Link
              href="/#servicos"
              className="inline-flex items-center justify-center rounded-full border border-brand/25 px-6 py-3.5 text-sm font-medium text-brand transition-colors hover:bg-lilas/20"
            >
              Conhecer os cuidados
            </Link>
          </div>
          <p className="mt-8 flex items-center gap-2 text-xs text-brand">
            <Leaf className="size-4 text-salvia" />
            Atendimento individualizado, com técnica e carinho.
          </p>
        </div>
        <div className="relative mx-auto w-full max-w-md pb-6 lg:mx-0">
          <div
            aria-hidden="true"
            className="absolute -right-3 bottom-2 h-4/5 w-full rounded-t-full rounded-b-[2rem] border border-dourado/50 sm:-right-5"
          />
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-[2rem] bg-lilas/20">
            <Image
              src="/profissionais_modelos/prof_1.png"
              alt="Atendimento da Essencial Centro em ambiente de cuidados estéticos"
              fill
              preload
              sizes="(max-width: 640px) 90vw, 450px"
              className="object-cover object-top"
            />
          </div>
          <div className="relative mx-5 -mt-10 flex items-center gap-4 rounded-2xl border border-lilas/30 bg-surface px-5 py-5 shadow-lg shadow-brand/5">
            <Flower2 className="size-9 shrink-0 text-roxo" strokeWidth={1.2} />
            <div>
              <p className="font-serif text-lg text-brand">Cuidar de você é a nossa missão.</p>
              <p className="mt-1 text-xs text-muted">Essencial Centro de Massoterapia e Estética</p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-y border-lilas/25 bg-lilas/15 px-4 py-5 text-center text-xs font-medium tracking-[0.18em] text-roxo uppercase">
        Autoestima <span className="mx-3 text-dourado">·</span> Bem-estar{" "}
        <span className="mx-3 text-dourado">·</span> Qualidade de vida
      </div>
    </section>
  );
}
