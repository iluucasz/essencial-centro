"use client";

import { useActionState, useEffect, useState, type FocusEvent } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { Ellipsis, LoaderCircle, Pencil, Power, PowerOff, Trash2 } from "lucide-react";

import { usePosicaoMenuAcoes } from "@/components/ui/menu-acoes";
import { ConteudoModal, FecharModalProvider } from "@/components/ui/modal-formulario";
import {
  alternarAtivoServico,
  excluirServico,
  type EstadoExclusaoServico,
} from "@/modules/servicos/actions";

import {
  FormularioServico,
  type OpcaoServicoResumo,
  type ServicoFormulario,
} from "./formulario-servico";

const estadoInicialExclusao: EstadoExclusaoServico = { status: "inicial" };

export function MenuAcoesServico({
  opcoesGrupo,
  opcoesPeriodicidade,
  servico,
}: {
  opcoesGrupo: OpcaoServicoResumo[];
  opcoesPeriodicidade: OpcaoServicoResumo[];
  servico: ServicoFormulario;
}) {
  const modalEdicao = useOverlayState();
  const modalExclusao = useOverlayState();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [state, formAction, pending] = useActionState(excluirServico, estadoInicialExclusao);
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
          title={`Ações de ${servico.nome}`}
          type="button"
        >
          <Ellipsis className="size-5" aria-hidden="true" />
          <span className="sr-only">Abrir ações de {servico.nome}</span>
        </button>

        {menuAberto ? (
          <div
            className={`absolute right-0 z-40 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-1 shadow-md ${abrirParaCima ? "bottom-10" : "top-10"}`}
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
              Editar serviço
            </button>
            <form action={alternarAtivoServico}>
              <input name="id" type="hidden" value={servico.id} />
              <input name="ativoAtual" type="hidden" value={String(servico.ativo)} />
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                onClick={() => setMenuAberto(false)}
                role="menuitem"
                type="submit"
              >
                {servico.ativo ? (
                  <PowerOff className="size-4 text-perigo" aria-hidden="true" />
                ) : (
                  <Power className="size-4 text-roxo" aria-hidden="true" />
                )}
                {servico.ativo ? "Desativar serviço" : "Ativar serviço"}
              </button>
            </form>
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
              Excluir serviço
            </button>
          </div>
        ) : null}
      </div>

      <Modal state={modalEdicao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
            <ConteudoModal titulo="Editar serviço">
              <FecharModalProvider value={modalEdicao.close}>
                <FormularioServico
                  opcoesGrupo={opcoesGrupo}
                  opcoesPeriodicidade={opcoesPeriodicidade}
                  servico={servico}
                />
              </FecharModalProvider>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalExclusao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="sm">
            <ConteudoModal corTitulo="text-perigo" titulo="Excluir serviço">
              <form action={formAction} className="grid gap-4">
                <input name="servicoId" type="hidden" value={servico.id} />
                <p className="text-sm text-foreground">
                  Você está prestes a excluir {servico.nome}. Se ele estiver vinculado a agenda,
                  pacotes ou sessões, a exclusão será bloqueada e você verá exatamente o que precisa
                  resolver antes.
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

                <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                  <button
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:w-auto"
                    onClick={() => {
                      setConfirmado(false);
                      modalExclusao.close();
                    }}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-perigo px-4 text-sm font-semibold text-white transition hover:bg-perigo/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
