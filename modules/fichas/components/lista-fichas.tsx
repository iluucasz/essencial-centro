"use client";

import { useActionState, useEffect, useState, type FocusEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import { ClipboardList, Ellipsis, Eye, FileText, LoaderCircle, Pencil, Trash2 } from "lucide-react";

import { usePosicaoMenuAcoes } from "@/components/ui/menu-acoes";
import { ConteudoModal, FecharModalProvider } from "@/components/ui/modal-formulario";
import { excluirFicha, type EstadoExclusaoFicha } from "@/modules/fichas/actions";
import {
  isTipoFichaImplementado,
  rotulosStatusFicha,
  rotulosTipoFicha,
  type StatusFicha,
  type TipoFicha,
} from "@/modules/fichas/schema";

import {
  FormularioFichaEsteticaCorporal,
  type FichaEsteticaCorporalEdicao,
} from "./formulario-ficha-estetica-corporal";
import {
  FormularioFichaExtensaoCilios,
  type FichaExtensaoCiliosEdicao,
} from "./formulario-ficha-extensao-cilios";

type ServicoOpcao = { id: string; nome: string };

export type FichaLista = {
  id: string;
  clienteId: string;
  servicoId: string | null;
  tipo: TipoFicha;
  status: StatusFicha;
  versao: number;
  versaoAnteriorId: string | null;
  respostas: unknown | null;
  aceiteTermosEm: Date | null;
  autorizacaoImagemEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
};

const estadoInicialExclusao: EstadoExclusaoFicha = { status: "inicial" };

const classePorStatus: Record<StatusFicha, string> = {
  rascunho: "bg-creme text-muted",
  preenchida: "bg-lilas/25 text-roxo",
  revisada: "bg-dourado/20 text-dourado",
  assinada: "bg-brand/15 text-brand",
};

const formatadorDataCurta = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
});

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

const rotulosCampos: Record<string, string> = {
  abdomenAbaixo: "5cm abaixo do umbigo",
  abdomenAcima: "5cm acima do umbigo",
  aceiteInformacoesVerdadeiras: "Confirma informações verdadeiras",
  alergiaDetalhe: "Detalhe da alergia",
  avaliacaoProfissional: "Avaliação da profissional",
  bracoDireito: "Braço direito",
  bracoEsquerdo: "Braço esquerdo",
  cirurgiaDetalhe: "Detalhe da cirurgia",
  cirurgiaOcularDetalhe: "Detalhe da cirurgia ocular",
  compartilhado: "Área compartilhada",
  contraindicacaoDetalhe: "Detalhe da contraindicação",
  contraindicacaoImportante: "Contraindicação importante",
  curvaturaEspessuraFios: "Curvatura e espessura dos fios",
  coxaDireita: "Coxa direita",
  coxaEsquerda: "Coxa esquerda",
  diagnosticoEstetico: "Diagnóstico estético",
  gestante: "Gestante",
  gestanteOuLactante: "Gestante ou lactante",
  gluteo: "Glúteo",
  habitos: "Hábitos",
  jaFezExtensaoCilios: "Já fez extensão de cílios",
  linhaUmbigo: "Linha do umbigo",
  medicamentoDetalhe: "Detalhe do medicamento",
  medidas: "Medidas",
  objetivoProcedimento: "Objetivo do procedimento",
  objetivoTratamento: "Objetivo do tratamento",
  observacoesInternas: "Observações internas",
  orientacoes: "Orientações",
  problemaOcularDetalhe: "Detalhe da condição ocular",
  procedimentosIndicados: "Procedimentos indicados",
  quadril: "Quadril",
  queixaPrincipal: "Queixa principal",
  reacaoAdesivoDetalhe: "Detalhe da reação ao adesivo",
  realizouCirurgia: "Realizou cirurgia",
  realizouCirurgiaOcularRecente: "Realizou cirurgia ocular recente",
  relato: "Relato do cliente",
  resumoProcedimento: "Resumo do procedimento",
  resumoTratamento: "Resumo do tratamento",
  semanasGestacao: "Semanas de gestação",
  tecnicaAplicada: "Técnica aplicada",
  temAlergia: "Tem alergia",
  temProblemaOcular: "Tem condição ocular",
  teveReacaoAdesivo: "Teve reação ao adesivo",
  usaLentesContato: "Usa lentes de contato",
  usaMedicamento: "Usa medicamento",
};

function formatarDataOpcional(data: Date | null) {
  return data ? formatadorDataHora.format(data) : "Não registrado";
}

