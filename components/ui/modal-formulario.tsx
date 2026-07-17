"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { Plus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

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
}: {
  children: ReactNode;
  className?: string;
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
      >
        {children}
      </motion.div>
    </Modal.Dialog>
  );
}

export function ParteModalAnimada({
  children,
  ordem = 0,
}: {
  children: ReactNode;
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
    >
      {children}
    </motion.div>
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
        <Modal.Container size="lg">
          <ModalDialogAnimado className="max-h-[85vh] overflow-y-auto">
            <ParteModalAnimada>
              <Modal.Header>
                <Modal.Heading className="text-lg font-semibold text-brand">{titulo}</Modal.Heading>
              </Modal.Header>
            </ParteModalAnimada>
            <Modal.CloseTrigger />
            <ParteModalAnimada ordem={1}>
              <Modal.Body>
                <FecharModalProvider value={state.close}>{children}</FecharModalProvider>
              </Modal.Body>
            </ParteModalAnimada>
          </ModalDialogAnimado>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
