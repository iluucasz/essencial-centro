"use client";

import { useActionState } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";
import { Modal, useOverlayState } from "@heroui/react";

import { ConteudoModal } from "@/components/ui/modal-formulario";
import { CredenciaisGeradas } from "@/modules/auth/components/credenciais-geradas";

import { gerarAcessoPortalCliente, type EstadoAcessoPortal } from "../actions";

/**
 * Cria o acesso ao portal de um cliente que ainda não tem — cadastro feito antes deste fluxo, ou cujo
 * e-mail entrou depois. Sem usuário vinculado, o cliente não recebe WhatsApp nem lembrete algum.
 */
export function BotaoAcessoPortal({
  clienteId,
  clienteNome,
}: {
  clienteId: string;
  clienteNome: string;
}) {
  const modal = useOverlayState();
  const [estado, gerar, pendente] = useActionState<EstadoAcessoPortal, FormData>(
    gerarAcessoPortalCliente,
    { status: "inicial" },
  );

  return (
    <>
      <button
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        onClick={modal.open}
        type="button"
      >
        <KeyRound className="size-3.5 text-roxo" aria-hidden="true" />
        Criar acesso ao portal
      </button>

      <Modal state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo="text-brand" titulo="Acesso ao portal">
              {estado.status === "sucesso" && estado.acessoPortal ? (
                <div className="grid gap-5">
                  <CredenciaisGeradas
                    email={estado.acessoPortal.email}
                    nomeCliente={clienteNome}
                    senhaProvisoria={estado.acessoPortal.senhaProvisoria}
                    whatsappEnviado={estado.acessoPortal.whatsappEnviado}
                  />
                  <button
                    className="inline-flex h-11 items-center justify-center justify-self-end rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90"
                    onClick={modal.close}
                    type="button"
                  >
                    {estado.acessoPortal.whatsappEnviado ? "Concluir" : "Já guardei, concluir"}
                  </button>
                </div>
              ) : (
                <form action={gerar} className="grid gap-4">
                  <input name="clienteId" type="hidden" value={clienteId} />
                  <p className="text-sm text-muted">
                    Vamos criar o login de{" "}
                    <strong className="text-foreground">{clienteNome}</strong> com o e-mail do
                    cadastro e uma senha provisória. Na primeira entrada, o cliente define a senha
                    dele.
                  </p>

                  {estado.status === "erro" && estado.mensagem ? (
                    <p
                      className="rounded-xl bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
                      role="alert"
                    >
                      {estado.mensagem}
                    </p>
                  ) : null}

                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 justify-self-end rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={pendente}
                    type="submit"
                  >
                    {pendente ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <KeyRound className="size-4" aria-hidden="true" />
                    )}
                    Gerar acesso
                  </button>
                </form>
              )}
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
