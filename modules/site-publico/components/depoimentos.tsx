"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { blocoDepoimentosPadrao, type BlocoCabecalho } from "../blocos";
import type { ConteudoPublico } from "../validacao";
import { PlayerSite } from "./player-site";

/** Arco de estrelas: as do centro são maiores, como um selo. */
const TAMANHOS_ESTRELA = ["size-5", "size-6", "size-8", "size-6", "size-5"];

function EstrelasArco({ nota }: { nota: number }) {
  return (
    <div
      role="img"
      aria-label={`Avaliação: ${nota} de 5 estrelas`}
      className="flex h-8 items-center justify-center gap-1.5"
    >
      {TAMANHOS_ESTRELA.map((tamanho, indice) => (
        <Star
          key={indice}
          aria-hidden="true"
          strokeWidth={1.5}
          strokeLinejoin="round"
          className={`${tamanho} ${indice < nota ? "fill-dourado text-dourado" : "fill-dourado/15 text-dourado/30"}`}
        />
      ))}
    </div>
  );
}

function Autor({ item, clara = false }: { item: ConteudoPublico; clara?: boolean }) {
  return (
    <figcaption className="flex flex-wrap items-center justify-center gap-x-2 text-sm">
      <span className={`font-semibold ${clara ? "text-white" : "text-foreground"}`}>
        {item.titulo}
      </span>
      {item.subtitulo && (
        <>
          <span
            aria-hidden="true"
            className={`size-1 rounded-full ${clara ? "bg-white/60" : "bg-muted/60"}`}
          />
          <span className={clara ? "text-white/80" : "text-muted"}>{item.subtitulo}</span>
        </>
      )}
    </figcaption>
  );
}

function CartaoVideo({ item }: { item: ConteudoPublico }) {
  return (
    <div className="relative mx-auto aspect-9/16 w-68 overflow-hidden rounded-[1.75rem] bg-foreground shadow-xl shadow-brand/15 sm:w-74">
      <PlayerSite
        midia={item.midia}
        ajustes={item}
        rotulo={`Depoimento em vídeo de ${item.titulo}`}
        capa={
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-foreground/80 via-foreground/40 to-transparent mask-[linear-gradient(to_top,black_55%,transparent)] backdrop-blur-xl"
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5">
              <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                Depoimento em vídeo
              </span>
              <div className="grid gap-3 text-center">
                <Autor item={item} clara />
                {item.texto && (
                  <blockquote className="line-clamp-4 font-serif text-base leading-relaxed text-white italic">
                    “{item.texto}”
                  </blockquote>
                )}
              </div>
            </div>
          </>
        }
      />
    </div>
  );
}

function CartaoTexto({ item }: { item: ConteudoPublico }) {
  return (
    <div className="relative mx-auto flex aspect-9/16 w-68 flex-col justify-between overflow-hidden rounded-[1.75rem] border border-lilas/30 bg-surface p-7 shadow-xl shadow-brand/10 sm:w-74">
      <span aria-hidden="true" className="font-serif text-7xl leading-none text-lilas">
        “
      </span>
      <blockquote className="line-clamp-10 font-serif text-lg leading-relaxed whitespace-pre-line text-brand italic">
        “{item.texto}”
      </blockquote>
      <div className="border-t border-lilas/25 pt-5">
        <Autor item={item} />
      </div>
    </div>
  );
}

function Depoimento({ item }: { item: ConteudoPublico }) {
  return (
    <figure className="flex flex-col items-center gap-6 text-center">
      {item.nota ? <EstrelasArco nota={item.nota} /> : <span className="h-8" />}
      {item.midia && item.tipoMidia === "video" ? (
        <CartaoVideo item={item} />
      ) : (
        <CartaoTexto item={item} />
      )}
    </figure>
  );
}

const botaoNavegacao =
  "flex size-12 items-center justify-center rounded-full border border-brand/25 text-brand transition hover:bg-brand hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo";

/** 1 card no celular, 2 no tablet, 3 no desktop — o 2º e o 3º só aparecem a partir do breakpoint. */
const VISIBILIDADE_POSICAO = ["flex", "hidden md:flex", "hidden lg:flex"];

