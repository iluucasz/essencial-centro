"use client";

import { useActionState, useEffect, useState, type FocusEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import {
  ClipboardList,
  Ellipsis,
  LayoutTemplate,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { usePosicaoMenuAcoes } from "@/components/ui/menu-acoes";
import { ConteudoModal } from "@/components/ui/modal-formulario";
import { excluirModeloFicha, type EstadoExclusaoModelo } from "@/modules/fichas/modelos-actions";
import { campoEhInput, type CampoModelo } from "@/modules/fichas/campos";

import { ConstrutorModelo } from "./construtor-modelo";

export type ModeloAdmin = {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  campos: CampoModelo[];
};

const estadoInicialExclusao: EstadoExclusaoModelo = { status: "inicial" };

function BotaoNovoModelo() {
  const state = useOverlayState();

  return (
    <Modal state={state}>
      <Modal.Trigger className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo">
        <Plus className="size-4" aria-hidden />
        Criar modelo
      </Modal.Trigger>
      <Modal.Backdrop variant="opaque">
        <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
          <ConteudoModal titulo="Criar modelo de ficha">
            <ConstrutorModelo aposSucesso={state.close} />
          </ConteudoModal>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function ItemModelo({ modelo }: { modelo: ModeloAdmin }) {
  const router = useRouter();
  const modalEdicao = useOverlayState();
  const modalExclusao = useOverlayState();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [state, formAction, pending] = useActionState(excluirModeloFicha, estadoInicialExclusao);
  const { gatilhoRef, abrirParaCima } = usePosicaoMenuAcoes(menuAberto);
  const totalCampos = modelo.campos.filter((campo) => campoEhInput(campo.tipo)).length;

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
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lilas/20 text-roxo">
          <ClipboardList className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{modelo.nome}</p>
          <p className="mt-0.5 truncate text-sm text-muted">
            {totalCampos} campos{modelo.descricao ? ` · ${modelo.descricao}` : ""}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${modelo.ativo ? "bg-brand/15 text-brand" : "bg-creme text-muted"}`}
        >
          {modelo.ativo ? "Ativo" : "Inativo"}
        </span>

        <div className="relative inline-flex" onBlur={fecharMenuAoPerderFoco} ref={gatilhoRef}>
          <button
            aria-expanded={menuAberto}
            aria-haspopup="menu"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-creme hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            title={`Ações do modelo ${modelo.nome}`}
            type="button"
          >
            <Ellipsis className="size-5" aria-hidden />
          </button>

          {menuAberto ? (
            <div
              className={`absolute right-0 z-20 w-52 rounded-xl border border-border bg-surface p-1 shadow-md ${abrirParaCima ? "bottom-10" : "top-10"}`}
              role="menu"
            >
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-creme"
                onClick={() => {
                  setMenuAberto(false);
                  modalEdicao.open();
                }}
                role="menuitem"
                type="button"
              >
                <Pencil className="size-4 text-roxo" aria-hidden />
                Editar modelo
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-perigo transition hover:bg-perigo/10"
                onClick={() => {
                  setMenuAberto(false);
                  setConfirmado(false);
                  modalExclusao.open();
                }}
                role="menuitem"
                type="button"
              >
                <Trash2 className="size-4" aria-hidden />
                Excluir modelo
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <Modal state={modalEdicao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
            <ConteudoModal titulo={`Editar ${modelo.nome}`}>
              <ConstrutorModelo aposSucesso={modalEdicao.close} modelo={modelo} />
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalExclusao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo="text-perigo" titulo="Excluir modelo">
              <form action={formAction} className="grid gap-4">
                <input name="modeloId" type="hidden" value={modelo.id} />
                <p className="text-sm text-foreground">
                  Você está prestes a excluir o modelo {modelo.nome}. Modelos com fichas já
                  preenchidas não podem ser excluídos — desative-os.
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
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme"
                    onClick={() => {
                      setConfirmado(false);
                      modalExclusao.close();
                    }}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-perigo px-4 text-sm font-semibold text-white transition hover:bg-perigo/90 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!confirmado || pending}
                    type="submit"
                  >
                    {pending ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="size-4" aria-hidden />
                    )}
                    Excluir definitivamente
                  </button>
                </div>
              </form>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </li>
  );
}

export function ListaModelos({ modelos }: { modelos: ModeloAdmin[] }) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Modelos de ficha usados em &quot;Nova ficha&quot;. Todas as ações pedem confirmação.
        </p>
        <BotaoNovoModelo />
      </div>

      {modelos.length === 0 ? (
        <div className="flex items-center gap-3 rounded-3xl border border-border bg-surface p-6 text-sm text-muted">
          <span className="bg-menta rounded-2xl p-3 text-brand">
            <LayoutTemplate className="size-4" aria-hidden />
          </span>
          Nenhum modelo criado ainda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {modelos.map((modelo) => (
              <ItemModelo key={modelo.id} modelo={modelo} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
