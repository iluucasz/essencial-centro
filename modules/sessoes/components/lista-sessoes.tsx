"use client";

import { useActionState, useEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Ellipsis,
  Eye,
  LoaderCircle,
  NotebookPen,
  Pencil,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

import { usePosicaoMenuAcoes } from "@/components/ui/menu-acoes";
import { ConteudoModal, FecharModalProvider } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import { excluirSessao, type EstadoExclusaoSessao } from "@/modules/sessoes/actions";
import {
  filtrarSessoes,
  numerarSessoesPorData,
  ordenarSessoesPorDataDecrescente,
  type FiltroPacoteSessao,
  type FiltroVinculoAgendamentoSessao,
} from "@/modules/sessoes/filtro";

import {
  FormularioSessao,
  type AgendamentoSessaoFormulario,
  type SessaoFormulario,
} from "./formulario-sessao";

type Opcao = { id: string; nome: string };

export type SessaoLista = SessaoFormulario & {
  dataHora: Date;
  criadoEm: Date;
  atualizadoEm: Date;
};

const estadoInicialExclusao: EstadoExclusaoSessao = { status: "inicial" };

const classeFiltro =
  "h-10 min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

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

function filtrarOpcoesPorIds(opcoes: Opcao[], ids: Set<string>) {
  return opcoes.filter((opcao) => ids.has(opcao.id));
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
  agendamentos: AgendamentoSessaoFormulario[];
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
  numeroSessao,
  pacotes,
  servicos,
  sessao,
}: {
  agendamentos: AgendamentoSessaoFormulario[];
  numeroSessao: number;
  pacotes: Opcao[];
  servicos: Opcao[];
  sessao: SessaoLista;
}) {
  const router = useRouter();
  const modalVisualizacao = useOverlayState();
  const modalEdicao = useOverlayState();
  const modalExclusao = useOverlayState();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [state, formAction, pending] = useActionState(excluirSessao, estadoInicialExclusao);
  const { gatilhoRef, abrirParaCima } = usePosicaoMenuAcoes(menuAberto);
  const servicoNome = nomeOpcao(servicos, sessao.servicoId, "Sessão");
  const agendamentoVinculado = sessao.agendamentoId
    ? agendamentos.find((item) => item.id === sessao.agendamentoId)
    : undefined;
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
      <div className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-transparent bg-surface p-2 transition duration-200 focus-within:border-roxo/20 focus-within:bg-lilas/10 hover:border-roxo/10 hover:bg-lilas/15 hover:shadow-sm">
        <button
          className="flex min-w-0 gap-4 rounded-xl px-3 py-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          onClick={modalVisualizacao.open}
          type="button"
        >
          <span className="bg-menta flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-brand transition duration-200 group-hover:scale-105 group-hover:bg-surface group-hover:text-roxo">
            S{numeroSessao}
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold text-foreground transition group-hover:text-brand">
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

        <span className="flex shrink-0 items-center gap-2 pr-1">
          <time className="hidden text-right text-sm font-medium text-muted sm:inline">
            {formatadorDataHora.format(sessao.dataHora)}
          </time>

          <div className="relative inline-flex" onBlur={fecharMenuAoPerderFoco} ref={gatilhoRef}>
            <button
              aria-expanded={menuAberto}
              aria-haspopup="menu"
              className="inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
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
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
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
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
            <ConteudoModal titulo={`Editar sessão ${numeroSessao}`}>
              <FecharModalProvider value={modalEdicao.close}>
                <FormularioSessao
                  agendamentoTravado={agendamentoVinculado}
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

function caminhoAbaSessoes(clienteId: string) {
  return `/painel/clientes/${clienteId}?aba=sessoes`;
}

function ModalRegistrarSessaoAgendamento({
  abrirInicialmente = false,
  agendamento,
  clienteId,
  pacotes,
  servicos,
}: {
  abrirInicialmente?: boolean;
  agendamento: AgendamentoSessaoFormulario;
  clienteId: string;
  pacotes: Opcao[];
  servicos: Opcao[];
}) {
  const router = useRouter();
  const modal = useOverlayState();
  const abriuPorUrl = useRef(false);
  const caminhoLimpo = caminhoAbaSessoes(clienteId);

  useEffect(() => {
    if (!abrirInicialmente || abriuPorUrl.current) return;

    abriuPorUrl.current = true;
    modal.open();
  }, [abrirInicialmente, modal]);

  useEffect(() => {
    if (!abrirInicialmente || !abriuPorUrl.current || modal.isOpen) return;

    router.replace(caminhoLimpo, { scroll: false });
  }, [abrirInicialmente, caminhoLimpo, modal.isOpen, router]);

  function fecharModal() {
    modal.close();
    router.replace(caminhoLimpo, { scroll: false });
    router.refresh();
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand px-3 text-xs font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo">
        <NotebookPen className="size-3.5" aria-hidden="true" />
        Preencher sessão
      </Modal.Trigger>
      <Modal.Backdrop variant="opaque">
        <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
          <ConteudoModal titulo="Registrar sessão do atendimento">
            <FecharModalProvider value={fecharModal}>
              <FormularioSessao
                agendamentoTravado={agendamento}
                agendamentos={[agendamento]}
                clienteId={clienteId}
                pacotes={pacotes}
                servicos={servicos}
              />
            </FecharModalProvider>
          </ConteudoModal>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function AvisoSessoesPendentes({
  agendamentoAbrirModalId,
  agendamentos,
  clienteId,
  pacotes,
  servicos,
}: {
  agendamentoAbrirModalId?: string | null;
  agendamentos: AgendamentoSessaoFormulario[];
  clienteId: string;
  pacotes: Opcao[];
  servicos: Opcao[];
}) {
  if (agendamentos.length === 0) return null;

  return (
    <section className="grid gap-3 rounded-3xl border border-dourado/25 bg-dourado/10 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-dourado/15 p-2.5 text-dourado">
          <AlertCircle className="size-5" aria-hidden="true" />
        </span>
        <span>
          <h3 className="text-base font-semibold text-foreground">
            Atendimentos realizados sem sessão
          </h3>
          <p className="mt-1 text-sm text-muted">
            Estes atendimentos já foram concluídos na agenda, mas ainda precisam do registro clínico
            da sessão.
          </p>
        </span>
      </div>

      <ul className="grid gap-2">
        {agendamentos.map((agendamento) => (
          <li
            className="grid gap-3 rounded-2xl border border-dourado/20 bg-surface/90 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            key={agendamento.id}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="rounded-xl bg-dourado/15 p-2 text-dourado">
                <CalendarClock className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {agendamento.servicoNome}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {formatadorDataHora.format(agendamento.inicio)}
                  {agendamento.pacoteNome ? ` · ${agendamento.pacoteNome}` : " · Sessão avulsa"}
                </span>
              </span>
            </span>

            <ModalRegistrarSessaoAgendamento
              abrirInicialmente={agendamentoAbrirModalId === agendamento.id}
              agendamento={agendamento}
              clienteId={clienteId}
              pacotes={pacotes}
              servicos={servicos}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ListaSessoes({
  agendamentoAbrirModalId,
  agendamentos,
  agendamentosPendentes = [],
  clienteId,
  pacotes,
  servicos,
  sessoes,
}: {
  agendamentoAbrirModalId?: string | null;
  agendamentos: AgendamentoSessaoFormulario[];
  agendamentosPendentes?: AgendamentoSessaoFormulario[];
  clienteId: string;
  pacotes: Opcao[];
  servicos: Opcao[];
  sessoes: SessaoLista[];
}) {
  const [busca, setBusca] = useState("");
  const [mesAno, setMesAno] = useState("");
  const [pacoteSelecionado, setPacoteSelecionado] = useState<FiltroPacoteSessao>("todos");
  const [servicoSelecionado, setServicoSelecionado] = useState<"todos" | string>("todos");
  const [vinculoAgendamento, setVinculoAgendamento] =
    useState<FiltroVinculoAgendamentoSessao>("todos");

  const servicoNomePorId = useMemo(
    () => new Map(servicos.map((servico) => [servico.id, servico.nome])),
    [servicos],
  );
  const pacoteNomePorId = useMemo(
    () => new Map(pacotes.map((pacote) => [pacote.id, pacote.nome])),
    [pacotes],
  );
  const agendamentoNomePorId = useMemo(
    () => new Map(agendamentos.map((agendamento) => [agendamento.id, agendamento.nome])),
    [agendamentos],
  );
  const sessoesOrdenadas = useMemo(() => ordenarSessoesPorDataDecrescente(sessoes), [sessoes]);
  const numeroSessaoPorId = useMemo(() => numerarSessoesPorData(sessoes), [sessoes]);
  const servicosFiltro = useMemo(() => {
    const ids = new Set(sessoes.map((sessao) => sessao.servicoId));

    return filtrarOpcoesPorIds(servicos, ids);
  }, [servicos, sessoes]);
  const pacotesFiltro = useMemo(() => {
    const ids = new Set(
      sessoes.map((sessao) => sessao.pacoteId).filter((id): id is string => Boolean(id)),
    );

    return filtrarOpcoesPorIds(pacotes, ids);
  }, [pacotes, sessoes]);
  const temSessaoAvulsa = useMemo(
    () => sessoes.some((sessao) => sessao.pacoteId === null),
    [sessoes],
  );
  const sessoesFiltradas = useMemo(
    () =>
      filtrarSessoes(
        sessoesOrdenadas,
        {
          busca,
          mesAno,
          pacoteId: pacoteSelecionado,
          servicoId: servicoSelecionado,
          vinculoAgendamento,
        },
        { agendamentoNomePorId, pacoteNomePorId, servicoNomePorId },
      ),
    [
      agendamentoNomePorId,
      busca,
      mesAno,
      pacoteNomePorId,
      pacoteSelecionado,
      servicoNomePorId,
      servicoSelecionado,
      sessoesOrdenadas,
      vinculoAgendamento,
    ],
  );

  return (
    <div className="grid gap-4">
      <AvisoSessoesPendentes
        agendamentoAbrirModalId={agendamentoAbrirModalId}
        agendamentos={agendamentosPendentes}
        clienteId={clienteId}
        pacotes={pacotes}
        servicos={servicos}
      />

      {sessoes.length === 0 ? (
        <div className="flex items-center gap-3 rounded-3xl border border-border bg-surface p-6 text-sm text-muted">
          <span className="bg-menta rounded-2xl p-3 text-brand">
            <NotebookPen className="size-4" aria-hidden="true" />
          </span>
          Nenhuma sessão registrada.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-surface">
          <div className="grid gap-4 border-b border-border px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">Sessões realizadas</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                {sessoesFiltradas.length} de {sessoes.length}
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-3">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-12">
                <label className="grid min-w-0 gap-1.5 lg:col-span-3">
                  <span className="text-xs font-semibold text-muted">Busca</span>
                  <span className="relative min-w-0">
                    <Search
                      className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      className={cn(classeFiltro, "w-full pl-9")}
                      onChange={(event) => setBusca(event.target.value)}
                      placeholder="Serviço, região ou relato"
                      type="search"
                      value={busca}
                    />
                  </span>
                </label>

                <label className="grid min-w-0 gap-1.5 lg:col-span-2">
                  <span className="text-xs font-semibold text-muted">Mês/ano</span>
                  <input
                    className={cn(classeFiltro, "w-full")}
                    onChange={(event) => setMesAno(event.target.value)}
                    type="month"
                    value={mesAno}
                  />
                </label>

                <label className="grid min-w-0 gap-1.5 lg:col-span-2">
                  <span className="text-xs font-semibold text-muted">Serviço</span>
                  <select
                    className={classeFiltro}
                    onChange={(event) => setServicoSelecionado(event.target.value)}
                    value={servicoSelecionado}
                  >
                    <option value="todos">Todos os serviços do cliente</option>
                    {servicosFiltro.map((servico) => (
                      <option key={servico.id} value={servico.id}>
                        {servico.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid min-w-0 gap-1.5 lg:col-span-3">
                  <span className="text-xs font-semibold text-muted">Pacote</span>
                  <select
                    className={classeFiltro}
                    onChange={(event) => setPacoteSelecionado(event.target.value)}
                    value={pacoteSelecionado}
                  >
                    <option value="todos">Todos os pacotes do cliente</option>
                    {temSessaoAvulsa ? <option value="sem-pacote">Sessões avulsas</option> : null}
                    {pacotesFiltro.map((pacote) => (
                      <option key={pacote.id} value={pacote.id}>
                        {pacote.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid min-w-0 gap-1.5 lg:col-span-2">
                  <span className="text-xs font-semibold text-muted">Atendimento</span>
                  <select
                    className={classeFiltro}
                    onChange={(event) =>
                      setVinculoAgendamento(event.target.value as FiltroVinculoAgendamentoSessao)
                    }
                    value={vinculoAgendamento}
                  >
                    <option value="todos">Todos</option>
                    <option value="com-agendamento">Vinculado</option>
                    <option value="sem-agendamento">Sem vínculo</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          {sessoesFiltradas.length === 0 ? (
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 p-5 text-sm text-muted">
                <span className="bg-menta rounded-2xl p-3 text-brand">
                  <NotebookPen className="size-4" aria-hidden="true" />
                </span>
                Nenhuma sessão encontrada com estes filtros.
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {sessoesFiltradas.map((sessao) => (
                <ItemSessao
                  agendamentos={agendamentos}
                  key={sessao.id}
                  numeroSessao={numeroSessaoPorId.get(sessao.id) ?? 1}
                  pacotes={pacotes}
                  servicos={servicos}
                  sessao={sessao}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
