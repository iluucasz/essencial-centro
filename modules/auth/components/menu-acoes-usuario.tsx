"use client";

import { useActionState, useEffect, useState, type FocusEvent } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { Ellipsis, LoaderCircle, Pencil, Trash2, UserCheck, UserX } from "lucide-react";

import { usePosicaoMenuAcoes } from "@/components/ui/menu-acoes";
import {
  ConteudoModal,
  FecharModalProvider,
  ParteModalAnimada,
} from "@/components/ui/modal-formulario";
import {
  alternarAtivoUsuario,
  excluirUsuario,
  type EstadoFormularioAuth,
} from "@/modules/auth/actions";
import { podeExcluirUsuario } from "@/modules/auth/gestao";

import { FormularioUsuario, type UsuarioFormulario } from "./formulario-usuario";

const estadoInicial: EstadoFormularioAuth = { status: "inicial" };

function ModalAlternarAtivo({
  fechar,
  state,
  usuario,
}: {
  fechar: () => void;
  state: ReturnType<typeof useOverlayState>;
  usuario: UsuarioFormulario & { ativo: boolean };
}) {
  const [estado, enviar, pendente] = useActionState(alternarAtivoUsuario, estadoInicial);

  useEffect(() => {
    if (estado.status === "sucesso") fechar();
  }, [estado.status, fechar]);

  return (
    <Modal state={state}>
      <Modal.Backdrop variant="opaque">
        <Modal.Container size="sm">
          <ConteudoModal
            corTitulo={usuario.ativo ? "text-perigo" : "text-brand"}
            titulo={usuario.ativo ? "Desativar usuário" : "Ativar usuário"}
          >
            <form action={enviar} className="grid gap-4">
              <input name="id" type="hidden" value={usuario.id} />
              <input name="ativoAtual" type="hidden" value={String(usuario.ativo)} />

              <ParteModalAnimada ordem={2}>
                <p className="text-sm text-foreground">
                  {usuario.ativo ? (
                    <>
                      <strong>{usuario.nome}</strong> perde o acesso ao painel/portal imediatamente.
                      O cadastro e o histórico continuam intactos — você pode reativar quando
                      quiser.
                    </>
                  ) : (
                    <>
                      <strong>{usuario.nome}</strong> volta a poder entrar com o e-mail e a senha de
                      sempre.
                    </>
                  )}
                </p>
              </ParteModalAnimada>

              {estado.status === "erro" && estado.mensagem ? (
                <p className="text-sm font-medium text-perigo" role="alert">
                  {estado.mensagem}
                </p>
              ) : null}

              <ParteModalAnimada ordem={3}>
                <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                  <button
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:w-auto"
                    onClick={fechar}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
                      usuario.ativo
                        ? "bg-perigo hover:bg-perigo/90 focus-visible:outline-perigo"
                        : "bg-brand hover:bg-brand/90 focus-visible:outline-brand"
                    }`}
                    disabled={pendente}
                    type="submit"
                  >
                    {pendente ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : usuario.ativo ? (
                      <UserX className="size-4" aria-hidden="true" />
                    ) : (
                      <UserCheck className="size-4" aria-hidden="true" />
                    )}
                    {usuario.ativo ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </ParteModalAnimada>
            </form>
          </ConteudoModal>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function ModalExcluirUsuario({
  fechar,
  state,
  usuario,
}: {
  fechar: () => void;
  state: ReturnType<typeof useOverlayState>;
  usuario: UsuarioFormulario;
}) {
  const [estado, enviar, pendente] = useActionState(excluirUsuario, estadoInicial);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    if (estado.status === "sucesso") fechar();
  }, [estado.status, fechar]);

  return (
    <Modal state={state}>
      <Modal.Backdrop variant="opaque">
        <Modal.Container size="sm">
          <ConteudoModal corTitulo="text-perigo" titulo="Excluir acesso ao portal">
            <form action={enviar} className="grid gap-4">
              <input name="id" type="hidden" value={usuario.id} />
              <ParteModalAnimada ordem={2}>
                <p className="text-sm text-foreground">
                  Você está prestes a excluir o login de <strong>{usuario.nome}</strong>. O cadastro
                  clínico não é afetado — só o acesso dele ao portal é removido. Pra entrar de novo,
                  será preciso gerar um acesso novo.
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

              {estado.status === "erro" && estado.mensagem ? (
                <p className="text-sm font-medium text-perigo" role="alert">
                  {estado.mensagem}
                </p>
              ) : null}

              <ParteModalAnimada ordem={4}>
                <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                  <button
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:w-auto"
                    onClick={() => {
                      setConfirmado(false);
                      fechar();
                    }}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-perigo px-4 text-sm font-semibold text-white transition hover:bg-perigo/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    disabled={!confirmado || pendente}
                    type="submit"
                  >
                    {pendente ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="size-4" aria-hidden="true" />
                    )}
                    Excluir
                  </button>
                </div>
              </ParteModalAnimada>
            </form>
          </ConteudoModal>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

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
  const modalStatus = useOverlayState();
  const modalExclusao = useOverlayState();
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
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                onClick={() => {
                  setMenuAberto(false);
                  modalStatus.open();
                }}
                role="menuitem"
                type="button"
              >
                {usuario.ativo ? (
                  <UserX className="size-4 text-perigo" aria-hidden="true" />
                ) : (
                  <UserCheck className="size-4 text-roxo" aria-hidden="true" />
                )}
                {usuario.ativo ? "Desativar usuário" : "Ativar usuário"}
              </button>
            )}

            {ehUsuarioAtual || !podeExcluirUsuario(usuario.role) ? null : (
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-perigo transition hover:bg-perigo/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo"
                onClick={() => {
                  setMenuAberto(false);
                  modalExclusao.open();
                }}
                role="menuitem"
                type="button"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Excluir acesso
              </button>
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

      {ehUsuarioAtual ? null : (
        <ModalAlternarAtivo fechar={modalStatus.close} state={modalStatus} usuario={usuario} />
      )}

      {ehUsuarioAtual || !podeExcluirUsuario(usuario.role) ? null : (
        <ModalExcluirUsuario fechar={modalExclusao.close} state={modalExclusao} usuario={usuario} />
      )}
    </>
  );
}