function humanizarCampo(campo: string) {
  return (
    rotulosCampos[campo] ??
    campo.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letra) => letra.toUpperCase())
  );
}

function valorVazio(valor: unknown): boolean {
  if (valor === null || valor === undefined || valor === "") return true;
  if (Array.isArray(valor)) return valor.length === 0;
  if (typeof valor === "object") {
    return Object.values(valor as Record<string, unknown>).every(valorVazio);
  }

  return false;
}

function formatarValor(valor: unknown) {
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "number") return valor.toLocaleString("pt-BR");
  if (typeof valor === "string") return valor;

  return "Não informado";
}

function ValorResposta({ nome, valor }: { nome: string; valor: unknown }) {
  if (valorVazio(valor)) return null;

  if (Array.isArray(valor)) {
    return (
      <div className="grid gap-1">
        <dt className="text-xs font-semibold text-muted">{humanizarCampo(nome)}</dt>
        <dd className="text-sm leading-6 text-foreground">{valor.map(formatarValor).join(", ")}</dd>
      </div>
    );
  }

  if (typeof valor === "object" && valor !== null) {
    const entradas = Object.entries(valor as Record<string, unknown>).filter(
      ([, item]) => !valorVazio(item),
    );

    if (entradas.length === 0) return null;

    return (
      <div className="grid gap-3 rounded-2xl bg-creme p-4">
        <dt className="text-sm font-semibold text-roxo">{humanizarCampo(nome)}</dt>
        <dd>
          <dl className="grid gap-3">
            {entradas.map(([chave, item]) => (
              <ValorResposta key={chave} nome={chave} valor={item} />
            ))}
          </dl>
        </dd>
      </div>
    );
  }

  return (
    <div className="grid gap-1">
      <dt className="text-xs font-semibold text-muted">{humanizarCampo(nome)}</dt>
      <dd className="text-sm leading-6 text-foreground">{formatarValor(valor)}</dd>
    </div>
  );
}

