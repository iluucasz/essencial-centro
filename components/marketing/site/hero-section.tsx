import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { ArrowRight, ShieldCheck, Star } from "lucide-react";

export function HeroSection() {
  return (
    <section id="inicio" className="relative overflow-hidden pt-16">
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sage/50 blur-3xl" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pt-24">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-sage/60 px-4 py-1.5 text-xs font-medium tracking-[0.16em] text-forest-deep uppercase">
            <Star className="h-3.5 w-3.5" />
            Clínica de estética e bem-estar
          </span>

          <h1 className="mt-6 font-serif text-4xl leading-[1.05] font-semibold tracking-tight text-balance text-ink sm:text-5xl lg:text-6xl">
            Sua jornada de cuidado, do início aos <span className="text-forest">resultados</span>.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-pretty text-ink-soft">
            No Essencial Centro cada tratamento é acompanhado de perto: fichas digitais, evolução de
            medidas e um portal exclusivo para você visualizar seus resultados com segurança.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="https://wa.me/5511912345678"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Agendar avaliação
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/#servicos" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Conhecer serviços
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div>
              <p className="font-serif text-2xl font-semibold text-ink">+12</p>
              <p className="text-sm text-ink-soft">anos de experiência</p>
            </div>
            <div className="hidden h-10 w-px bg-line sm:block" />
            <div>
              <p className="font-serif text-2xl font-semibold text-ink">8</p>
              <p className="text-sm text-ink-soft">áreas de tratamento</p>
            </div>
            <div className="hidden h-10 w-px bg-line sm:block" />
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <ShieldCheck className="h-5 w-5 text-forest" />
              Dados protegidos (LGPD)
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-line shadow-xl shadow-forest/5">
            <Image
              src="/images/hero-clinic.png"
              alt="Sala de atendimento da clínica Essencial Centro com luz natural e plantas"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 hidden max-w-[15rem] rounded-2xl border border-line bg-cream/95 p-4 shadow-lg backdrop-blur sm:block">
            <p className="text-sm font-semibold text-ink">Acompanhamento real</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Medidas, fotos e evolução registradas a cada sessão no seu prontuário digital.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
