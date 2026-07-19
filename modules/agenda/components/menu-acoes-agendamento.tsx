"use client";

import { useActionState, useEffect, useState, type FocusEvent } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { Check, Ellipsis, LoaderCircle, Pencil, Trash2, UserX, X } from "lucide-react";

import { usePosicaoMenuAcoes } from "@/components/ui/menu-acoes";
import { ConteudoModal, FecharModalProvider } from "@/components/ui/modal-formulario";
import {
  atualizarStatusAgendamento,
  excluirAgendamento,
  type EstadoExclusaoAgendamento,
} from "@/modules/agenda/actions";
import type { StatusAgendamento } from "@/modules/agenda/schema";

import { FormularioAgendamento, type AgendamentoFormulario } from "./formulario-agendamento";

const estadoInicialExclusao: EstadoExclusaoAgendamento = { status: "inicial" };

type Opcao = { id: string; nome: string };

function BotaoStatus({
  agendamentoId,
  clienteId,
  fechar,
  icone: Icone,
  label,
  status,
}: {
  agendamentoId: string;
  clienteId: string;
  fechar: () => void;
  icone: typeof Check;
  label: string;
  status: StatusAgendamento;
}) {
  return (
    <form action={atualizarStatusAgendamento}>
      <input name="id" type="hidden" value={agendamentoId} />
      <input name="clienteId" type="hidden" value={clienteId} />
      <input name="status" type="hidden" value={status} />
      <button
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        onClick={fechar}
        role="menuitem"
        type="submit"
      >
        <Icone className="size-4 text-roxo" aria-hidden="true" />
        {label}
      </button>
    </form>
  );
}

export function MenuAcoesAgendamento({
  agendamento,
  clienteFixoId,
  clientes,
  pacotes,
  profissionais,
  servicos,
}: {
  agendamento: AgendamentoFormulario & { status: StatusAgendamento };
  clienteFixoId?: string;
  clientes: Opcao[];
  pacotes: Opcao[];
  profissionais: Opcao[];
  servicos: Opcao[];
}) {
  const modalEdicao = useOverlayState();
  const modalExclusao = useOverlayState();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [state, formAction, pending] = useActionState(excluirAgendamento, estadoInicialExclusao);
  const { gatilhoRef, abrirParaCima } = usePosicaoMenuAcoes(menuAberto);

  useEffect(() => {
    if (state.status !== "sucesso") return;

    modalExclusao.close();
  }, [modalExclusao, state.status]);

  function fecharMenuAoPerderFoco(event: FocusEvent<HTMLDivElement>) {
    const proximoFoco = event.relatedTarget;

    if (proximoFoco instanceof Node && event.currentTarget.contains(proximoFoco)) return;

    setMenuAberto(false);
  }

  return (
    <>
      <div className="relative inline-flex" onBlur={fecharMenuAoPerderFoco} ref={gatilhoRef}>
        <button
          aria-expanded={menuAberto}
          aria-haspopup="menu"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-creme hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          onClick={() => setMenuAberto((aberto) => !aberto)}
          title="Ações do agendamento"
          type="button"
        >
          <Ellipsis className="size-5" aria-hidden="true" />
          <span className="sr-only">Abrir ações do agendamento</span>
        </button>

        {menuAberto ? (
          <div
            className={`absolute right-0 z-20 w-56 rounded-xl border border-border bg-surface p-1 shadow-md ${abrirParaCima ? "bottom-10" : "top-10"}`}
            role="menu"
          >
            <button
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              onClick={() => {
                setMenuAberto(false);
                modalEdicao.open();
              }}
              role="menuitem"
              type="button"
            >
              <Pencil className="size-4 text-roxo" aria-hidden="true" />
              Editar agendamento
            </button>

            {agendamento.status === "marcado" ? (
              <>
                <BotaoStatus
                  agendamentoId={agendamento.id}
                  clienteId={agendamento.clienteId}
                  fechar={() => setMenuAberto(false)}
                  icone={Check}
                  label="Marcar como realizado"
                  status="realizado"
                />
                <BotaoStatus
                  agendamentoId={agendamento.id}
                  clienteId={agendamento.clienteId}
                  fechar={() => setMenuAberto(false)}
                  icone={UserX}
                  label="Marcar falta"
                  status="falta"
                />
                <BotaoStatus
                  agendamentoId={agendamento.id}
                  clienteId={agendamento.clienteId}
                  fechar={() => setMenuAberto(false)}
                  icone={X}
                  label="Cancelar agendamento"
                  status="cancelado"
                />
              </>
            ) : null}

            <button
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-perigo transition hover:bg-perigo/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo"
              onClick={() => {
                setMenuAberto(false);
                setConfirmado(false);
                modalExclusao.open();
              }}
              role="menuitem"
              type="button"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Excluir agendamento
            </button>
          </div>
        ) : null}
      </div>

      <Modal state={modalEdicao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="lg">
            <ConteudoModal titulo="Editar agendamento">
              <FecharModalProvider value={modalEdicao.close}>
                <FormularioAgendamento
                  agendamento={agendamento}
                  clienteFixoId={clienteFixoId}
                  clientes={clientes}
                  pacotes={pacotes}
                  profissionais={profissionais}
                  servicos={servicos}
                />
              </FecharModalProvider>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalExclusao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo="text-perigo" titulo="Excluir agendamento">
              <form action={formAction} className="grid gap-4">
                <input name="id" type="hidden" value={agendamento.id} />
                <input name="clienteId" type="hidden" value={agendamento.clienteId} />
                <p className="text-sm text-foreground">
                  Você está prestes a excluir este agendamento. Sessões já registradas a partir dele
                  não são apagadas, só perdem esse vínculo.
                </p>
                <label className="flex items-start gap-3 rounded-xl bg-creme p-3 text-sm text-foreground">
                  <input
                    checked={confirmado}
                    className="mt-1 size-4 rounded border-border text-perigo focus:ring-perigo"
                    name="confirmarExclusao"
                    onChange={(event) => setConfirmado(event.target.checked)}
                    type="checkbox"
                    value="true"
                  />
                  <span>Entendo que a exclusão não pode ser desfeita.</span>
                </label>

                {state.status === "erro" && state.mensagem ? (
                  <p className="text-sm font-medium text-perigo" role="alert">
                    {state.mensagem}
                  </p>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                    onClick={() => {
                      setConfirmado(false);
                      modalExclusao.close();
                    }}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-perigo px-4 text-sm font-semibold text-white transition hover:bg-perigo/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!confirmado || pending}
                    type="submit"
                  >
                    {pending ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="size-4" aria-hidden="true" />
                    )}
                    Excluir definitivamente
                  </button>
                </div>
              </form>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
