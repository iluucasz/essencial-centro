"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Pause, Play, ZoomIn } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { CLINIC, criarLinkAvaliacao, type Service } from "@/lib/marketing/clinic";
import {
  blocoCatalogoPadrao,
  capaCatalogoPadrao,
  type BlocoCatalogo,
} from "@/modules/site-publico/blocos";
import { iconesCatalogo } from "@/modules/site-publico/icones";

const DURACAO_SLIDE = 5000;

/** Converte o catálogo editável no formato do carrossel: uma página por arte de cada categoria. */
function montarCatalogo(bloco: BlocoCatalogo) {
  const servicos: Service[] = bloco.categorias.map((categoria) => ({
    slug: categoria.slug,
    name: categoria.nome,
    short: categoria.chamada,
    description: categoria.descricao,
    icon: iconesCatalogo[categoria.icone].icone,
    treatments: categoria.tratamentos,
    catalogs: categoria.paginas.length
      ? categoria.paginas.map((pagina) => ({ title: pagina.titulo, image: pagina.imagem }))
      : undefined,
  }));
  const paginas = servicos.flatMap((servico) =>
    (servico.catalogs ?? [{ title: servico.name, image: capaCatalogoPadrao }]).map((catalogo) => ({
      servico,
      catalogo,
    })),
  );
  return { servicos, paginas };
}

const botaoSeta =
  "flex size-12 items-center justify-center rounded-full border border-brand/25 text-brand transition-colors hover:bg-brand hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo";

/**
 * Catálogo público em formato editorial ("elegant carousel"): texto à esquerda, arte num quadro
 * com cantos dourados à direita e, embaixo, as categorias como barras de progresso — a da vez
 * se preenche no tempo da troca automática.
 */
