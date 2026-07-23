"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { CheckCircle2, CircleDollarSign, LoaderCircle } from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import { concluirAgendamento, type EstadoFormularioAgendamento } from "@/modules/agenda/actions";
import { podeConcluirAtendimento } from "@/modules/agenda/checkin";
import {
  calcularValorSugeridoSessao,
  situacaoInicialPagamentoSessao,
  type SituacaoPagamentoSessaoFormulario,
} from "@/modules/agenda/pagamento-sessao";
import type { StatusAgendamento } from "@/modules/agenda/schema";
import {
  formasPagamentoLancamento,
  rotulosFormaPagamentoLancamento,
} from "@/modules/financeiro/schema";
import { rotulosSituacaoPagamento, type SituacaoPagamento } from "@/modules/pacotes/schema";

const estadoInicial: EstadoFormularioAgendamento = { status: "inicial" };

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20 disabled:cursor-not-allowed disabled:bg-background disabled:text-muted";

const classeContrato: Record<SituacaoPagamento, string> = {
  pago: "bg-brand/15 text-brand",
  parcial: "bg-dourado/20 text-dourado",
  pendente: "bg-perigo/10 text-perigo",
};

const opcoesPagamento: {
  descricao: string;
  rotulo: string;
  valor: SituacaoPagamentoSessaoFormulario;
}[] = [
  {
    valor: "nao_lancar",
    rotulo: "Já estava pago",
    descricao: "Conclui a sessão sem criar cobrança extra.",
  },
  {
    valor: "pago",
    rotulo: "Pagou esta sessão",
    descricao: "Cria uma receita paga no financeiro.",
  },
  {
    valor: "pendente",
    rotulo: "Não pagou ainda",
    descricao: "Cria uma receita pendente para acompanhar depois.",
  },
];

export type AgendamentoParaRealizacao = {
  id: string;
  clienteNome?: string;
  checkinEm: Date | null;
  inicio: Date;
  pacoteQuantidadeSessoes: number | null;
  pacoteSituacaoPagamento: SituacaoPagamento | null;
  pacoteValorCentavos: number | null;
  pacoteId: string | null;
  servicoNome: string;
  servicoValorCentavos: number | null;
  status: StatusAgendamento;
};

function valorParaInput(valorCentavos: number | null) {
  if (valorCentavos === null) return undefined;

  return String(valorCentavos / 100).replace(".", ",");
}

