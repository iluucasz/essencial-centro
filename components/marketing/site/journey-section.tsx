import Image from "next/image";
import { blocoJornadaPadrao, type BlocoJornada } from "@/modules/site-publico/blocos";
import { iconesCatalogo } from "@/modules/site-publico/icones";

export function JourneySection({ conteudo = blocoJornadaPadrao }: { conteudo?: BlocoJornada }) {
  return (
    <section id="jornada" className="scroll-mt-20 bg-forest py-20 text-cream sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-sm font-semibold tracking-[0.16em] text-clay-soft uppercase">
              {conteudo.selo}
            </span>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {conteudo.titulo}
            </h2>
            {conteudo.texto && (
              <p className="mt-4 text-lg leading-relaxed text-pretty text-cream/75">
                {conteudo.texto}
              </p>
            )}

            <ol className="mt-10 space-y-6">
              {conteudo.passos.map((passo, posicao) => (
                <li key={`${passo.titulo}-${posicao}`} className="flex gap-4">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-cream/25 font-serif text-lg font-semibold text-clay-soft">
                    {String(posicao + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-serif text-lg font-semibold">{passo.titulo}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-cream/70">{passo.descricao}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-cream/15">
              <Image
                src={conteudo.imagem}
                alt={conteudo.descricaoImagem}
                fill
                unoptimized={conteudo.imagem.startsWith("https:")}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top"
              />
            </div>

            {conteudo.diferenciais.length > 0 && (
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {conteudo.diferenciais.map((item, posicao) => {
                  const Icone = iconesCatalogo[item.icone].icone;
                  return (
                    <div
                      key={`${item.titulo}-${posicao}`}
                      className="rounded-2xl border border-cream/15 bg-forest-deep/40 p-4"
                    >
                      <Icone className="h-6 w-6 text-clay-soft" strokeWidth={1.75} />
                      <h3 className="mt-3 text-sm font-semibold">{item.titulo}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-cream/65">{item.descricao}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
