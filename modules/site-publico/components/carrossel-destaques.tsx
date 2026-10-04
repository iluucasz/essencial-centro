"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Flower2, Pause, Play } from "lucide-react";
import { destaquePadrao, filtrosMidia, type ConteudoPublico } from "../validacao";
import { PlayerSite } from "./player-site";

export function CarrosselDestaques({ itens }: { itens: ConteudoPublico[] }) {
  const slides = itens.length ? itens : [destaquePadrao];
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [interagindo, setInteragindo] = useState(false);
  const [focado, setFocado] = useState(false);
  const [videoAtivo, setVideoAtivo] = useState(false);
  const toque = useRef<{ x: number; y: number } | null>(null);
  const atual = indice % slides.length;
  const item = slides[atual];
  const automatico = slides.length > 1 && !pausado && !interagindo && !focado && !videoAtivo;

  function irPara(posicao: number) {
    setVideoAtivo(false);
    setIndice((posicao + slides.length) % slides.length);
  }

  useEffect(() => {
    if (!automatico) return;
    const timer = window.setTimeout(() => setIndice((valor) => (valor + 1) % slides.length), 5000);
    return () => window.clearTimeout(timer);
  }, [automatico, indice, slides.length]);

  return (
    <div
      className="relative mx-auto w-full max-w-md pb-6 lg:mx-0"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Conheça a Essencial"
      tabIndex={0}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setInteragindo(true);
      }}
      onPointerLeave={() => setInteragindo(false)}
      onFocusCapture={() => setFocado(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocado(false);
      }}
      onKeyDown={(event) => {
        if (
          (event.target as HTMLElement).tagName === "VIDEO" ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey
        )
          return;
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          irPara(atual + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}
    >
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 -bottom-4 h-4/5 w-full rounded-t-full rounded-b-[2rem] border border-dourado/50 sm:-right-5"
        />
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-[2rem] bg-lilas/20"
          onTouchStart={(event) => {
            if ((event.target as HTMLElement).tagName === "VIDEO" || event.touches.length !== 1) {
              toque.current = null;
              return;
            }
            toque.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
          }}
          onTouchCancel={() => {
            toque.current = null;
          }}
          onTouchEnd={(event) => {
            const inicio = toque.current;
            toque.current = null;
            if (!inicio) return;
            const dx = event.changedTouches[0].clientX - inicio.x;
            const dy = event.changedTouches[0].clientY - inicio.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) irPara(atual + (dx < 0 ? 1 : -1));
          }}
        >
          {item.tipoMidia === "video" ? (
            <PlayerSite
              key={item.id}
              midia={item.midia}
              ajustes={item}
              rotulo={item.titulo}
              aoMudarReproducao={setVideoAtivo}
              aoTerminar={() => {
                if (slides.length > 1) irPara(atual + 1);
              }}
            />
          ) : (
            <Image
              key={item.id}
              src={item.midia}
              alt={item.titulo}
              fill
              preload={atual === 0}
              unoptimized={item.midia.startsWith("https:")}
              sizes="(max-width: 640px) 90vw, 450px"
              style={{ filter: filtrosMidia[item.filtro].css }}
              className="object-cover object-top"
            />
          )}
        </div>
        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Mídia anterior"
              onClick={() => irPara(atual - 1)}
              className="absolute top-1/2 left-0 flex size-11 -translate-x-1/4 -translate-y-1/2 items-center justify-center rounded-full border border-brand/20 bg-surface text-brand shadow-sm hover:bg-creme focus-visible:outline-2 focus-visible:outline-roxo"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Próxima mídia"
              onClick={() => irPara(atual + 1)}
              className="absolute top-1/2 right-0 flex size-11 translate-x-1/4 -translate-y-1/2 items-center justify-center rounded-full border border-brand/20 bg-surface text-brand shadow-sm hover:bg-creme focus-visible:outline-2 focus-visible:outline-roxo"
            >
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      <div
        className={`relative mx-5 flex items-center gap-4 rounded-2xl border border-lilas/30 bg-surface px-5 py-5 shadow-lg shadow-brand/5 ${item.tipoMidia === "video" ? "mt-4" : "-mt-10"}`}
      >
        <Flower2 className="size-9 shrink-0 text-roxo" strokeWidth={1.2} />
        <div aria-live={automatico ? "off" : "polite"}>
          <p className="font-serif text-lg text-brand">{item.titulo}</p>
          {item.subtitulo && <p className="mt-1 text-xs text-muted">{item.subtitulo}</p>}
        </div>
      </div>
      {slides.length > 1 && (
        <div
          className="mt-6 flex flex-wrap items-center justify-center gap-1"
          role="group"
          aria-label="Mídias da Essencial"
        >
          {slides.map((slide, posicao) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => irPara(posicao)}
              aria-label={`Ver mídia ${posicao + 1}: ${slide.titulo}`}
              aria-current={atual === posicao ? "true" : undefined}
              className="flex size-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-roxo"
            >
              <span
                className={`h-1.5 rounded-full ${atual === posicao ? "w-5 bg-brand" : "w-1.5 bg-brand/25"}`}
              />
            </button>
          ))}
          <button
            type="button"
            aria-label={pausado ? "Retomar carrossel" : "Pausar carrossel"}
            onClick={() => setPausado(!pausado)}
            className="ml-2 flex size-8 items-center justify-center rounded-full text-brand hover:bg-lilas/20 focus-visible:outline-2 focus-visible:outline-roxo"
          >
            {pausado ? <Play className="size-3" /> : <Pause className="size-3" />}
          </button>
        </div>
      )}
    </div>
  );
}
