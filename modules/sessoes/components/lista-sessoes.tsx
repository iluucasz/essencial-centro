"use client";

import { useActionState, useEffect, useState, type FocusEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import {
  CheckCircle2,
  Ellipsis,
  Eye,
  LoaderCircle,
  NotebookPen,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";

import { usePosicaoMenuAcoes } from "@/components/ui/menu-acoes";
import { ConteudoModal, FecharModalProvider } from "@/components/ui/modal-formulario";
import { excluirSessao, type EstadoExclusaoSessao } from "@/modules/sessoes/actions";

import { FormularioSessao, type SessaoFormulario } from "./formulario-sessao";

type Opcao = { id: string; nome: string };

export type SessaoLista = SessaoFormulario & {
  dataHora: Date;
  criadoEm: Date;
  atualizadoEm: Date;
};

const estadoInicialExclusao: EstadoExclusaoSessao = { status: "inicial" };

const formatadorDataCurta = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
});
const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatarDataOpcional(data: Date | null | undefined) {
  return data ? formatadorDataHora.format(data) : "Não informado";
}

function formatarTexto(valor: string | number | boolean | null | undefined) {
  if (valor === null || valor === undefined || valor === "") return "Não informado";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";

  return valor;
}

function nomeOpcao(opcoes: Opcao[], id: string | null, vazio = "Não vinculado") {
  if (!id) return vazio;

  return opcoes.find((opcao) => opcao.id === id)?.nome ?? "Registro não encontrado";
}

function CampoDetalhe({
  label,
  valor,
}: {
  label: string;
  valor: string | number | boolean | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{formatarTexto(valor)}</dd>
    </div>
  );
}

function BlocoTexto({ label, valor }: { label: string; valor: string | null | undefined }) {
  return (
    <section className="grid gap-2 rounded-2xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-roxo">{label}</h3>
      <p className="text-sm leading-6 text-foreground">{valor?.trim() || "Não informado."}</p>
    </section>
  );
}

function DetalhesSessao({
  agendamentos,
  pacotes,
  servicos,
  sessao,
}: {
  agendamentos: Opcao[];
  pacotes: Opcao[];
  servicos: Opcao[];
  sessao: SessaoLista;
}) {
  return (
    <div className="grid gap-5">
      <dl className="grid gap-3 rounded-2xl bg-creme p-4 sm:grid-cols-2">
        <CampoDetalhe label="Serviço" valor={nomeOpcao(servicos, sessao.servicoId)} />
        <CampoDetalhe label="Data" valor={formatarDataOpcional(sessao.dataHora)} />
        <CampoDetalhe
          label="Duração"
          valor={sessao.duracaoMinutos ? `${sessao.duracaoMinutos} min` : null}
        />
        <CampoDetalhe label="Presença confirmada" valor={sessao.presencaConfirmada} />
        <CampoDetalhe
          label="Atendimento vinculado"
          valor={nomeOpcao(agendamentos, sessao.agendamentoId)}
        />
        <CampoDetalhe label="Pacote vinculado" valor={nomeOpcao(pacotes, sessao.pacoteId)} />
        <CampoDetalhe label="Criada em" valor={formatarDataOpcional(sessao.criadoEm)} />
        <CampoDetalhe label="Atualizada em" valor={formatarDataOpcional(sessao.atualizadoEm)} />
      </dl>

      <dl className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2">
        <CampoDetalhe label="Região tratada" valor={sessao.regiaoTratada} />
        <CampoDetalhe
          label="Próxima sessão recomendada"
          valor={
            sessao.proximaSessaoRecomendada
              ? formatadorDataCurta.format(sessao.proximaSessaoRecomendada)
              : null
          }
        />
        <CampoDetalhe
          label="Dor antes"
          valor={sessao.escalaDorAntes !== null ? `${sessao.escalaDorAntes}/10` : null}
        />
        <CampoDetalhe
          label="Dor depois"
          valor={sessao.escalaDorDepois !== null ? `${sessao.escalaDorDepois}/10` : null}
        />
      </dl>

      <BlocoTexto label="Condição antes da sessão" valor={sessao.condicaoAntes} />
      <BlocoTexto label="Relato do cliente" valor={sessao.relatoCliente} />
      <BlocoTexto label="Avaliação profissional" valor={sessao.avaliacaoProfissional} />
      <BlocoTexto label="Equipamentos utilizados" valor={sessao.equipamentosUtilizados} />
      <BlocoTexto label="Parâmetros utilizados" valor={sessao.parametrosUtilizados} />
      <BlocoTexto label="Produtos aplicados" valor={sessao.produtosAplicados} />
      <BlocoTexto label="Reações observadas" valor={sessao.reacoesObservadas} />
      <BlocoTexto label="Observações internas" valor={sessao.observacoesInternas} />
      <BlocoTexto label="Orientações pós-atendimento" valor={sessao.orientacoesPosAtendimento} />
    </div>
  );
}

