"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Images,
  LoaderCircle,
  Maximize2,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

import { ModalDialogAnimado, ParteModalAnimada } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import { excluirFoto, type EstadoExclusaoFoto } from "@/modules/fotos/actions";

type FotoResumo = {
  id: string;
  regiao: string;
  dataFoto: Date;
  clienteId: string;
};

type Lightbox = {
  fotos: FotoResumo[];
  indice: number;
  regiao: string;
};

const estadoInicialExclusao: EstadoExclusaoFoto = { status: "inicial" };

const formatarData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" });

const classeCampoFiltro =
  "h-10 min-w-0 rounded-lg border border-border bg-surface px-3 text-sm font-normal text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20";

function agruparPorRegiao(fotos: FotoResumo[]) {
  const grupos = new Map<string, FotoResumo[]>();

  for (const foto of fotos) {
    const lista = grupos.get(foto.regiao) ?? [];
    lista.push(foto);
    grupos.set(foto.regiao, lista);
  }

  for (const lista of grupos.values()) {
    lista.sort((a, b) => a.dataFoto.getTime() - b.dataFoto.getTime());
  }

  return grupos;
}

function rotuloDoIndice(indice: number, total: number) {
  if (total < 2) return null;
  if (indice === 0) return "Antes";
  if (indice === total - 1) return "Atual";
  return null;
}

function EstadoVazio({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-border bg-surface p-6 text-sm text-muted">
      <span className="bg-menta rounded-2xl p-3 text-brand">
        <ImageOff className="size-4" aria-hidden="true" />
      </span>
      {texto}
    </div>
  );
}

