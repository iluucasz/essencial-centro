"use client";

import { useState, type FocusEvent } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { Ellipsis, Pencil, UserCheck, UserX } from "lucide-react";

import { usePosicaoMenuAcoes } from "@/components/ui/menu-acoes";
import { ConteudoModal, FecharModalProvider } from "@/components/ui/modal-formulario";
import { alternarAtivoUsuario } from "@/modules/auth/actions";

import { FormularioUsuario, type UsuarioFormulario } from "./formulario-usuario";

export function MenuAcoesUsuario({
  clientes,
  usuario,
  usuarioAtualId,
}: {
  clientes: { id: string; nome: string }[];
  usuario: UsuarioFormulario & { ativo: boolean };
  usuarioAtualId: string;
}) {
  const modalEdicao = useOverlayState();
  const [menuAberto, setMenuAberto] = useState(false);
  const { gatilhoRef, abrirParaCima } = usePosicaoMenuAcoes(menuAberto);

  const ehUsuarioAtual = usuario.id === usuarioAtualId;

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
          title={`Ações de ${usuario.nome}`}
          type="button"
        >
          <Ellipsis className="size-5" aria-hidden="true" />
          <span className="sr-only">Abrir ações de {usuario.nome}</span>
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
              Editar usuário
            </button>

            {ehUsuarioAtual ? null : (
              <form action={alternarAtivoUsuario}>
                <input name="id" type="hidden" value={usuario.id} />
                <input name="ativoAtual" type="hidden" value={String(usuario.ativo)} />
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                  onClick={() => setMenuAberto(false)}
                  role="menuitem"
                  type="submit"
                >
                  {usuario.ativo ? (
                    <UserX className="size-4 text-perigo" aria-hidden="true" />
                  ) : (
                    <UserCheck className="size-4 text-roxo" aria-hidden="true" />
                  )}
                  {usuario.ativo ? "Desativar usuário" : "Ativar usuário"}
                </button>
              </form>
            )}
          </div>
        ) : null}
      </div>

      <Modal state={modalEdicao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="lg">
            <ConteudoModal titulo="Editar usuário">
              <FecharModalProvider value={modalEdicao.close}>
                <FormularioUsuario clientes={clientes} usuario={usuario} />
              </FecharModalProvider>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
