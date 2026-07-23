"use client";

import { useActionState, useEffect, useState, type FocusEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import { ClipboardList, Ellipsis, Eye, FileText, LoaderCircle, Pencil, Trash2 } from "lucide-react";

import { usePosicaoMenuAcoes } from "@/components/ui/menu-acoes";
import { ConteudoModal } from "@/components/ui/modal-formulario";
import {
  editarFichaDinamica,
  excluirFicha,
  type EstadoExclusaoFicha,
} from "@/modules/fichas/actions";
import type { CampoModelo } from "@/modules/fichas/campos";
import {
  rotulosStatusFicha,
  rotulosTipoFicha,
  type StatusFicha,
  type TipoFicha,
} from "@/modules/fichas/schema";

import { DetalhesFichaDinamica } from "./detalhes-ficha-dinamica";
import { FormularioDinamico } from "./formulario-dinamico";

type ServicoOpcao = { id: string; nome: string };

export type ModeloResumo = { id: string; nome: string; campos: CampoModelo[] };

export type FichaLista = {
  id: string;
  clienteId: string;
  servicoId: string | null;
  modeloFichaId: string | null;
  tipo: TipoFicha | null;
  status: StatusFicha;
  versao: number;
  respostas: unknown | null;
  aceiteTermosEm: Date | null;
  autorizacaoImagemEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
};

const estadoInicialExclusao: EstadoExclusaoFicha = { status: "inicial" };

const classePorStatus: Record<StatusFicha, string> = {
  rascunho: "bg-creme text-muted",
  aguardando_cliente: "bg-dourado/15 text-dourado",
  preenchida: "bg-lilas/25 text-roxo",
  revisada: "bg-dourado/20 text-dourado",
  assinada: "bg-brand/15 text-brand",
};

const formatadorDataCurta = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
});

function respostasComoObjeto(ficha: FichaLista) {
  return ficha.respostas && typeof ficha.respostas === "object"
    ? (ficha.respostas as Record<string, unknown>)
    : null;
}

function tituloFicha(ficha: FichaLista, modelo: ModeloResumo | undefined) {
  if (modelo) return modelo.nome;
  if (ficha.tipo) return rotulosTipoFicha[ficha.tipo];

  return "Ficha";
}