export function SecaoDepoimentos({
  itens,
  cabecalho = blocoDepoimentosPadrao,
}: {
  itens: ConteudoPublico[];
  cabecalho?: BlocoCabecalho;
}) {
  const [indice, setIndice] = useState(0);
  const toque = useRef<{ x: number; y: number } | null>(null);
  const reduzirMovimento = useReducedMotion();
  const total = itens.length;
  if (!total) return null;
  const inicio = indice % total;
  const visiveis = Array.from({ length: Math.min(3, total) }, (_, posicao) => ({
    posicao,
    numero: (inicio + posicao) % total,
  }));
  // Navegação some no breakpoint em que todos os depoimentos já cabem na tela.
  const ocultarNavegacao =
    total <= 1 ? "hidden" : total === 2 ? "md:hidden" : total === 3 ? "lg:hidden" : "";

  function irPara(posicao: number) {
    setIndice((posicao + total) % total);
  }

  return (
    <section
      id="depoimentos"
      className="relative scroll-mt-20 overflow-hidden bg-linear-to-b from-lilas/10 to-creme py-20 sm:py-28"
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="flex items-center justify-center gap-3 text-xs font-semibold tracking-[0.22em] text-roxo uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-dourado" />
            {cabecalho.selo}
            <span aria-hidden="true" className="h-px w-8 bg-dourado" />
          </span>
          <h2 className="mt-4 font-serif text-4xl text-brand sm:text-5xl">{cabecalho.titulo}</h2>
          {cabecalho.texto && <p className="mt-4 leading-relaxed text-muted">{cabecalho.texto}</p>}
        </div>

        <div
          role="region"
          aria-roledescription="carrossel"
          aria-label="Depoimentos dos clientes"
          className="relative mt-14"
          onKeyDown={(evento) => {
            if ((evento.target as HTMLElement).tagName === "VIDEO") return;
            if (evento.key === "ArrowLeft" || evento.key === "ArrowRight") {
              evento.preventDefault();
              irPara(inicio + (evento.key === "ArrowRight" ? 1 : -1));
            }
          }}
          onTouchStart={(evento) => {
            const alvo = evento.target as HTMLElement;
            toque.current =
              evento.touches.length === 1 && alvo.tagName !== "VIDEO"
                ? { x: evento.touches[0].clientX, y: evento.touches[0].clientY }
                : null;
          }}
          onTouchEnd={(evento) => {
            const origem = toque.current;
            toque.current = null;
            if (!origem || total < 2) return;
            const dx = evento.changedTouches[0].clientX - origem.x;
            const dy = evento.changedTouches[0].clientY - origem.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy))
              irPara(inicio + (dx < 0 ? 1 : -1));
          }}
        >
          <div className="flex items-start justify-center gap-6">
            {visiveis.map(({ posicao, numero }) => (
              <motion.div
                key={itens[numero].id}
                role="group"
                aria-roledescription="slide"
                aria-label={`Depoimento ${numero + 1} de ${total}`}
                initial={reduzirMovimento ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`${VISIBILIDADE_POSICAO[posicao]} min-w-0 justify-center`}
              >
                <Depoimento item={itens[numero]} />
              </motion.div>
            ))}
          </div>

          <div className={`mt-12 flex items-center justify-center gap-5 ${ocultarNavegacao}`}>
            <button
              type="button"
              aria-label="Depoimento anterior"
              onClick={() => irPara(inicio - 1)}
              className={botaoNavegacao}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2">
              {itens.map((item, posicao) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Ver depoimento ${posicao + 1}`}
                  aria-current={posicao === inicio ? "true" : undefined}
                  onClick={() => irPara(posicao)}
                  className="flex h-6 items-center focus-visible:outline-2 focus-visible:outline-roxo"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${posicao === inicio ? "w-6 bg-brand" : "w-1.5 bg-brand/25 hover:bg-brand/50"}`}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Próximo depoimento"
              onClick={() => irPara(inicio + 1)}
              className={botaoNavegacao}
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