function RotuloCampo({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label className="text-sm font-medium text-foreground" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function FormularioRealizacao({
  agendamento,
  onSuccess,
}: {
  agendamento: AgendamentoParaRealizacao;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(concluirAgendamento, estadoInicial);
  const valorSugeridoCentavos = useMemo(
    () =>
      calcularValorSugeridoSessao({
        pacoteQuantidadeSessoes: agendamento.pacoteQuantidadeSessoes,
        pacoteValorCentavos: agendamento.pacoteValorCentavos,
        servicoValorCentavos: agendamento.servicoValorCentavos,
      }),
    [agendamento],
  );
  const [situacaoPagamento, setSituacaoPagamento] = useState<SituacaoPagamentoSessaoFormulario>(
    () => situacaoInicialPagamentoSessao(agendamento.pacoteSituacaoPagamento),
  );
  const deveLancar = situacaoPagamento !== "nao_lancar";
  const erroValor = state.campos?.valorSessaoCentavos?.[0];

  useEffect(() => {
    if (state.status === "sucesso") onSuccess();
  }, [onSuccess, state.status]);

  return (
    <form action={formAction} className="grid gap-4">
      <input name="id" type="hidden" value={agendamento.id} />

      <div className="grid gap-3 rounded-2xl border border-border bg-background/40 p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">
              {agendamento.servicoNome}
            </span>
            <span className="mt-1 block text-sm text-muted">
              {formatadorDataHora.format(agendamento.inicio)}
              {agendamento.clienteNome ? ` · ${agendamento.clienteNome}` : ""}
            </span>
          </span>
          {agendamento.pacoteSituacaoPagamento ? (
            <span
              className={cn(
                "w-fit rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap sm:justify-self-end",
                classeContrato[agendamento.pacoteSituacaoPagamento],
              )}
            >
              Contrato {rotulosSituacaoPagamento[agendamento.pacoteSituacaoPagamento]}
            </span>
          ) : (
            <span className="w-fit rounded-full bg-lilas/15 px-3 py-1 text-xs font-semibold whitespace-nowrap text-roxo sm:justify-self-end">
              Sessão avulsa
            </span>
          )}
        </div>

        <p className="text-sm text-muted">
          Confirme a conclusão da sessão e como o pagamento deve entrar no financeiro. Em seguida,
          registre como foi o atendimento na sessão clínica.
        </p>
      </div>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-sm font-medium text-foreground">Pagamento desta sessão</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {opcoesPagamento.map((opcao) => (
            <label
              className={cn(
                "flex min-h-[7rem] cursor-pointer flex-col rounded-2xl border p-4 text-sm transition",
                situacaoPagamento === opcao.valor
                  ? "border-roxo bg-lilas/15 text-roxo"
                  : "border-border bg-surface text-foreground hover:bg-creme",
              )}
              key={opcao.valor}
            >
              <span className="flex items-start gap-2">
                <input
                  checked={situacaoPagamento === opcao.valor}
                  className="mt-0.5 size-4 shrink-0 border-border text-roxo focus:ring-roxo"
                  name="situacaoPagamentoSessao"
                  onChange={() => setSituacaoPagamento(opcao.valor)}
                  type="radio"
                  value={opcao.valor}
                />
                <span className="leading-5 font-semibold">{opcao.rotulo}</span>
              </span>
              <span className="mt-2 pl-6 text-xs leading-5 text-muted">{opcao.descricao}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="grid content-start gap-2">
          <RotuloCampo htmlFor="valorSessao">Valor da sessão</RotuloCampo>
          <input
            aria-describedby={erroValor ? "valorSessao-erro" : undefined}
            className={classeCampo}
            defaultValue={valorParaInput(valorSugeridoCentavos)}
            disabled={!deveLancar}
            id="valorSessao"
            inputMode="decimal"
            name="valorSessao"
            placeholder="Ex.: 120,00"
          />
          {erroValor ? (
            <p className="text-sm text-perigo" id="valorSessao-erro">
              {erroValor}
            </p>
          ) : null}
        </div>

        <div className="grid content-start gap-2">
          <RotuloCampo htmlFor="formaPagamento">Forma de pagamento</RotuloCampo>
          <select
            className={classeCampo}
            disabled={!deveLancar}
            id="formaPagamento"
            name="formaPagamento"
          >
            <option value="">Não informar agora</option>
            {formasPagamentoLancamento.map((forma) => (
              <option key={forma} value={forma}>
                {rotulosFormaPagamentoLancamento[forma]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.mensagem && state.status === "erro" ? (
        <p
          className="rounded-xl bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          {state.mensagem}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-4">
        <button
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          onClick={onSuccess}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          )}
          Concluir sessão
        </button>
      </div>
    </form>
  );
}

export function BotaoRealizarAgendamento({
  agendamento,
  onAbrir,
  onFechar,
  variante = "linha",
}: {
  agendamento: AgendamentoParaRealizacao;
  onAbrir?: () => void;
  onFechar?: () => void;
  variante?: "linha" | "menu";
}) {
  const modal = useOverlayState();
  const podeConcluir = podeConcluirAtendimento(agendamento.status, agendamento.checkinEm);
  const dicaBotao = podeConcluir
    ? "Concluir sessão"
    : "Confirme a presença antes de concluir a sessão.";

  function abrirModal() {
    if (!podeConcluir) return;

    onAbrir?.();
    modal.open();
  }

  function fecharModal() {
    modal.close();
    onFechar?.();
  }

  return (
    <>
      <button
        aria-disabled={!podeConcluir}
        className={cn(
          variante === "menu"
            ? "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2"
            : "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2",
          podeConcluir
            ? variante === "menu"
              ? "text-foreground hover:bg-creme focus-visible:outline-roxo"
              : "border-brand/30 bg-brand/10 text-brand hover:bg-brand/15 focus-visible:outline-roxo"
            : variante === "menu"
              ? "cursor-not-allowed text-muted opacity-70 focus-visible:outline-border"
              : "cursor-not-allowed border-border bg-background text-muted opacity-70 focus-visible:outline-border",
        )}
        disabled={!podeConcluir}
        onClick={abrirModal}
        role={variante === "menu" ? "menuitem" : undefined}
        title={dicaBotao}
        type="button"
      >
        {variante === "menu" ? (
          <CircleDollarSign
            className={cn("size-4", podeConcluir ? "text-roxo" : "text-muted")}
            aria-hidden="true"
          />
        ) : (
          <CheckCircle2
            className={cn("size-3.5", podeConcluir ? "text-brand" : "text-muted")}
            aria-hidden="true"
          />
        )}
        Concluir sessão
      </button>

      <Modal state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="lg">
            <ConteudoModal titulo="Concluir sessão">
              {modal.isOpen ? (
                <FormularioRealizacao agendamento={agendamento} onSuccess={fecharModal} />
              ) : null}
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
