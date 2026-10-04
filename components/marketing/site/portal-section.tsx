import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { Stethoscope, HeartHandshake, ArrowRight } from "lucide-react";
import { blocoLoginPadrao, type BlocoLogin } from "@/modules/site-publico/blocos";

export function PortalSection({ conteudo = blocoLoginPadrao }: { conteudo?: BlocoLogin }) {
  const paineis = [
    { icone: Stethoscope, ...conteudo.profissional },
    { icone: HeartHandshake, ...conteudo.cliente },
  ];
  return (
    <section className="bg-sage/40 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-[0.16em] text-forest uppercase">
            {conteudo.selo}
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            {conteudo.titulo}
          </h2>
          {conteudo.texto && (
            <p className="mt-4 text-lg leading-relaxed text-pretty text-ink-soft">
              {conteudo.texto}
            </p>
          )}
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {paineis.map((painel) => (
            <div
              key={painel.selo}
              className="flex flex-col rounded-3xl border border-line bg-surface p-8 shadow-sm transition-shadow hover:shadow-lg hover:shadow-forest/5"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-cream">
                <painel.icone className="h-7 w-7" strokeWidth={1.75} />
              </span>
              <p className="mt-5 text-xs font-semibold tracking-[0.16em] text-forest uppercase">
                {painel.selo}
              </p>
              <h3 className="mt-1 font-serif text-2xl font-semibold text-ink">{painel.titulo}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{painel.descricao}</p>
              <ul className="mt-5 mb-8 flex flex-wrap gap-2">
                {painel.recursos.map((recurso) => (
                  <li
                    key={recurso}
                    className="rounded-full bg-sage/60 px-3 py-1 text-xs font-medium text-forest-deep"
                  >
                    {recurso}
                  </li>
                ))}
              </ul>
              <Link
                href="/entrar"
                className={`${buttonVariants({ variant: "primary" })} mt-auto w-full`}
              >
                {painel.botao}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