/** Visualização de ficha legada (shape relato/avaliação/compartilhado) — fichas antigas. */
function DetalhesFichaLegada({ respostas }: { respostas: Record<string, unknown> }) {
  const secoes: Array<[string, string]> = [
    ["relato", "Relato do cliente"],
    ["avaliacaoProfissional", "Avaliação da profissional"],
    ["compartilhado", "Área compartilhada"],
  ];

  return (
    <div className="grid gap-4">
      {secoes.map(([chave, titulo]) => {
        const bloco = respostas[chave];
        const entradas =
          bloco && typeof bloco === "object"
            ? Object.entries(bloco as Record<string, unknown>).filter(
                ([, valor]) => valor !== null && valor !== undefined && valor !== "",
              )
            : [];

        return (
          <section
            className="grid gap-2 rounded-2xl border border-border bg-surface p-4"
            key={chave}
          >
            <h3 className="font-semibold text-roxo">{titulo}</h3>
            {entradas.length > 0 ? (
              <dl className="grid gap-2">
                {entradas.map(([campo, valor]) => (
                  <div className="grid gap-0.5" key={campo}>
                    <dt className="text-xs font-semibold text-muted">{campo}</dt>
                    <dd className="text-sm text-foreground">
                      {typeof valor === "boolean" ? (valor ? "Sim" : "Não") : String(valor)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted">Não informado.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ItemFicha({
  clienteNome,
  ficha,
  modelo,
  podeGerenciar,
  servicos,
}: {
  clienteNome: string;
  ficha: FichaLista;
  modelo: ModeloResumo | undefined;
  podeGerenciar: boolean;
  servicos: ServicoOpcao[];
}) {
  const router = useRouter();
  const modalVisualizacao = useOverlayState();
  const modalEdicao = useOverlayState();
  const modalExclusao = useOverlayState();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [state, formAction, pending] = useActionState(excluirFicha, estadoInicialExclusao);
  const { gatilhoRef, abrirParaCima } = usePosicaoMenuAcoes(menuAberto);
  const respostas = respostasComoObjeto(ficha);
  const podeVerDetalhes = podeGerenciar && Boolean(respostas);
  const podeEditar = podeVerDetalhes && Boolean(modelo);
  const titulo = tituloFicha(ficha, modelo);

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

  const conteudoLinha = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lilas/20 text-roxo transition group-hover:bg-roxo group-hover:text-white">
        <ClipboardList className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-foreground">{titulo}</span>
        <span className="mt-1 block text-sm text-muted">
          Criada em {formatadorDataCurta.format(ficha.criadoEm)} · v{ficha.versao}
          {podeVerDetalhes ? "" : " · conteúdo restrito à profissional"}
        </span>
      </span>
    </>
  );

  return (
    <li className="px-3 py-2 sm:px-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-transparent px-3 py-2 transition hover:border-roxo/15 hover:bg-lilas/10">
        {podeVerDetalhes ? (
          <button
            className="group flex min-w-0 items-center gap-4 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            onClick={modalVisualizacao.open}
            type="button"
          >
            {conteudoLinha}
          </button>
        ) : (
          <span className="group flex min-w-0 items-center gap-4">{conteudoLinha}</span>
        )}

        <span className="flex shrink-0 items-center gap-2">
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${classePorStatus[ficha.status]}`}
          >
            {rotulosStatusFicha[ficha.status]}
          </span>

          {podeGerenciar ? (
            <div className="relative inline-flex" onBlur={fecharMenuAoPerderFoco} ref={gatilhoRef}>
              <button
                aria-expanded={menuAberto}
                aria-haspopup="menu"
                className="inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-creme hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                onClick={() => setMenuAberto((aberto) => !aberto)}
                title={`Ações da ficha ${titulo}`}
                type="button"
              >
                <Ellipsis className="size-5" aria-hidden="true" />
                <span className="sr-only">Abrir ações da ficha {titulo}</span>
              </button>

              {menuAberto ? (
                <div
                  className={`absolute right-0 z-20 w-60 rounded-xl border border-border bg-surface p-1 shadow-md ${abrirParaCima ? "bottom-10" : "top-10"}`}
                  role="menu"
                >
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                    disabled={!podeVerDetalhes}
                    onClick={() => {
                      setMenuAberto(false);
                      modalVisualizacao.open();
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <Eye className="size-4 text-roxo" aria-hidden="true" />
                    Ver ficha
                  </button>
                  {podeEditar ? (
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
                      Editar ficha
                    </button>
                  ) : null}
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
                    Excluir ficha
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </span>
      </div>

      <Modal state={modalVisualizacao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-2rem)] sm:w-full" size="lg">
            <ConteudoModal titulo={`${titulo} · v${ficha.versao}`}>
              {respostas && modelo ? (
                <DetalhesFichaDinamica campos={modelo.campos} respostas={respostas} />
              ) : respostas ? (
                <DetalhesFichaLegada respostas={respostas} />
              ) : (
                <p className="rounded-2xl border border-border bg-creme p-4 text-sm text-muted">
                  O conteúdo desta ficha é restrito à profissional.
                </p>
              )}
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {modelo && respostas ? (
        <Modal state={modalEdicao}>
          <Modal.Backdrop variant="opaque">
            <Modal.Container className="w-[calc(100vw-2rem)] sm:w-full" size="lg">
              <ConteudoModal titulo={`Editar ${titulo}`}>
                <FormularioDinamico
                  aoEnviar={async ({ respostas: novasRespostas, servicoId }) => {
                    const resultado = await editarFichaDinamica({
                      id: ficha.id,
                      clienteId: ficha.clienteId,
                      modeloFichaId: modelo.id,
                      servicoId,
                      respostas: novasRespostas,
                    });

                    if (resultado.status === "sucesso") {
                      modalEdicao.close();
                      router.refresh();
                    }

                    return resultado;
                  }}
                  campos={modelo.campos}
                  rotuloEnviar="Salvar alterações"
                  servicoIdInicial={ficha.servicoId}
                  servicos={servicos}
                  valoresRespostas={respostas}
                />
              </ConteudoModal>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ) : null}

      <Modal state={modalExclusao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo="text-perigo" titulo="Excluir ficha">
              <form action={formAction} className="grid gap-4">
                <input name="fichaId" type="hidden" value={ficha.id} />
                <input name="clienteId" type="hidden" value={ficha.clienteId} />
                <p className="text-sm text-foreground">
                  Você está prestes a excluir a ficha {titulo} v{ficha.versao} de {clienteNome}.
                  Esta ação remove o registro do prontuário.
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
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </li>
  );
}

export function ListaFichas({
  clienteNome,
  fichas,
  modelos,
  podeGerenciar,
  servicos,
}: {
  clienteNome: string;
  fichas: FichaLista[];
  modelos: ModeloResumo[];
  podeGerenciar: boolean;
  servicos: ServicoOpcao[];
}) {
  const modelosPorId = new Map(modelos.map((modelo) => [modelo.id, modelo]));

  if (fichas.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-border bg-surface p-6 text-sm text-muted">
        <span className="bg-menta rounded-2xl p-3 text-brand">
          <FileText className="size-4" aria-hidden="true" />
        </span>
        Nenhuma ficha registrada.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="border-b border-border px-6 py-5">
        <h3 className="text-base font-semibold text-foreground">Fichas de anamnese</h3>
      </div>
      <ul className="divide-y divide-border">
        {fichas.map((ficha) => (
          <ItemFicha
            clienteNome={clienteNome}
            ficha={ficha}
            key={ficha.id}
            modelo={ficha.modeloFichaId ? modelosPorId.get(ficha.modeloFichaId) : undefined}
            podeGerenciar={podeGerenciar}
            servicos={servicos}
          />
        ))}
      </ul>
    </div>
  );
}
