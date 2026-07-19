"use client";

import { useActionState, useEffect, useMemo, useState, type FocusEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import { Ellipsis, Eye, LoaderCircle, Pencil, Ruler, Trash2, XCircle } from "lucide-react";

import { usePosicaoMenuAcoes } from "@/components/ui/menu-acoes";
import { ConteudoModal, FecharModalProvider } from "@/components/ui/modal-formulario";
import { excluirMedida, type EstadoExclusaoMedida } from "@/modules/medidas/actions";
import {
  rotulosLadoMedida,
  rotulosRegiaoMedida,
  type LadoMedida,
  type RegiaoMedida,
} from "@/modules/medidas/schema";

import { FormularioMedida, type MedidaFormulario } from "./formulario-medida";

type Opcao = { id: string; nome: string };

export type MedidaLista = MedidaFormulario & {
  criadoPorId: string;
  criadoEm: Date;
};

const estadoInicialExclusao: EstadoExclusaoMedida = { status: "inicial" };

const formatadorDataCurta = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
});
const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatarCm(valor: number) {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} cm`;
}

function rotuloMedida(regiao: RegiaoMedida, lado: LadoMedida | null) {
  return lado
    ? `${rotulosRegiaoMedida[regiao]} (${rotulosLadoMedida[lado]})`
    : rotulosRegiaoMedida[regiao];
}

function nomeSessao(sessoes: Opcao[], sessaoId: string | null) {
  if (!sessaoId) return "Sem vínculo";

  return sessoes.find((sessao) => sessao.id === sessaoId)?.nome ?? "Sessão não encontrada";
}

function CampoDetalhe({ label, valor }: { label: string; valor: string | number | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">
        {valor === null || valor === "" ? "Não informado" : valor}
      </dd>
    </div>
  );
}

function DetalhesMedida({ medida, sessoes }: { medida: MedidaLista; sessoes: Opcao[] }) {
  return (
    <dl className="grid gap-3 rounded-2xl bg-creme p-4 sm:grid-cols-2">
      <CampoDetalhe label="Região" valor={rotulosRegiaoMedida[medida.regiao]} />
      <CampoDetalhe label="Lado" valor={medida.lado ? rotulosLadoMedida[medida.lado] : null} />
      <CampoDetalhe label="Medida" valor={formatarCm(medida.valorCm)} />
      <CampoDetalhe
        label="Data da medição"
        valor={formatadorDataCurta.format(medida.dataMedicao)}
      />
      <CampoDetalhe label="Sessão vinculada" valor={nomeSessao(sessoes, medida.sessaoId)} />
      <CampoDetalhe label="Registrada em" valor={formatadorDataHora.format(medida.criadoEm)} />
    </dl>
  );
}

function ItemMedida({ medida, sessoes }: { medida: MedidaLista; sessoes: Opcao[] }) {
  const router = useRouter();
  const modalVisualizacao = useOverlayState();
  const modalEdicao = useOverlayState();
  const modalExclusao = useOverlayState();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [state, formAction, pending] = useActionState(excluirMedida, estadoInicialExclusao);
  const { gatilhoRef, abrirParaCima } = usePosicaoMenuAcoes(menuAberto);
  const titulo = rotuloMedida(medida.regiao, medida.lado);

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
    <li className="px-3 py-3 sm:px-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <button
          className="flex min-w-0 items-center gap-4 rounded-2xl px-3 py-2 text-left transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          onClick={modalVisualizacao.open}
          type="button"
        >
          <span className="bg-menta flex size-12 shrink-0 items-center justify-center rounded-2xl text-brand">
            <Ruler className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-foreground">{titulo}</span>
            <span className="mt-1 block text-sm text-muted">
              {formatadorDataCurta.format(medida.dataMedicao)} ·{" "}
              {nomeSessao(sessoes, medida.sessaoId)}
            </span>
          </span>
        </button>

        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand">
            {formatarCm(medida.valorCm)}
          </span>

          <div className="relative inline-flex" onBlur={fecharMenuAoPerderFoco} ref={gatilhoRef}>
            <button
              aria-expanded={menuAberto}
              aria-haspopup="menu"
              className="inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-creme hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              onClick={() => setMenuAberto((aberto) => !aberto)}
              title={`Ações da medida ${titulo}`}
              type="button"
            >
              <Ellipsis className="size-5" aria-hidden="true" />
              <span className="sr-only">Abrir ações da medida {titulo}</span>
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
                    modalVisualizacao.open();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Eye className="size-4 text-roxo" aria-hidden="true" />
                  Ver medida
                </button>
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
                  Editar medida
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
                  Excluir medida
                </button>
              </div>
            ) : null}
          </div>
        </span>
      </div>

      <Modal state={modalVisualizacao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
            <ConteudoModal titulo={titulo}>
              <DetalhesMedida medida={medida} sessoes={sessoes} />
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalEdicao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
            <ConteudoModal titulo={`Editar ${titulo}`}>
              <FecharModalProvider value={modalEdicao.close}>
                <FormularioMedida clienteId={medida.clienteId} medida={medida} sessoes={sessoes} />
              </FecharModalProvider>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalExclusao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo="text-perigo" titulo="Excluir medida">
              <form action={formAction} className="grid gap-4">
                <input name="id" type="hidden" value={medida.id} />
                <input name="clienteId" type="hidden" value={medida.clienteId} />
                <p className="text-sm text-foreground">
                  Você está prestes a excluir a medida de {titulo}. Esta ação remove o registro do
                  histórico.
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
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                    onClick={() => {
                      setConfirmado(false);
                      modalExclusao.close();
                    }}
                    type="button"
                  >
                    <XCircle className="size-4" aria-hidden="true" />
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
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </li>
  );
}

export function HistoricoMedidas({
  medidas,
  sessoes,
}: {
  medidas: MedidaLista[];
  sessoes: Opcao[];
}) {
  const medidasOrdenadas = useMemo(
    () => [...medidas].sort((a, b) => b.dataMedicao.getTime() - a.dataMedicao.getTime()),
    [medidas],
  );

  if (medidasOrdenadas.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-border bg-surface p-6 text-sm text-muted">
        <span className="bg-menta rounded-2xl p-3 text-brand">
          <Ruler className="size-4" aria-hidden="true" />
        </span>
        Nenhuma medida registrada.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="border-b border-border px-6 py-5">
        <h3 className="text-base font-semibold text-foreground">Histórico completo de medidas</h3>
      </div>
      <ul className="divide-y divide-border">
        {medidasOrdenadas.map((medida) => (
          <ItemMedida key={medida.id} medida={medida} sessoes={sessoes} />
        ))}
      </ul>
    </div>
  );
}