function Visualizador({
  lightbox,
  onFechar,
  onNavegar,
  podeExcluir,
}: {
  lightbox: Lightbox;
  onFechar: () => void;
  onNavegar: (indice: number) => void;
  podeExcluir: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [state, formAction, pending] = useActionState(excluirFoto, estadoInicialExclusao);
  const { fotos, indice, regiao } = lightbox;
  const fotoAtual = fotos[indice];
  const rotulo = rotuloDoIndice(indice, fotos.length);

  useEffect(() => {
    if (state.status !== "sucesso") return;

    onFechar();
  }, [onFechar, state.status]);

  useEffect(() => {
    function aoTeclar(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (confirmando) setConfirmando(false);
        else onFechar();
        return;
      }
      if (confirmando) return;
      if (event.key === "ArrowLeft" && indice > 0) onNavegar(indice - 1);
      if (event.key === "ArrowRight" && indice < fotos.length - 1) onNavegar(indice + 1);
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [confirmando, fotos.length, indice, onFechar, onNavegar]);

  if (!fotoAtual) return null;

  return (
    <ModalDialogAnimado
      className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-4xl flex-col overflow-hidden rounded-3xl bg-surface"
      conteudoClassName="flex min-h-0 flex-1 flex-col"
    >
      <ParteModalAnimada className="shrink-0">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{regiao}</p>
            <p className="text-xs text-muted">
              {formatarData.format(fotoAtual.dataFoto)}
              {rotulo ? ` · ${rotulo}` : ""} · {indice + 1} de {fotos.length}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {podeExcluir ? (
              <button
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition hover:bg-perigo/10 hover:text-perigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo"
                onClick={() => setConfirmando((atual) => !atual)}
                title="Excluir foto"
                type="button"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                <span className="sr-only">Excluir foto</span>
              </button>
            ) : null}
            <button
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition hover:bg-creme hover:text-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              onClick={onFechar}
              title="Fechar"
              type="button"
            >
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>
        </div>
      </ParteModalAnimada>

      <ParteModalAnimada className="min-h-0 flex-1" ordem={1}>
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-creme/60 p-3">
          {!confirmando && indice > 0 ? (
            <button
              aria-label="Foto anterior"
              className="absolute left-3 inline-flex size-10 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-md transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              onClick={() => onNavegar(indice - 1)}
              type="button"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada servida via rota autenticada, sem otimização estática do Next */}
          <img
            alt={`${regiao} — ${formatarData.format(fotoAtual.dataFoto)}`}
            className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-sm"
            src={`/api/fotos/${fotoAtual.id}/imagem`}
          />

          {!confirmando && indice < fotos.length - 1 ? (
            <button
              aria-label="Próxima foto"
              className="absolute right-3 inline-flex size-10 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-md transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              onClick={() => onNavegar(indice + 1)}
              type="button"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          ) : null}

          {confirmando ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
              <form
                action={formAction}
                className="grid w-full max-w-sm gap-3 rounded-2xl bg-surface p-5 shadow-xl"
              >
                <input name="id" type="hidden" value={fotoAtual.id} />
                <input name="clienteId" type="hidden" value={fotoAtual.clienteId} />
                <input name="confirmarExclusao" type="hidden" value="true" />
                <p className="text-sm font-semibold text-foreground">Excluir esta foto?</p>
                <p className="text-sm text-muted">Essa ação não pode ser desfeita.</p>
                {state.status === "erro" && state.mensagem ? (
                  <p className="text-sm font-medium text-perigo" role="alert">
                    {state.mensagem}
                  </p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <button
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                    onClick={() => setConfirmando(false)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-perigo px-3 text-sm font-semibold text-white transition hover:bg-perigo/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={pending}
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
            </div>
          ) : null}
        </div>
      </ParteModalAnimada>
    </ModalDialogAnimado>
  );
}

export function GaleriaFotos({
  fotos,
  podeExcluir = false,
}: {
  fotos: FotoResumo[];
  podeExcluir?: boolean;
}) {
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);
  const [regiaoFiltro, setRegiaoFiltro] = useState("");
  const [dataInicioFiltro, setDataInicioFiltro] = useState("");
  const [dataFimFiltro, setDataFimFiltro] = useState("");
  const lightboxState = useOverlayState({
    onOpenChange: (aberto) => {
      if (!aberto) setLightbox(null);
    },
  });

  if (fotos.length === 0) {
    return <EstadoVazio texto="Nenhuma foto registrada ainda." />;
  }

  const regioesDisponiveis = [...new Set(fotos.map((item) => item.regiao))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

  const filtroAtivo = Boolean(regiaoFiltro || dataInicioFiltro || dataFimFiltro);

  const fotosFiltradas = fotos.filter((item) => {
    if (regiaoFiltro && item.regiao !== regiaoFiltro) return false;
    if (dataInicioFiltro && item.dataFoto < new Date(`${dataInicioFiltro}T00:00:00Z`)) return false;
    if (dataFimFiltro && item.dataFoto > new Date(`${dataFimFiltro}T23:59:59Z`)) return false;
    return true;
  });

  const grupos = agruparPorRegiao(fotosFiltradas);

  function abrirLightbox(fotosRegiao: FotoResumo[], indice: number, regiao: string) {
    setLightbox({ fotos: fotosRegiao, indice, regiao });
    lightboxState.open();
  }

  function limparFiltros() {
    setRegiaoFiltro("");
    setDataInicioFiltro("");
    setDataFimFiltro("");
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <SlidersHorizontal className="size-4 text-roxo" aria-hidden="true" />
            Filtrar fotos
          </div>
          <span className="text-xs text-muted">
            {fotosFiltradas.length} de {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1.5 text-xs font-medium text-muted">
            Região
            <select
              className={classeCampoFiltro}
              onChange={(event) => setRegiaoFiltro(event.target.value)}
              value={regiaoFiltro}
            >
              <option value="">Todas as regiões</option>
              {regioesDisponiveis.map((regiao) => (
                <option key={regiao} value={regiao}>
                  {regiao}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-muted">
            De
            <input
              className={classeCampoFiltro}
              onChange={(event) => setDataInicioFiltro(event.target.value)}
              type="date"
              value={dataInicioFiltro}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-muted">
            Até
            <input
              className={classeCampoFiltro}
              onChange={(event) => setDataFimFiltro(event.target.value)}
              type="date"
              value={dataFimFiltro}
            />
          </label>
          <div className="flex items-end">
            <button
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!filtroAtivo}
              onClick={limparFiltros}
              type="button"
            >
              <X className="size-4" aria-hidden="true" />
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {grupos.size === 0 ? (
        <EstadoVazio texto="Nenhuma foto encontrada para os filtros selecionados." />
      ) : (
        [...grupos.entries()].map(([regiao, itens]) => (
          <div key={regiao} className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-lilas/25 text-roxo">
                  <Images className="size-3.5" aria-hidden="true" />
                </span>
                {regiao}
              </h3>
              <span className="text-xs font-medium text-muted">
                {itens.length} {itens.length === 1 ? "foto" : "fotos"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {itens.map((item, indice) => {
                const rotulo = rotuloDoIndice(indice, itens.length);

                return (
                  <button
                    className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-creme transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                    key={item.id}
                    onClick={() => abrirLightbox(itens, indice, regiao)}
                    type="button"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada servida via rota autenticada, sem otimização estática do Next */}
                    <img
                      alt={`${regiao} — ${formatarData.format(item.dataFoto)}`}
                      className="size-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                      src={`/api/fotos/${item.id}/imagem`}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/65 via-black/0 to-transparent opacity-0 transition group-hover:opacity-100" />
                    <Maximize2
                      className="pointer-events-none absolute inset-0 m-auto size-5 text-white opacity-0 drop-shadow transition group-hover:opacity-100"
                      aria-hidden="true"
                    />
                    {rotulo ? (
                      <span
                        className={cn(
                          "absolute top-1.5 left-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          rotulo === "Antes"
                            ? "bg-surface/90 text-muted"
                            : "bg-brand text-brand-foreground",
                        )}
                      >
                        {rotulo}
                      </span>
                    ) : null}
                    <span className="pointer-events-none absolute right-1.5 bottom-1.5 left-1.5 truncate text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                      {formatarData.format(item.dataFoto)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}

      {lightbox ? (
        <Modal state={lightboxState}>
          <Modal.Backdrop variant="opaque">
            <Modal.Container className="w-[calc(100vw-2rem)] sm:w-full" size="lg">
              <Visualizador
                lightbox={lightbox}
                onFechar={lightboxState.close}
                onNavegar={(indice) =>
                  setLightbox((atual) => (atual ? { ...atual, indice } : atual))
                }
                podeExcluir={podeExcluir}
              />
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ) : null}
    </div>
  );
}