function SecaoResposta({
  respostas,
  titulo,
}: {
  respostas: Record<string, unknown>;
  titulo: string;
}) {
  const entradas = Object.entries(respostas).filter(([, valor]) => !valorVazio(valor));

  return (
    <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4">
      <h3 className="font-semibold text-roxo">{titulo}</h3>
      {entradas.length > 0 ? (
        <dl className="grid gap-3">
          {entradas.map(([chave, valor]) => (
            <ValorResposta key={chave} nome={chave} valor={valor} />
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted">Não informado.</p>
      )}
    </section>
  );
}

function respostasComoObjeto(ficha: FichaLista) {
  return ficha.respostas && typeof ficha.respostas === "object"
    ? (ficha.respostas as Record<string, unknown>)
    : null;
}

function FormularioEdicaoFicha({
  clienteNome,
  ficha,
  servicos,
}: {
  clienteNome: string;
  ficha: FichaLista;
  servicos: ServicoOpcao[];
}) {
  if (!ficha.respostas || !isTipoFichaImplementado(ficha.tipo)) {
    return (
      <p className="rounded-2xl border border-border bg-creme p-4 text-sm text-muted">
        Este tipo de ficha ainda não tem formulário de edição implementado.
      </p>
    );
  }

  if (ficha.tipo === "estetica_corporal") {
    return (
      <FormularioFichaEsteticaCorporal
        clienteId={ficha.clienteId}
        clienteNome={clienteNome}
        ficha={{
          id: ficha.id,
          autorizacaoImagemEm: ficha.autorizacaoImagemEm,
          respostas: ficha.respostas as FichaEsteticaCorporalEdicao["respostas"],
          servicoId: ficha.servicoId,
        }}
        servicos={servicos}
      />
    );
  }

  return (
    <FormularioFichaExtensaoCilios
      clienteId={ficha.clienteId}
      clienteNome={clienteNome}
      ficha={{
        id: ficha.id,
        autorizacaoImagemEm: ficha.autorizacaoImagemEm,
        respostas: ficha.respostas as FichaExtensaoCiliosEdicao["respostas"],
        servicoId: ficha.servicoId,
      }}
      servicos={servicos}
    />
  );
}

function DetalhesFicha({ ficha }: { ficha: FichaLista }) {
  const respostas = respostasComoObjeto(ficha);

  if (!respostas) {
    return (
      <p className="rounded-2xl border border-border bg-creme p-4 text-sm text-muted">
        O conteúdo desta ficha é restrito à profissional.
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      <dl className="grid gap-3 rounded-2xl bg-creme p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-muted">Status</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {rotulosStatusFicha[ficha.status]}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted">Versão</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">v{ficha.versao}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted">Criada em</dt>
          <dd className="mt-1 text-sm text-foreground">{formatarDataOpcional(ficha.criadoEm)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted">Atualizada em</dt>
          <dd className="mt-1 text-sm text-foreground">
            {formatarDataOpcional(ficha.atualizadoEm)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted">Aceite de termos</dt>
          <dd className="mt-1 text-sm text-foreground">
            {formatarDataOpcional(ficha.aceiteTermosEm)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted">Autorização de imagem</dt>
          <dd className="mt-1 text-sm text-foreground">
            {formatarDataOpcional(ficha.autorizacaoImagemEm)}
          </dd>
        </div>
      </dl>

      <SecaoResposta
        respostas={(respostas.relato as Record<string, unknown> | undefined) ?? {}}
        titulo="Relato do cliente"
      />
      <SecaoResposta
        respostas={(respostas.avaliacaoProfissional as Record<string, unknown> | undefined) ?? {}}
        titulo="Avaliação da profissional"
      />
      <SecaoResposta
        respostas={(respostas.compartilhado as Record<string, unknown> | undefined) ?? {}}
        titulo="Área compartilhada"
      />
    </div>
  );
}

function ItemFicha({
  clienteNome,
  ficha,
  podeGerenciar,
  servicos,
}: {
  clienteNome: string;
  ficha: FichaLista;
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
  const podeVerDetalhes = podeGerenciar && Boolean(ficha.respostas);
  const podeEditar = podeVerDetalhes && isTipoFichaImplementado(ficha.tipo);

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
      <span className="bg-menta flex size-12 shrink-0 items-center justify-center rounded-2xl text-brand">
        <ClipboardList className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-foreground">
          {rotulosTipoFicha[ficha.tipo]}
        </span>
        <span className="mt-1 block text-sm text-muted">
          Criada em {formatadorDataCurta.format(ficha.criadoEm)} · v{ficha.versao}
          {podeVerDetalhes ? "" : " · conteúdo restrito à profissional"}
        </span>
      </span>
    </>
  );

  return (
    <li className="px-3 py-3 sm:px-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        {podeVerDetalhes ? (
          <button
            className="flex min-w-0 items-center gap-4 rounded-2xl px-3 py-2 text-left transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            onClick={modalVisualizacao.open}
            type="button"
          >
            {conteudoLinha}
          </button>
        ) : (
          <span className="flex min-w-0 items-center gap-4 px-3 py-2">{conteudoLinha}</span>
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
                title={`Ações da ficha ${rotulosTipoFicha[ficha.tipo]}`}
                type="button"
              >
                <Ellipsis className="size-5" aria-hidden="true" />
                <span className="sr-only">Abrir ações da ficha {rotulosTipoFicha[ficha.tipo]}</span>
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
                  ) : (
                    <p className="px-3 py-2 text-xs text-muted" role="note">
                      Edição ainda não disponível para este tipo.
                    </p>
                  )}
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
            <ConteudoModal titulo={`${rotulosTipoFicha[ficha.tipo]} · v${ficha.versao}`}>
              <DetalhesFicha ficha={ficha} />
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalEdicao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-2rem)] sm:w-full" size="lg">
            <ConteudoModal titulo={`Editar ${rotulosTipoFicha[ficha.tipo]}`}>
              <FecharModalProvider value={modalEdicao.close}>
                <FormularioEdicaoFicha
                  clienteNome={clienteNome}
                  ficha={ficha}
                  servicos={servicos}
                />
              </FecharModalProvider>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalExclusao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo="text-perigo" titulo="Excluir ficha">
              <form action={formAction} className="grid gap-4">
                <input name="fichaId" type="hidden" value={ficha.id} />
                <input name="clienteId" type="hidden" value={ficha.clienteId} />
                <p className="text-sm text-foreground">
                  Você está prestes a excluir a ficha {rotulosTipoFicha[ficha.tipo]} v{ficha.versao}{" "}
                  de {clienteNome}. Esta ação remove o registro do prontuário.
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
  podeGerenciar,
  servicos,
}: {
  clienteNome: string;
  fichas: FichaLista[];
  podeGerenciar: boolean;
  servicos: ServicoOpcao[];
}) {
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
            podeGerenciar={podeGerenciar}
            servicos={servicos}
          />
        ))}
      </ul>
    </div>
  );
}
