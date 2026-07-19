"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { Plus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Wrapper padrão para "formulário de criação" em modal (em vez de página/aside fixo).
 * `icone` e `children` cruzam a fronteira Server → Client como elementos já
 * renderizados (não referências de componente/função — RSC não serializa isso).
 * O formulário fecha o modal chamando `useFecharModal()` internamente.
 * Posicionamento/animação/z-index já vêm prontos do HeroUI (ver docs/context/05-design-system.md);
 * só estilizamos superfície/cor com os tokens da marca.
 */
const FecharModalContext = createContext<() => void>(() => {});

export function useFecharModal() {
  return useContext(FecharModalContext);
}

export function FecharModalProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: () => void;
}) {
  return <FecharModalContext.Provider value={value}>{children}</FecharModalContext.Provider>;
}

export function ModalDialogAnimado({
  children,
  className,
  conteudoClassName,
}: {
  children: ReactNode;
  className?: string;
  conteudoClassName?: string;
}) {
  const reduzirMovimento = useReducedMotion();

  return (
    <Modal.Dialog className={className}>
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        initial={reduzirMovimento ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 10 }}
        transition={{
          duration: reduzirMovimento ? 0.01 : 0.18,
          ease: "easeOut",
        }}
        className={conteudoClassName}
      >
        {children}
      </motion.div>
    </Modal.Dialog>
  );
}

export function ParteModalAnimada({
  children,
  className,
  ordem = 0,
}: {
  children: ReactNode;
  className?: string;
  ordem?: number;
}) {
  const reduzirMovimento = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={reduzirMovimento ? { opacity: 0 } : { opacity: 0, y: 8 }}
      transition={{
        delay: reduzirMovimento ? 0 : ordem * 0.045,
        duration: reduzirMovimento ? 0.01 : 0.18,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * "Casca" visual padrão do conteúdo de um modal (cabeçalho fixo com borda, corpo com scroll
 * próprio de cantos arredondados e scrollbar fina, botão de fechar consistente) — usada tanto
 * pelo `ModalFormulario` (criação) quanto pelos menus de ações (`MenuAcoes<Entidade>`) de cada
 * módulo, pra edição/exclusão terem exatamente a mesma "pele" em vez de cada um reimplementar o
 * cabeçalho/scroll à mão.
 */
export function ConteudoModal({
  titulo,
  corTitulo = "text-brand",
  children,
}: {
  titulo: string;
  corTitulo?: string;
  children: ReactNode;
}) {
  return (
    <ModalDialogAnimado
      className="max-h-[min(86vh,44rem)] w-[calc(100vw-2rem)] max-w-[44rem] overflow-hidden rounded-3xl"
      conteudoClassName="flex max-h-[min(86vh,44rem)] min-h-0 flex-col"
    >
      <ParteModalAnimada className="shrink-0">
        <Modal.Header className="shrink-0 border-b border-border/70 px-6 pt-6 pr-14 pb-4">
          <Modal.Heading className={cn("text-lg font-semibold", corTitulo)}>{titulo}</Modal.Heading>
        </Modal.Header>
      </ParteModalAnimada>
      <Modal.CloseTrigger className="top-5 right-5 bg-muted/10 text-muted transition hover:bg-roxo/10 hover:text-roxo" />
      <ParteModalAnimada className="min-h-0 flex-1" ordem={1}>
        <Modal.Body
          className={cn(
            "h-full min-h-0 [scrollbar-gutter:stable] overflow-x-hidden overflow-y-auto px-6 pt-5 pb-6",
            "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted/35 [&::-webkit-scrollbar-track]:bg-transparent",
          )}
        >
          {children}
        </Modal.Body>
      </ParteModalAnimada>
    </ModalDialogAnimado>
  );
}

export function ModalFormulario({
  titulo,
  rotuloBotao,
  icone = <Plus className="size-4" aria-hidden />,
  children,
}: {
  titulo: string;
  rotuloBotao: string;
  icone?: ReactNode;
  children: ReactNode;
}) {
  const state = useOverlayState();

  return (
    <Modal state={state}>
      <Modal.Trigger className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo">
        {icone}
        {rotuloBotao}
      </Modal.Trigger>
      <Modal.Backdrop variant="opaque">
        <Modal.Container className="w-[calc(100vw-2rem)] sm:w-full" size="lg">
          <ConteudoModal titulo={titulo}>
            <FecharModalProvider value={state.close}>{children}</FecharModalProvider>
          </ConteudoModal>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