function ItemSessao({
  agendamentos,
  indice,
  pacotes,
  servicos,
  sessao,
  total,
}: {
  agendamentos: Opcao[];
  indice: number;
  pacotes: Opcao[];
  servicos: Opcao[];
  sessao: SessaoLista;
  total: number;
}) {
  const router = useRouter();
  const modalVisualizacao = useOverlayState();
  const modalEdicao = useOverlayState();
  const modalExclusao = useOverlayState();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [state, formAction, pending] = useActionState(excluirSessao, estadoInicialExclusao);
  const { gatilhoRef, abrirParaCima } = usePosicaoMenuAcoes(menuAberto);
  const numeroSessao = total - indice;
  const servicoNome = nomeOpcao(servicos, sessao.servicoId, "Sessão");
  const descricao =
    sessao.relatoCliente ??
    sessao.orientacoesPosAtendimento ??
    "Registro clínico sem descrição complementar.";

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
          className="flex min-w-0 gap-4 rounded-2xl px-3 py-2 text-left transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          onClick={modalVisualizacao.open}
          type="button"
        >
          <span className="bg-menta flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-brand">
            S{numeroSessao}
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold text-foreground">
              Sessão {numeroSessao}
            </span>
            <span className="mt-1 block text-sm text-foreground">
              {sessao.regiaoTratada ?? servicoNome}
            </span>
            <span className="mt-2 line-clamp-2 block text-sm leading-6 text-muted">
              {descricao}
            </span>
            <span className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
              {sessao.escalaDorAntes !== null ? (
                <span>
                  Dor antes:{" "}
                  <strong className="rounded-full bg-lilas/25 px-2 py-0.5 text-roxo">
                    {sessao.escalaDorAntes}/10
                  </strong>
                </span>
              ) : null}
              {sessao.escalaDorDepois !== null ? (
                <span>
                  Dor depois:{" "}
                  <strong className="rounded-full bg-brand/15 px-2 py-0.5 text-brand">
                    {sessao.escalaDorDepois}/10
                  </strong>
                </span>
              ) : null}
            </span>
          </span>
        </button>

        <span className="flex shrink-0 items-center gap-2">
          <time className="hidden text-right text-sm font-medium text-muted sm:inline">
            {formatadorDataHora.format(sessao.dataHora)}
          </time>

          <div className="relative inline-flex" onBlur={fecharMenuAoPerderFoco} ref={gatilhoRef}>
            <button
              aria-expanded={menuAberto}
              aria-haspopup="menu"
              className="inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-creme hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              onClick={() => setMenuAberto((aberto) => !aberto)}
              title={`Ações da sessão ${numeroSessao}`}
              type="button"
            >
              <Ellipsis className="size-5" aria-hidden="true" />
              <span className="sr-only">Abrir ações da sessão {numeroSessao}</span>
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
                  Ver sessão
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
                  Editar sessão
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
                  Excluir sessão
                </button>
              </div>
            ) : null}
          </div>
        </span>
      </div>

      <Modal state={modalVisualizacao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-2rem)] sm:w-full" size="lg">
            <ConteudoModal titulo={`Sessão ${numeroSessao}`}>
              <DetalhesSessao
                agendamentos={agendamentos}
                pacotes={pacotes}
                servicos={servicos}
                sessao={sessao}
              />
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalEdicao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-2rem)] sm:w-full" size="lg">
            <ConteudoModal titulo={`Editar sessão ${numeroSessao}`}>
              <FecharModalProvider value={modalEdicao.close}>
                <FormularioSessao
                  agendamentos={agendamentos}
                  clienteId={sessao.clienteId}
                  pacotes={pacotes}
                  servicos={servicos}
                  sessao={sessao}
                />
              </FecharModalProvider>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalExclusao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo="text-perigo" titulo="Excluir sessão">
              <form action={formAction} className="grid gap-4">
                <input name="id" type="hidden" value={sessao.id} />
                <input name="clienteId" type="hidden" value={sessao.clienteId} />
                <p className="text-sm text-foreground">
                  Você está prestes a excluir a sessão {numeroSessao}. Esta ação remove o registro
                  clínico do prontuário.
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

export function ListaSessoes({
  agendamentos,
  pacotes,
  servicos,
  sessoes,
}: {
  agendamentos: Opcao[];
  pacotes: Opcao[];
  servicos: Opcao[];
  sessoes: SessaoLista[];
}) {
  if (sessoes.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-border bg-surface p-6 text-sm text-muted">
        <span className="bg-menta rounded-2xl p-3 text-brand">
          <NotebookPen className="size-4" aria-hidden="true" />
        </span>
        Nenhuma sessão registrada.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
        <h3 className="text-base font-semibold text-foreground">Sessões realizadas</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand">
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          {sessoes.length} registro{sessoes.length === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {sessoes.map((sessao, indice) => (
          <ItemSessao
            agendamentos={agendamentos}
            indice={indice}
            key={sessao.id}
            pacotes={pacotes}
            servicos={servicos}
            sessao={sessao}
            total={sessoes.length}
          />
        ))}
      </ul>
    </div>
  );
}
