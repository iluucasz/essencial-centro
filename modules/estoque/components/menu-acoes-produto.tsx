"use client";

import { useActionState, useEffect, useState, type FocusEvent } from "react";
import Link from "next/link";
import { Modal, useOverlayState } from "@heroui/react";
import { Ellipsis, Eye, LoaderCircle, Pencil, Trash2 } from "lucide-react";

import {
  FecharModalProvider,
  ModalDialogAnimado,
  ParteModalAnimada,
} from "@/components/ui/modal-formulario";
import { excluirProduto, type EstadoExclusaoEstoque } from "@/modules/estoque/actions";

import { FormularioProduto, type ProdutoFormulario } from "./formulario-produto";

const estadoInicialExclusao: EstadoExclusaoEstoque = { status: "inicial" };

export function MenuAcoesProduto({ produto }: { produto: ProdutoFormulario }) {
  const modalEdicao = useOverlayState();
  const modalExclusao = useOverlayState();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [state, formAction, pending] = useActionState(excluirProduto, estadoInicialExclusao);

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
      <div className="relative inline-flex" onBlur={fecharMenuAoPerderFoco}>
        <button
          aria-expanded={menuAberto}
          aria-haspopup="menu"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-creme hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          onClick={() => setMenuAberto((aberto) => !aberto)}
          title={`Ações de ${produto.nome}`}
          type="button"
        >
          <Ellipsis className="size-5" aria-hidden="true" />
          <span className="sr-only">Abrir ações de {produto.nome}</span>
        </button>

        {menuAberto ? (
          <div
            className="absolute top-10 right-0 z-20 w-56 rounded-xl border border-border bg-surface p-1 shadow-md"
            role="menu"
          >
            <Link
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              href={`/painel/estoque/${produto.id}`}
              onClick={() => setMenuAberto(false)}
              role="menuitem"
            >
              <Eye className="size-4 text-roxo" aria-hidden="true" />
              Ver lotes
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
              Editar produto
            </button>
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
              Excluir produto
            </button>
          </div>
        ) : null}
      </div>

      <Modal state={modalEdicao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="lg">
            <ModalDialogAnimado className="max-h-[85vh] overflow-y-auto">
              <ParteModalAnimada>
                <Modal.Header>
                  <Modal.Heading className="text-lg font-semibold text-brand">
                    Editar produto
                  </Modal.Heading>
                </Modal.Header>
              </ParteModalAnimada>
              <Modal.CloseTrigger />
              <ParteModalAnimada ordem={1}>
                <Modal.Body>
                  <FecharModalProvider value={modalEdicao.close}>
                    <FormularioProduto produto={produto} />
                  </FecharModalProvider>
                </Modal.Body>
              </ParteModalAnimada>
            </ModalDialogAnimado>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalExclusao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ModalDialogAnimado>
              <ParteModalAnimada>
                <Modal.Header>
                  <Modal.Heading className="text-lg font-semibold text-perigo">
                    Excluir produto
                  </Modal.Heading>
                </Modal.Header>
              </ParteModalAnimada>
              <Modal.CloseTrigger />
              <ParteModalAnimada ordem={1}>
                <Modal.Body>
                  <form action={formAction} className="grid gap-4">
                    <input name="produtoId" type="hidden" value={produto.id} />
                    <p className="text-sm text-foreground">
                      Você está prestes a excluir {produto.nome}. Se houver lotes ou movimentações
                      vinculadas, a exclusão será bloqueada.
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
                </Modal.Body>
              </ParteModalAnimada>
            </ModalDialogAnimado>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
