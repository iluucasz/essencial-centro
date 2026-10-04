"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Pilha de cards em leque 3D: o ativo fica à frente e os vizinhos se abrem em arco dos dois
 * lados. Navega por arraste (no card ativo), clique num card de trás, setas, bolinhas e teclado.
 * Adaptado do "card-stack" do 21st.dev para `motion/react` (já usado no projeto) e para os
 * tokens da marca. O conteúdo de cada card vem de `renderCard`.
 */
export type CardStackItem = { id: string | number; title: string };

export type CardStackProps<T extends CardStackItem> = {
  items: T[];
  renderCard: (item: T, state: { active: boolean }) => React.ReactNode;
  /** Quantos cards ficam visíveis ao redor do ativo (ímpar). */
  maxVisible?: number;
  cardWidth?: number;
  cardHeight?: number;
  /** Quanto um card cobre o outro (0..0.8). */
  overlap?: number;
  /** Abertura total do leque, em graus. */
  spreadDeg?: number;
  perspectivePx?: number;
  depthPx?: number;
  tiltXDeg?: number;
  activeLiftPx?: number;
  activeScale?: number;
  inactiveScale?: number;
  loop?: boolean;
  /** Desliga o arraste de um card (ex.: vídeo com controles próprios). */
  canDrag?: (item: T) => boolean;
  ariaLabel: string;
  className?: string;
  onChangeIndex?: (index: number, item: T) => void;
};

function wrapIndex(n: number, len: number) {
  if (len <= 0) return 0;
  return ((n % len) + len) % len;
}

/** Menor distância com sinal entre o card i e o ativo, considerando o ciclo. */
function signedOffset(i: number, active: number, len: number, loop: boolean) {
  const raw = i - active;
  if (!loop || len <= 1) return raw;
  const alt = raw > 0 ? raw - len : raw + len;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
}

const botaoNavegacao =
  "flex size-12 items-center justify-center rounded-full border border-brand/25 text-brand transition hover:bg-brand hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo";

export function CardStack<T extends CardStackItem>({
  items,
  renderCard,
  maxVisible = 5,
  cardWidth = 300,
  cardHeight = 400,
  overlap = 0.55,
  spreadDeg = 30,
  perspectivePx = 1100,
  depthPx = 120,
  tiltXDeg = 8,
  activeLiftPx = 18,
  activeScale = 1,
  inactiveScale = 0.88,
  loop = true,
  canDrag = () => true,
  ariaLabel,
  className,
  onChangeIndex,
}: CardStackProps<T>) {
  const reduceMotion = useReducedMotion();
  const len = items.length;
  const [active, setActive] = React.useState(0);
  const current = wrapIndex(active, len);

  const maxOffset = Math.max(0, Math.floor(maxVisible / 2));
  const cardSpacing = Math.max(10, Math.round(cardWidth * (1 - overlap)));
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;

  const goTo = React.useCallback(
    (index: number) => {
      if (!len) return;
      const next = loop ? wrapIndex(index, len) : Math.min(len - 1, Math.max(0, index));
      setActive(next);
      onChangeIndex?.(next, items[next]);
    },
    [items, len, loop, onChangeIndex],
  );

  if (!len) return null;

  return (
    <div
      className={cn("w-full", className)}
      role="region"
      aria-roledescription="carrossel"
      aria-label={ariaLabel}
    >
      <div
        className="relative w-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-roxo"
        style={{ height: cardHeight + activeLiftPx + 40 }}
        tabIndex={0}
        onKeyDown={(event) => {
          if ((event.target as HTMLElement).tagName === "VIDEO") return;
          if (event.key === "ArrowLeft") goTo(current - 1);
          if (event.key === "ArrowRight") goTo(current + 1);
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-32 w-3/4 rounded-full bg-brand/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 flex items-end justify-center"
          style={{ perspective: `${perspectivePx}px` }}
        >
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const off = signedOffset(i, current, len, loop);
              const abs = Math.abs(off);
              if (abs > maxOffset) return null;

              const isActive = off === 0;
              const rotateZ = off * stepDeg;
              const x = off * cardSpacing;
              const y = abs * 12 + (isActive ? -activeLiftPx : 0);
              const draggable = isActive && !reduceMotion && canDrag(item);

              return (
                <motion.div
                  key={item.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} de ${len}: ${item.title}`}
                  aria-hidden={!isActive}
                  className={cn(
                    "absolute bottom-0 overflow-hidden rounded-[1.75rem] border border-lilas/30 bg-surface shadow-xl shadow-brand/15 will-change-transform select-none",
                    isActive
                      ? draggable
                        ? "cursor-grab active:cursor-grabbing"
                        : ""
                      : "cursor-pointer",
                  )}
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    zIndex: 100 - abs,
                    transformStyle: "preserve-3d",
                  }}
                  initial={reduceMotion ? false : { opacity: 0, x, y: y + 40, rotateZ, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    x,
                    y,
                    rotateZ,
                    rotateX: isActive ? 0 : tiltXDeg,
                    scale: isActive ? activeScale : inactiveScale,
                  }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                  transition={
                    reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 28 }
                  }
                  onClick={() => {
                    if (!isActive) goTo(i);
                  }}
                  {...(draggable
                    ? {
                        drag: "x" as const,
                        dragConstraints: { left: 0, right: 0 },
                        dragElastic: 0.18,
                        onDragEnd: (
                          _evento: unknown,
                          info: { offset: { x: number }; velocity: { x: number } },
                        ) => {
                          const limite = Math.min(140, cardWidth * 0.22);
                          if (info.offset.x > limite || info.velocity.x > 650) goTo(current - 1);
                          else if (info.offset.x < -limite || info.velocity.x < -650)
                            goTo(current + 1);
                        },
                      }
                    : {})}
                >
                  <div
                    className="h-full w-full"
                    style={{
                      transform: `translateZ(${-abs * depthPx}px)`,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {renderCard(item, { active: isActive })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {len > 1 && (
        <div className="mt-8 flex items-center justify-center gap-5">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => goTo(current - 1)}
            disabled={!loop && current === 0}
            className={botaoNavegacao}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Ver ${item.title}`}
                aria-current={index === current ? "true" : undefined}
                onClick={() => goTo(index)}
                className="flex h-6 items-center focus-visible:outline-2 focus-visible:outline-roxo"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-all",
                    index === current ? "w-6 bg-brand" : "w-1.5 bg-brand/25 hover:bg-brand/50",
                  )}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Próximo"
            onClick={() => goTo(current + 1)}
            disabled={!loop && current === len - 1}
            className={botaoNavegacao}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
