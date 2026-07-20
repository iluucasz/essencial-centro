"use client";

import type { ReactNode } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { QrCode } from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";

/**
 * Torna a linha de um atendimento clicável e abre um modal responsivo com apenas o QR de presença
 * (passado como `children` — o QrCheckin é renderizado no servidor e cruza a fronteira já pronto).
 */
export function ModalQrAgendamento({
  titulo,
  gatilho,
  children,
}: {
  titulo: string;
  gatilho: ReactNode;
  children: ReactNode;
}) {
  const modal = useOverlayState();

  return (
    <>
      <button
        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-creme focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-roxo"
        onClick={() => modal.open()}
        type="button"
      >
        <span className="min-w-0 flex-1">{gatilho}</span>
        <QrCode className="size-5 shrink-0 text-roxo" aria-hidden="true" />
      </button>

      <Modal state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal titulo={titulo}>
              <div className="grid justify-items-center gap-4 py-2">
                {children}
                <p className="max-w-xs text-center text-sm text-muted">
                  Mostre este QR na recepção para confirmar sua presença.
                </p>
              </div>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
