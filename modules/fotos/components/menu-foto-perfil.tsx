"use client";

import { useActionState, useEffect, useId, useState, type ChangeEvent } from "react";
import { Modal, Popover, useOverlayState } from "@heroui/react";
import { Camera, Eye, ImageUp, LoaderCircle, X } from "lucide-react";

import { ConteudoModal, FecharModalProvider } from "@/components/ui/modal-formulario";
import type { EstadoFotoPerfil } from "@/modules/fotos/perfil-actions";

const estadoInicial: EstadoFotoPerfil = { status: "inicial" };

type AcaoFotoPerfil = (estado: EstadoFotoPerfil, formData: FormData) => Promise<EstadoFotoPerfil>;

export function MenuFotoPerfil({
  action,
  campoId,
  id,
  nome,
  rotaVisualizacao,
  tamanho = "md",
  temFoto,
  titulo,
}: {
  action: AcaoFotoPerfil;
  campoId: "clienteId" | "usuarioId";
  id: string;
  nome: string;
  rotaVisualizacao: string;
  tamanho?: "sm" | "md";
  temFoto: boolean;
  titulo: string;
}) {
  const modalVisualizacao = useOverlayState();
  const modalUpload = useOverlayState();
  const arquivoId = useId();
  const [menuAberto, setMenuAberto] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(action, estadoInicial);
  const botaoClasses = tamanho === "sm" ? "size-6 [&_svg]:size-3" : "size-8 [&_svg]:size-3.5";

  useEffect(() => {
    if (state.status !== "sucesso") return;

    modalUpload.close();
  }, [modalUpload, state.status]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function aoSelecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.currentTarget.files?.[0] ?? null;

    setPreview((previewAtual) => {
      if (previewAtual) URL.revokeObjectURL(previewAtual);

      return arquivo ? URL.createObjectURL(arquivo) : null;
    });
  }

  return (
    <>
      <div className="absolute -right-1 -bottom-1 z-10">
        <Popover isOpen={menuAberto} onOpenChange={setMenuAberto}>
          <Popover.Trigger
            className={`${botaoClasses} inline-flex items-center justify-center rounded-full border border-border bg-surface text-roxo shadow-sm transition hover:bg-roxo hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo`}
            title={`Foto de ${nome}`}
          >
            <Camera aria-hidden="true" />
            <span className="sr-only">Abrir opções de foto de {nome}</span>
          </Popover.Trigger>

          <Popover.Content placement="bottom end">
            <Popover.Dialog className="grid w-52 gap-1 p-1.5">
              {temFoto ? (
                <button
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                  onClick={() => {
                    setMenuAberto(false);
                    modalVisualizacao.open();
                  }}
                  type="button"
                >
                  <Eye className="size-4 text-roxo" aria-hidden="true" />
                  Ver foto
                </button>
              ) : (
                <p className="px-3 py-2 text-xs text-muted">Nenhuma foto enviada.</p>
              )}
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                onClick={() => {
                  setMenuAberto(false);
                  modalUpload.open();
                }}
                type="button"
              >
                <ImageUp className="size-4 text-roxo" aria-hidden="true" />
                Alterar imagem
              </button>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </div>

      {temFoto ? (
        <Modal state={modalVisualizacao}>
          <Modal.Backdrop variant="opaque">
            <Modal.Container className="w-[calc(100vw-2rem)] sm:w-full" size="lg">
              <ConteudoModal titulo={`Foto de ${nome}`}>
                <div className="grid h-[min(58vh,32rem)] min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4">
                  <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-2xl bg-creme">
                    {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada servida via rota autenticada, sem otimização estática do Next */}
                    <img
                      alt={`Foto de ${nome}`}
                      className="size-full object-contain"
                      src={rotaVisualizacao}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                      onClick={modalVisualizacao.close}
                      type="button"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </ConteudoModal>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ) : null}

      <Modal state={modalUpload}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal titulo={titulo}>
              <FecharModalProvider value={modalUpload.close}>
                <form action={formAction} className="grid gap-5">
                  <input name={campoId} type="hidden" value={id} />

                  <div className="flex items-center gap-3 rounded-2xl bg-lilas/15 p-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-roxo">
                      <Camera className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{nome}</p>
                      <p className="text-xs text-muted">JPEG, PNG ou WebP até 4MB</p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      id={arquivoId}
                      name="arquivo"
                      onChange={aoSelecionarArquivo}
                      required
                      type="file"
                    />
                    <label
                      className="group grid cursor-pointer gap-3 rounded-2xl border border-dashed border-roxo/30 bg-surface p-4 text-center transition hover:border-roxo hover:bg-lilas/10"
                      htmlFor={arquivoId}
                    >
                      <span className="mx-auto flex size-36 items-center justify-center overflow-hidden rounded-2xl bg-creme text-roxo">
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element -- preview local via object URL, sem otimização aplicável
                          <img
                            alt="Prévia da imagem selecionada"
                            className="size-full object-cover"
                            src={preview}
                          />
                        ) : (
                          <ImageUp className="size-8 transition group-hover:scale-105" />
                        )}
                      </span>
                      <span className="text-sm font-semibold text-brand">
                        {preview ? "Imagem selecionada" : "Selecionar imagem"}
                      </span>
                    </label>
                    {state?.campos?.arquivo?.length ? (
                      <p className="text-sm text-perigo">{state.campos.arquivo[0]}</p>
                    ) : null}
                  </div>

                  {state.status === "erro" && state.mensagem ? (
                    <p className="text-sm font-medium text-perigo" role="alert">
                      {state.mensagem}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                      onClick={() => {
                        modalUpload.close();
                        setPreview(null);
                      }}
                      type="button"
                    >
                      <X className="size-4" aria-hidden="true" />
                      Cancelar
                    </button>
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={pending}
                      type="submit"
                    >
                      {pending ? (
                        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <ImageUp className="size-4" aria-hidden="true" />
                      )}
                      Salvar foto
                    </button>
                  </div>
                </form>
              </FecharModalProvider>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
