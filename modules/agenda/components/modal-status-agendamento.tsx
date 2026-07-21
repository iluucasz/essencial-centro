"use client";

import { useActionState, useEffect } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { LoaderCircle, TriangleAlert, UserX, X } from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";
import {
  confirmarStatusAgendamento,
  type EstadoFormularioAgendamento,
} from "@/modules/agenda/actions";
import type { StatusAgendamento } from "@/modules/agenda/schema";

type StatusConfirmavel = Extract<StatusAgendamento, "falta" | "cancelado">;

const estadoInicial: EstadoFormularioAgendamento = { status: "inicial" };

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

const textos: Record<
  StatusConfirmavel,
  {
    aviso: string;
    botao: string;
    botaoMenu: string;
    confirmar: string;
    corTitulo: string;
    descricao: string;
    titulo: string;
  }
> = {
  falta: {
    aviso: "Este atendimento ficará registrado como falta e não contará como sessão realizada.",
    botao: "Falta",
    botaoMenu: "Marcar falta",
    confirmar: "Confirmar falta",
    corTitulo: "text-dourado",
    descricao: "Confirme apenas quando o cliente não compareceu ao horário marcado.",
    titulo: "Registrar falta",
  },
  cancelado: {
    aviso: "O cliente será notificado do cancelamento. Esta ação não apaga o histórico.",
    botao: "Cancelar",
    botaoMenu: "Cancelar agendamento",
    confirmar: "Confirmar cancelamento",
    corTitulo: "text-perigo",
    descricao: "Use quando o atendimento não vai mais acontecer neste horário.",
    titulo: "Cancelar agendamento",
  },
};

function SubmitStatus({ pending, status }: { pending: boolean; status: StatusConfirmavel }) {
  const config = textos[status];

  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${
        status === "cancelado"
          ? "bg-perigo text-white hover:bg-perigo/90 focus-visible:outline-perigo"
          : "bg-dourado text-white hover:bg-dourado/90 focus-visible:outline-dourado"
      }`}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : status === "cancelado" ? (
        <X className="size-4" aria-hidden="true" />
      ) : (
        <UserX className="size-4" aria-hidden="true" />
      )}
      {config.confirmar}
    </button>
  );
}

function FormularioConfirmacaoStatus({
  agendamentoId,
  clienteNome,
  inicio,
  onSuccess,
  servicoNome,
  status,
}: {
  agendamentoId: string;
  clienteNome?: string;
  inicio?: Date;
  onSuccess: () => void;
  servicoNome?: string;
  status: StatusConfirmavel;
}) {
  const [state, formAction, pending] = useActionState(confirmarStatusAgendamento, estadoInicial);
  const config = textos[status];

  useEffect(() => {
    if (state.status === "sucesso") onSuccess();
  }, [onSuccess, state.status]);

  return (
    <form action={formAction} className="grid gap-4">
      <input name="id" type="hidden" value={agendamentoId} />
      <input name="status" type="hidden" value={status} />

      <div className="grid gap-3 rounded-2xl border border-border bg-background/40 p-4">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${
              status === "cancelado" ? "bg-perigo/10 text-perigo" : "bg-dourado/20 text-dourado"
            }`}
          >
            <TriangleAlert className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">
              {servicoNome ?? "Agendamento"}
            </span>
            <span className="mt-1 block text-sm text-muted">
              {inicio ? formatadorDataHora.format(inicio) : "Horário não informado"}
              {clienteNome ? ` · ${clienteNome}` : ""}
            </span>
          </span>
        </div>
        <p className="text-sm text-foreground">{config.descricao}</p>
        <p className="text-sm text-muted">{config.aviso}</p>
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
          onClick={onSuccess}
          type="button"
        >
          Voltar
        </button>
        <SubmitStatus pending={pending} status={status} />
      </div>
    </form>
  );
}

export function BotaoConfirmarStatusAgendamento({
  agendamentoId,
  clienteNome,
  inicio,
  onAbrir,
  onFechar,
  servicoNome,
  status,
  variante = "linha",
}: {
  agendamentoId: string;
  clienteNome?: string;
  inicio?: Date;
  onAbrir?: () => void;
  onFechar?: () => void;
  servicoNome?: string;
  status: StatusConfirmavel;
  variante?: "linha" | "menu";
}) {
  const modal = useOverlayState();
  const config = textos[status];
  const Icone = status === "cancelado" ? X : UserX;

  function abrirModal() {
    onAbrir?.();
    modal.open();
  }

  function fecharModal() {
    modal.close();
    onFechar?.();
  }

  return (
    <>
      <button
        className={
          variante === "menu"
            ? `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 ${
                status === "cancelado"
                  ? "text-perigo focus-visible:outline-perigo"
                  : "text-foreground focus-visible:outline-roxo"
              }`
            : `inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
                status === "cancelado"
                  ? "border-perigo/25 bg-perigo/5 text-perigo hover:bg-perigo/10 focus-visible:outline-perigo"
                  : "border-border bg-surface text-foreground hover:bg-creme focus-visible:outline-roxo"
              }`
        }
        onClick={abrirModal}
        role={variante === "menu" ? "menuitem" : undefined}
        type="button"
      >
        <Icone
          className={`${variante === "menu" ? "size-4" : "size-3.5"} ${
            status === "cancelado" ? "text-perigo" : "text-roxo"
          }`}
          aria-hidden="true"
        />
        {variante === "menu" ? config.botaoMenu : config.botao}
      </button>

      <Modal state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo={config.corTitulo} titulo={config.titulo}>
              {modal.isOpen ? (
                <FormularioConfirmacaoStatus
                  agendamentoId={agendamentoId}
                  clienteNome={clienteNome}
                  inicio={inicio}
                  onSuccess={fecharModal}
                  servicoNome={servicoNome}
                  status={status}
                />
              ) : null}
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
