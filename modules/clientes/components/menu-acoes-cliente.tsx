"use client";

import { useActionState, useEffect, useState, type FocusEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import { Ellipsis, Eye, LoaderCircle, Pencil, Trash2 } from "lucide-react";

import { usePosicaoMenuAcoes } from "@/components/ui/menu-acoes";
import {
  ConteudoModal,
  FecharModalProvider,
  ParteModalAnimada,
} from "@/components/ui/modal-formulario";
import { excluirCliente, type EstadoExclusaoCliente } from "@/modules/clientes/actions";

import { FormularioCliente, type ClienteFormulario } from "./formulario-cliente";

const estadoInicialExclusao: EstadoExclusaoCliente = { status: "inicial" };

export function MenuAcoesCliente({
  cliente,
  podeExcluir,
}: {
  cliente: ClienteFormulario;
  podeExcluir: boolean;
}) {
  const router = useRouter();
  const modalEdicao = useOverlayState();
  const modalExclusao = useOverlayState();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [state, formAction, pending] = useActionState(excluirCliente, estadoInicialExclusao);
  const { gatilhoRef, abrirParaCima } = usePosicaoMenuAcoes(menuAberto);

  useEffect(() => {
    if (state.status !== "sucesso") return;

    modalExclusao.close();
    router.refresh();
  }, [modalExclusao, router, state.status]);

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
          title={`Ações de ${cliente.nome}`}
          type="button"
        >
          <Ellipsis className="size-5" aria-hidden="true" />
          <span className="sr-only">Abrir ações de {cliente.nome}</span>
        </button>

        {menuAberto ? (
          <div
            className={`absolute right-0 z-20 w-56 rounded-xl border border-border bg-surface p-1 shadow-md ${abrirParaCima ? "bottom-10" : "top-10"}`}
            role="menu"
          >
            <Link
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              href={`/painel/clientes/${cliente.id}`}
              onClick={() => setMenuAberto(false)}
              role="menuitem"
            >
              <Eye className="size-4 text-roxo" aria-hidden="true" />
              Ver cadastro
            </Link>
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
              Atualizar cadastro
            </button>
            {podeExcluir ? (
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
                Excluir cliente
              </button>
            ) : (
              <p className="px-3 py-2 text-xs text-muted" role="note">
                Exclusão restrita ao perfil profissional.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <Modal state={modalEdicao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="lg">
            <ConteudoModal titulo="Atualizar cliente">
              <FecharModalProvider value={modalEdicao.close}>
                <FormularioCliente cliente={cliente} />
              </FecharModalProvider>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalExclusao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo="text-perigo" titulo="Excluir cliente">
              <form action={formAction} className="grid gap-4">
                <input name="clienteId" type="hidden" value={cliente.id} />
                <ParteModalAnimada ordem={2}>
                  <p className="text-sm text-foreground">
                    Você está prestes a excluir {cliente.nome}. Essa ação remove o cadastro e os
                    vínculos clínicos associados, incluindo agenda, sessões, fichas, medidas,
                    documentos, medicamentos, fotos, pacotes e biometria.
                  </p>
                </ParteModalAnimada>
                <ParteModalAnimada ordem={3}>
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
                </ParteModalAnimada>

                {state.status === "erro" && state.mensagem ? (
                  <p className="text-sm font-medium text-perigo" role="alert">
                    {state.mensagem}
                  </p>
                ) : null}

                <ParteModalAnimada ordem={4}>
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
                </ParteModalAnimada>
              </form>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
