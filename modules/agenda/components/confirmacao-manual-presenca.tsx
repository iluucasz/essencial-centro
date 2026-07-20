"use client";

import { Modal, useOverlayState } from "@heroui/react";
import { CheckCircle2, TriangleAlert } from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";
import { confirmarPresenca } from "@/modules/agenda/actions";

/**
 * Confirmação manual de presença (fallback do leitor de QR): abre um modal de aviso antes de
 * registrar, porque confirmar sem ler o QR pula a verificação de que o cliente está presente com o
 * próprio comprovante. O botão do modal submete a action `confirmarPresenca`; ao confirmar, a
 * página revalida e some com esta seção.
 */
export function ConfirmacaoManualPresenca({ agendamentoId }: { agendamentoId: string }) {
  const modal = useOverlayState();

  return (
    <>
      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        onClick={() => modal.open()}
        type="button"
      >
        <CheckCircle2 className="size-4" aria-hidden="true" />
        Confirmar manualmente
      </button>

      <Modal state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo="text-dourado" titulo="Confirmar sem ler o QR?">
              <div className="grid gap-4">
                <div className="flex gap-3 rounded-xl bg-dourado/10 p-3">
                  <TriangleAlert className="size-5 shrink-0 text-dourado" aria-hidden="true" />
                  <p className="text-sm text-foreground">
                    A leitura do QR do cliente é o jeito recomendado — garante que a pessoa está
                    presente com o próprio comprovante. Confirmar manualmente registra a presença
                    sem essa verificação.
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                    onClick={() => modal.close()}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <form action={confirmarPresenca}>
                    <input name="id" type="hidden" value={agendamentoId} />
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                      type="submit"
                    >
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      Confirmar mesmo assim
                    </button>
                  </form>
                </div>
              </div>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
