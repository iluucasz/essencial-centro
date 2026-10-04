"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Play } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { CardStack } from "@/components/ui/card-stack";
import { filtrosMidia, type ConteudoPublico } from "../validacao";
import { PlayerSite } from "./player-site";

type Profissional = ConteudoPublico & { title: string };

/** Largura do card conforme o espaço disponível: cabe no celular sem cortar o leque. */
function useLarguraCard() {
  const area = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(300);

  useEffect(() => {
    const elemento = area.current;
    if (!elemento) return;
    const medir = () =>
      setLargura(Math.round(Math.min(320, Math.max(220, elemento.clientWidth * 0.62))));
    medir();
    if (typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return { area, largura };
}

function CartaoProfissional({ item, ativo }: { item: Profissional; ativo: boolean }) {
  const video = item.tipoMidia === "video" && item.midia;
  return (
    <div className="relative h-full w-full bg-lilas/15">
      {video && ativo ? (
        <PlayerSite midia={item.midia} ajustes={item} rotulo={`Vídeo de ${item.titulo}`} />
      ) : video ? (
        <>
          <video
            src={`${item.midia}#t=0.1`}
            muted
            playsInline
            preload="metadata"
            style={{ filter: filtrosMidia[item.filtro].css }}
            className="size-full object-cover"
          />
          <span className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-brand">
            <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
          </span>
        </>
      ) : (
        <Image
          src={item.midia}
          alt={item.titulo}
          fill
          draggable={false}
          unoptimized={item.midia.startsWith("https:")}
          sizes="320px"
          style={{ filter: filtrosMidia[item.filtro].css }}
          className="pointer-events-none object-cover object-top"
        />
      )}
      {!(video && ativo) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-brand/85 via-brand/35 to-transparent px-5 pt-16 pb-5">
          <p className="font-serif text-xl leading-tight text-white">{item.titulo}</p>
          {item.subtitulo && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/85">
              {item.subtitulo}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function CarrosselProfissionais({
  itens,
  whatsapp,
}: {
  itens: ConteudoPublico[];
  whatsapp: string;
}) {
  const { area, largura } = useLarguraCard();
  const [indice, setIndice] = useState(0);
  const reduzirMovimento = useReducedMotion();
  const profissionais: Profissional[] = itens.map((item) => ({ ...item, title: item.titulo }));
  const ativo = profissionais[indice] ?? profissionais[0];

  return (
    <div ref={area} className="mx-auto mt-14 max-w-3xl">
      <CardStack
        items={profissionais}
        ariaLabel="Profissionais da Essencial"
        cardWidth={largura}
        cardHeight={Math.round(largura * 1.3)}
        canDrag={(item) => item.tipoMidia !== "video"}
        onChangeIndex={(posicao) => setIndice(posicao)}
        renderCard={(item, { active }) => <CartaoProfissional item={item} ativo={active} />}
      />

      <motion.div
        key={ativo.id}
        initial={reduzirMovimento ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto mt-10 max-w-xl text-center"
        aria-live="polite"
      >
        <h3 className="font-serif text-3xl text-brand">{ativo.titulo}</h3>
        {ativo.subtitulo && (
          <p className="mx-auto mt-3 w-fit rounded-full bg-lilas/15 px-4 py-1.5 text-xs font-medium text-roxo">
            {ativo.subtitulo}
          </p>
        )}
        <div className="mx-auto mt-5 h-px w-12 bg-dourado/70" aria-hidden="true" />
        {ativo.texto && (
          <p className="mt-5 leading-relaxed whitespace-pre-line text-muted">{ativo.texto}</p>
        )}
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Gostaria de agendar um atendimento com ${ativo.titulo} na Essencial Centro.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-medium text-surface transition-colors hover:bg-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        >
          Agendar com {ativo.titulo}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      </motion.div>
    </div>
  );
}
