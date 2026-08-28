"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { LoaderCircle, Pencil, Plus, Save, Trash2 } from "lucide-react";

import {
  ConteudoModal,
  FecharModalProvider,
  ModalFormulario,
  ParteModalAnimada,
  useFecharModal,
} from "@/components/ui/modal-formulario";
import {
  excluirMensagemPredefinida,
  salvarMensagemPredefinida,
  type EstadoMensagemPredefinida,
} from "@/modules/whatsapp/actions";
import type { MensagemPredefinida } from "@/modules/whatsapp/schema";

const estadoInicial: EstadoMensagemPredefinida = { status: "inicial" };

function FormularioMensagemPredefinida({ mensagem }: { mensagem?: MensagemPredefinida }) {
  const [estado, formAction, pendente] = useActionState(salvarMensagemPredefinida, estadoInicial);
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (estado.status === "sucesso") fecharModal();
  }, [estado.status, fecharModal]);

  return (
    <form action={formAction} className="grid gap-4">
      {mensagem ? <input name="id" type="hidden" value={mensagem.id} /> : null}

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="titulo">
          Título
        </label>
        <input
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          defaultValue={mensagem?.titulo}
          id="titulo"
          name="titulo"
          placeholder="Ex.: Promoção do mês"
          required
        />
        {estado.campos?.titulo ? (
          <p className="text-xs text-perigo">{estado.campos.titulo[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="conteudo">
          Mensagem
        </label>
        <textarea
          className="min-h-32 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          defaultValue={mensagem?.conteudo}
          id="conteudo"
          maxLength={1000}
          name="conteudo"
          placeholder="Ex.: Olá, {nome}! Este mês temos uma condição especial pra você..."
          required
        />
        <p className="text-xs text-muted">
          Use <code className="rounded bg-creme px-1">{"{nome}"}</code> onde quiser que apareça o
          primeiro nome do cliente.
        </p>
        {estado.campos?.conteudo ? (
          <p className="text-xs text-perigo">{estado.campos.conteudo[0]}</p>
        ) : null}
      </div>

      {estado.status === "erro" && estado.mensagem ? (
        <p
          className="rounded-xl bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          {estado.mensagem}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pendente}
          type="submit"
        >
          {pendente ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" />
          )}
          Salvar
        </button>
      </div>
    </form>
  );
}

function CartaoMensagemPredefinida({ mensagem }: { mensagem: MensagemPredefinida }) {
  const modalEdicao = useOverlayState();
  const modalExclusao = useOverlayState();
  const [excluindo, setExcluindo] = useState(false);

  async function confirmarExclusao() {
    setExcluindo(true);
    await excluirMensagemPredefinida(mensagem.id);
    setExcluindo(false);
    modalExclusao.close();
  }

  return (
    <li className="grid gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 font-medium text-foreground">{mensagem.titulo}</p>
        <span className="flex shrink-0 items-center gap-1">
          <button
            aria-label={`Editar ${mensagem.titulo}`}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-creme hover:text-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            onClick={modalEdicao.open}
            type="button"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          <button
            aria-label={`Excluir ${mensagem.titulo}`}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-perigo/10 hover:text-perigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo"
            onClick={modalExclusao.open}
            type="button"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </span>
      </div>
      <p className="line-clamp-2 text-sm break-words text-muted">{mensagem.conteudo}</p>

      <Modal state={modalEdicao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="lg">
            <ConteudoModal titulo="Editar mensagem predefinida">
              <FecharModalProvider value={modalEdicao.close}>
                <FormularioMensagemPredefinida mensagem={mensagem} />
              </FecharModalProvider>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalExclusao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo="text-perigo" titulo="Excluir mensagem predefinida">
              <div className="grid gap-4">
                <ParteModalAnimada ordem={2}>
                  <p className="text-sm text-foreground">
                    Excluir <strong>{mensagem.titulo}</strong>? Campanhas já enviadas com ela
                    continuam no histórico normalmente.
                  </p>
                </ParteModalAnimada>
                <ParteModalAnimada ordem={3}>
                  <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                    <button
                      className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:w-auto"
                      onClick={modalExclusao.close}
                      type="button"
                    >
                      Cancelar
                    </button>
                    <button
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-perigo px-4 text-sm font-semibold text-white transition hover:bg-perigo/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      disabled={excluindo}
                      onClick={confirmarExclusao}
                      type="button"
                    >
                      {excluindo ? (
                        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="size-4" aria-hidden="true" />
                      )}
                      Excluir
                    </button>
                  </div>
                </ParteModalAnimada>
              </div>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </li>
  );
}

export function MensagensPredefinidas({ mensagens }: { mensagens: MensagemPredefinida[] }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Modelos reaproveitáveis pra usar na hora de montar um envio.
        </p>
        <ModalFormulario
          icone={<Plus className="size-4" aria-hidden />}
          rotuloBotao="Nova mensagem"
          titulo="Nova mensagem predefinida"
        >
          <FormularioMensagemPredefinida />
        </ModalFormulario>
      </div>

      {mensagens.length === 0 ? (
        <p className="rounded-xl border border-border bg-creme/40 p-4 text-sm text-muted">
          Nenhuma mensagem predefinida ainda. Crie uma pra reutilizar nos envios.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mensagens.map((mensagem) => (
            <CartaoMensagemPredefinida key={mensagem.id} mensagem={mensagem} />
          ))}
        </ul>
      )}
    </div>
  );
}