export function ServicesSection({
  catalogo: bloco = blocoCatalogoPadrao,
  whatsapp = CLINIC.whatsapp,
}: {
  catalogo?: BlocoCatalogo;
  whatsapp?: string;
}) {
  const { servicos, paginas: PAGINAS } = useMemo(() => montarCatalogo(bloco), [bloco]);
  const [indice, setIndice] = useState(0);
  const [direcao, setDirecao] = useState<1 | -1>(1);
  const [pausado, setPausado] = useState(false);
  const [ponteiroDentro, setPonteiroDentro] = useState(false);
  const [focoDentro, setFocoDentro] = useState(false);
  const inicioToque = useRef<{ x: number; y: number } | null>(null);
  const reduzirMovimento = useReducedMotion();
  const atual = indice % PAGINAS.length;
  const { servico, catalogo } = PAGINAS[atual];
  const categoriaAtual = servicos.findIndex((item) => item.slug === servico.slug);
  const rotacaoAtiva = !pausado && !ponteiroDentro && !focoDentro;

  useEffect(() => {
    if (!rotacaoAtiva) return;
    const temporizador = window.setTimeout(() => {
      setDirecao(1);
      setIndice((valor) => (valor + 1) % PAGINAS.length);
    }, DURACAO_SLIDE);
    return () => window.clearTimeout(temporizador);
  }, [indice, rotacaoAtiva, PAGINAS.length]);

  function irPara(posicao: number) {
    setDirecao(posicao >= atual ? 1 : -1);
    setIndice((posicao + PAGINAS.length) % PAGINAS.length);
  }

  function navegar(passo: 1 | -1) {
    setDirecao(passo);
    setIndice((valor) => (valor + passo + PAGINAS.length) % PAGINAS.length);
  }

  const deslocamento = reduzirMovimento ? 0 : 24;

  return (
    <section
      id="servicos"
      className="relative scroll-mt-20 overflow-hidden bg-creme py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="flex items-center justify-center gap-3 text-xs font-semibold tracking-[0.22em] text-roxo uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-dourado" />
            {bloco.selo}
            <span aria-hidden="true" className="h-px w-8 bg-dourado" />
          </span>
          <h2 className="mt-4 font-serif text-4xl text-brand sm:text-5xl">
            {bloco.titulo.split("\n").map((linha, posicao) => (
              <Fragment key={posicao}>
                {posicao > 0 && <br />}
                {linha}
              </Fragment>
            ))}
          </h2>
          {bloco.subtitulo && <p className="mt-5 leading-relaxed text-muted">{bloco.subtitulo}</p>}
        </div>

        <div
          className="relative mt-14 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-roxo"
          role="region"
          aria-roledescription="carrossel"
          aria-label="Planos e cuidados da Essencial"
          tabIndex={0}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setPonteiroDentro(true);
          }}
          onPointerLeave={() => setPonteiroDentro(false)}
          onFocusCapture={() => setFocoDentro(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocoDentro(false);
          }}
          onKeyDown={(event) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              navegar(event.key === "ArrowRight" ? 1 : -1);
            }
          }}
        >
          {/* Brilho lilás atrás da arte, como a "lavagem" de cor do carrossel editorial. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-20 -inset-y-10 bg-[radial-gradient(ellipse_at_72%_45%,color-mix(in_srgb,var(--color-lilas)_28%,transparent)_0%,transparent_65%)]"
          />

          <div
            id="detalhes-servico"
            className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16"
            onTouchStart={(event) => {
              const toque = event.touches[0];
              inicioToque.current =
                event.touches.length === 1 ? { x: toque.clientX, y: toque.clientY } : null;
            }}
            onTouchCancel={() => {
              inicioToque.current = null;
            }}
            onTouchEnd={(event) => {
              const inicio = inicioToque.current;
              inicioToque.current = null;
              if (!inicio) return;
              const toque = event.changedTouches[0];
              const distanciaX = toque.clientX - inicio.x;
              const distanciaY = toque.clientY - inicio.y;
              if (Math.abs(distanciaX) > 50 && Math.abs(distanciaX) > Math.abs(distanciaY)) {
                navegar(distanciaX < 0 ? 1 : -1);
              }
            }}
          >
            {/* Texto */}
            <div
              role="group"
              aria-roledescription="slide"
              aria-label={`${atual + 1} de ${PAGINAS.length}: ${catalogo.title}`}
              className="order-2 min-w-0 lg:order-1"
            >
              <p
                role="status"
                aria-live={rotacaoAtiva ? "off" : "polite"}
                aria-atomic="true"
                className="flex items-center gap-3 text-xs tracking-[0.2em] text-muted"
              >
                <span aria-hidden="true" className="h-px w-10 bg-dourado" />
                <span>
                  <span className="font-semibold text-brand">
                    {String(atual + 1).padStart(2, "0")}
                  </span>
                  {" / "}
                  {String(PAGINAS.length).padStart(2, "0")}
                  <span className="sr-only"> · {catalogo.title}</span>
                </span>
              </p>

              <motion.div
                key={atual}
                initial={{ opacity: 0, x: deslocamento * direcao }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reduzirMovimento ? 0 : 0.35, ease: "easeOut" }}
              >
                {servico.short && (
                  <span className="mt-6 block text-xs font-semibold tracking-[0.2em] text-roxo uppercase">
                    {servico.short}
                  </span>
                )}
                <h3 className="mt-3 font-serif text-4xl leading-tight text-brand sm:text-5xl">
                  {servico.name}
                </h3>
                {catalogo.title !== servico.name && (
                  <p className="mt-2 font-serif text-xl text-roxo italic">{catalogo.title}</p>
                )}
                <p className="mt-5 max-w-lg leading-relaxed text-muted">{servico.description}</p>
                {servico.treatments.length > 0 && (
                  <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                    {servico.treatments.map((tratamento) => (
                      <li
                        key={tratamento}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground"
                      >
                        <Check className="mt-1 size-4 shrink-0 text-salvia" aria-hidden="true" />
                        {tratamento}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href={criarLinkAvaliacao(servico.name, whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-brand px-6 py-3.5 text-sm font-medium text-surface transition-colors hover:bg-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                >
                  Conversar sobre {servico.name.toLocaleLowerCase("pt-BR")}
                  <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                </a>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Plano anterior"
                    aria-controls="detalhes-servico"
                    onClick={() => navegar(-1)}
                    className={botaoSeta}
                  >
                    <ArrowLeft className="size-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Próximo plano"
                    aria-controls="detalhes-servico"
                    onClick={() => navegar(1)}
                    className={botaoSeta}
                  >
                    <ArrowRight className="size-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={pausado ? "Retomar troca automática" : "Pausar troca automática"}
                    onClick={() => setPausado((valor) => !valor)}
                    className="flex size-10 items-center justify-center rounded-full text-brand hover:bg-lilas/20 focus-visible:outline-2 focus-visible:outline-roxo"
                  >
                    {pausado ? (
                      <Play className="size-4" aria-hidden="true" />
                    ) : (
                      <Pause className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Confirme valores, disponibilidade e o plano indicado para você com a equipe.
              </p>
            </div>

            {/* Arte */}
            <div className="relative order-1 mx-auto w-full max-w-md lg:order-2">
              <span
                aria-hidden="true"
                className="absolute -top-3 -left-3 size-16 rounded-tl-3xl border-t-2 border-l-2 border-dourado/70"
              />
              <span
                aria-hidden="true"
                className="absolute -right-3 -bottom-3 size-16 rounded-br-3xl border-r-2 border-b-2 border-dourado/70"
              />
              <motion.a
                key={catalogo.image}
                href={catalogo.image}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ampliar imagem: ${catalogo.title}`}
                initial={{ opacity: 0, scale: reduzirMovimento ? 1 : 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduzirMovimento ? 0 : 0.4, ease: "easeOut" }}
                className="group relative block overflow-hidden rounded-3xl border border-lilas/30 bg-surface p-3 shadow-xl shadow-roxo/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-roxo"
              >
                <Image
                  src={catalogo.image}
                  alt={
                    servico.catalogs
                      ? `Catálogo Essencial: ${catalogo.title}`
                      : "Capa do catálogo de serviços da Essencial Centro"
                  }
                  width={853}
                  height={1280}
                  unoptimized={catalogo.image.startsWith("https:")}
                  sizes="(max-width: 767px) 90vw, 440px"
                  className="h-auto max-h-152 w-full rounded-2xl object-contain"
                />
                <span className="absolute right-6 bottom-6 inline-flex items-center gap-2 rounded-full bg-surface/90 px-3 py-2 text-xs font-medium text-roxo shadow-sm backdrop-blur-sm transition-colors group-hover:bg-surface">
                  <ZoomIn className="size-4" aria-hidden="true" />
                  Ampliar
                </span>
              </motion.a>
              <div
                className="mt-5 flex flex-wrap justify-center"
                role="group"
                aria-label="Páginas do catálogo"
              >
                {PAGINAS.map((pagina, posicao) => (
                  <button
                    key={`${pagina.servico.slug}-${pagina.catalogo.image}-${posicao}`}
                    type="button"
                    aria-label={`Ver ${pagina.catalogo.title}`}
                    aria-current={atual === posicao ? "true" : undefined}
                    aria-controls="detalhes-servico"
                    onClick={() => irPara(posicao)}
                    className="flex size-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-roxo"
                  >
                    <span
                      className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${atual === posicao ? "w-5 bg-brand" : "w-1.5 bg-brand/25"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Categorias como barras de progresso */}
          <div
            className="relative mt-12 flex [scrollbar-width:none] gap-3 overflow-x-auto pb-2 sm:grid sm:overflow-visible [&::-webkit-scrollbar]:hidden"
            style={{ gridTemplateColumns: `repeat(${servicos.length}, minmax(0, 1fr))` }}
            role="group"
            aria-label="Categorias de atendimento"
          >
            {servicos.map((item, posicao) => {
              const ativa = posicao === categoriaAtual;
              return (
                <button
                  key={item.slug}
                  type="button"
                  aria-pressed={ativa}
                  aria-controls="detalhes-servico"
                  onClick={() =>
                    irPara(PAGINAS.findIndex((pagina) => pagina.servico.slug === item.slug))
                  }
                  className="group/categoria min-w-32 shrink-0 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-roxo"
                >
                  <span className="relative block h-0.5 overflow-hidden rounded-full bg-brand/15">
                    {posicao < categoriaAtual && (
                      <span className="absolute inset-0 bg-brand/40" aria-hidden="true" />
                    )}
                    {ativa && (
                      <span
                        // Reinicia a animação a cada slide e ao retomar a troca automática.
                        key={`${atual}-${rotacaoAtiva}`}
                        aria-hidden="true"
                        className="absolute inset-0 origin-left bg-roxo"
                        style={
                          reduzirMovimento || !rotacaoAtiva
                            ? undefined
                            : { animation: `catalogo-progresso ${DURACAO_SLIDE}ms linear both` }
                        }
                      />
                    )}
                  </span>
                  <span
                    className={`mt-3 flex items-center gap-2 text-xs font-medium transition-colors sm:text-sm ${ativa ? "text-brand" : "text-muted group-hover/categoria:text-brand"}`}
                  >
                    <item.icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {bloco.aviso && (
          <p className="mt-8 text-center text-xs leading-relaxed text-muted">{bloco.aviso}</p>
        )}
      </div>
    </section>
  );
}
