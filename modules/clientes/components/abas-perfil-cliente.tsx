"use client";

import type { MouseEvent, ReactNode } from "react";
import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export type AbaPerfilClienteItem = {
  contador?: number;
  href: string;
  id: string;
  rotulo: string;
};

function cliqueDeNavegacao(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    event.currentTarget.target !== "_blank"
  );
}

export function AbasPerfilCliente({
  abaAtual,
  abas,
  children,
}: {
  abaAtual: string;
  abas: AbaPerfilClienteItem[];
  children: ReactNode;
}) {
  const reduzirMovimento = useReducedMotion();
  const [, iniciarTransicao] = useTransition();
  const [abaOtimista, definirAbaOtimista] = useOptimistic(abaAtual);

  return (
    <>
      <nav
        aria-label="Abas do perfil do cliente"
        className="flex flex-wrap justify-center gap-1 rounded-3xl border border-roxo/10 bg-surface/90 p-1.5 shadow-sm"
      >
        {abas.map((item) => {
          const ativo = item.id === abaOtimista;

          return (
            <Link
              aria-current={item.id === abaAtual ? "page" : undefined}
              className={cn(
                "relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo",
                ativo
                  ? "text-brand-foreground"
                  : "border border-transparent text-muted hover:border-roxo/10 hover:bg-lilas/15 hover:text-roxo",
              )}
              href={item.href}
              key={item.id}
              onClick={(event) => {
                if (cliqueDeNavegacao(event)) {
                  iniciarTransicao(() => definirAbaOtimista(item.id));
                }
              }}
            >
              {ativo ? (
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl bg-brand shadow-sm"
                  layoutId="aba-perfil-cliente-ativa"
                  transition={
                    reduzirMovimento
                      ? { duration: 0.01 }
                      : { type: "spring", stiffness: 420, damping: 34, mass: 0.8 }
                  }
                />
              ) : null}
              <span className="relative z-10">{item.rotulo}</span>
              {item.contador !== undefined ? (
                <span
                  className={cn(
                    "relative z-10 rounded-full px-2 py-0.5 text-xs transition",
                    ativo ? "bg-surface/20 text-brand-foreground" : "bg-lilas/25 text-roxo",
                  )}
                >
                  {item.contador}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <AnimatePresence initial={false} mode="wait">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={reduzirMovimento ? { opacity: 1 } : { opacity: 0, y: -6 }}
          initial={reduzirMovimento ? { opacity: 1 } : { opacity: 0, y: 8 }}
          key={abaAtual}
          transition={{ duration: reduzirMovimento ? 0.01 : 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
