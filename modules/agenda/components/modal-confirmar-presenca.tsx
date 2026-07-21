"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import { CheckCircle2, LoaderCircle, MapPin, QrCode, TriangleAlert, UserCheck } from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";
import {
  confirmarPresencaAgendamento,
  type EstadoFormularioAgendamento,
} from "@/modules/agenda/actions";
import { rotulosModalidadeAtendimento, type ModalidadeAtendimento } from "@/modules/agenda/schema";

import { LeitorQrPresenca } from "./leitor-qr-presenca";

const estadoInicial: EstadoFormularioAgendamento = { status: "inicial" };

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

export type AgendamentoParaPresenca = {
  id: string;
  clienteNome: string;
  inicio: Date;
  modalidade: ModalidadeAtendimento;
  servicoNome: string;
};

function CartaoAgendamento({ agendamento }: { agendamento: AgendamentoParaPresenca }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-background/40 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-lilas/20 text-roxo">
          <UserCheck className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground">
            {agendamento.clienteNome}
          </span>
          <span className="mt-1 block text-sm text-muted">
            {agendamento.servicoNome} · {formatadorDataHora.format(agendamento.inicio)}
          </span>
        </span>
      </div>

      <p className="flex items-center gap-2 text-sm text-muted">
        <MapPin className="size-4 shrink-0" aria-hidden="true" />
        {rotulosModalidadeAtendimento[agendamento.modalidade]}
      </p>
    </div>
  );
}

function FormularioConfirmacaoManual({
  agendamento,
  onCancel,
  onSuccess,
}: {
  agendamento: AgendamentoParaPresenca;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(confirmarPresencaAgendamento, estadoInicial);

  useEffect(() => {
    if (state.status === "sucesso") onSuccess();
  }, [onSuccess, state.status]);

  return (
    <form action={formAction} className="grid gap-4">
      <input name="id" type="hidden" value={agendamento.id} />

      <CartaoAgendamento agendamento={agendamento} />

      <div className="flex gap-3 rounded-xl bg-dourado/10 p-3">
        <TriangleAlert className="size-5 shrink-0 text-dourado" aria-hidden="true" />
        <p className="text-sm text-foreground">
          Você está confirmando a presença manualmente, sem validar o QR do cliente. Use apenas
          quando tiver certeza de que a pessoa chegou para este atendimento.
        </p>
      </div>

      {state.status === "erro" && state.mensagem ? (
        <p
          className="rounded-xl bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          {state.mensagem}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-4">
        <button
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          )}
          Confirmar manualmente
        </button>
      </div>
    </form>
  );
}

function ConteudoConfirmacaoPresenca({
  agendamento,
  onCancel,
  onSuccess,
}: {
  agendamento: AgendamentoParaPresenca;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const modalManual = useOverlayState();

  function concluirManualmente() {
    modalManual.close();
    onSuccess();
  }

  return (
    <>
      <div className="grid gap-4">
        <CartaoAgendamento agendamento={agendamento} />

        <p className="rounded-xl bg-creme px-3 py-2 text-sm text-foreground">
          Confirme apenas quando a pessoa já chegou para o atendimento. Isso registra a presença,
          mas não marca a sessão como realizada.
        </p>

        <LeitorQrPresenca
          agendamentoId={agendamento.id}
          mostrarLinkOutroAgendamento={false}
          onConfirmado={onSuccess}
        />

        <div className="flex items-center gap-3 text-xs font-medium text-muted">
          <span className="h-px flex-1 bg-border" />
          ou confirmar manualmente
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          onClick={() => modalManual.open()}
          type="button"
        >
          <UserCheck className="size-4" aria-hidden="true" />
          Confirmar manualmente
        </button>

        <div className="flex justify-end border-t border-border/70 pt-4">
          <button
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </div>

      <Modal state={modalManual}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo="text-dourado" titulo="Confirmar manualmente?">
              {modalManual.isOpen ? (
                <FormularioConfirmacaoManual
                  agendamento={agendamento}
                  onCancel={modalManual.close}
                  onSuccess={concluirManualmente}
                />
              ) : null}
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

export function BotaoConfirmarPresenca({ agendamento }: { agendamento: AgendamentoParaPresenca }) {
  const modal = useOverlayState();
  const router = useRouter();

  function fecharComAtualizacao() {
    modal.close();
    router.refresh();
  }

  return (
    <>
      <button
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        onClick={() => modal.open()}
        type="button"
      >
        <QrCode className="size-3.5" aria-hidden="true" />
        Presença
      </button>

      <Modal state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal titulo="Confirmar presença">
              {modal.isOpen ? (
                <ConteudoConfirmacaoPresenca
                  agendamento={agendamento}
                  onCancel={modal.close}
                  onSuccess={fecharComAtualizacao}
                />
              ) : null}
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
