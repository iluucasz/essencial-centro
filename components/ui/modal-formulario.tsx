"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { Plus } from "lucide-react";

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
          <Modal.Dialog className="max-h-[85vh] overflow-y-auto">
            <Modal.Header>
              <Modal.Heading className="text-lg font-semibold text-brand">{titulo}</Modal.Heading>
            </Modal.Header>
            <Modal.CloseTrigger />
            <Modal.Body>
              <FecharModalContext.Provider value={state.close}>
                {children}
              </FecharModalContext.Provider>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
