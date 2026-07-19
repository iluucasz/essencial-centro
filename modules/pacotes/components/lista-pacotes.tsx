"use client";

import { type KeyboardEvent, type ReactNode } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  PackageCheck,
  ReceiptText,
} from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";
import {
  rotulosModalidadeAtendimento,
  rotulosStatusAgendamento,
  type ModalidadeAtendimento,
  type StatusAgendamento,
} from "@/modules/agenda/schema";
import {
  rotulosCategoriaLancamento,
  rotulosFormaPagamentoLancamento,
  rotulosSituacaoLancamento,
  rotulosTipoLancamento,
  type CategoriaLancamento,
  type FormaPagamentoLancamento,
  type SituacaoLancamento,
  type TipoLancamento,
} from "@/modules/financeiro/schema";
import type { ProgressoPacote } from "@/modules/pacotes/progresso";
import { rotulosSituacaoPagamento, type SituacaoPagamento } from "@/modules/pacotes/schema";

import { MenuAcoesPacote } from "./menu-acoes-pacote";

type PacoteAgendamento = {
  id: string;
  pacoteId: string | null;
  inicio: Date;
  duracaoMinutos: number;
  status: StatusAgendamento;
  modalidade: ModalidadeAtendimento;
  observacoes: string | null;
  checkinEm: Date | null;
  profissionalNome: string | null;
  profissionalEmail: string | null;
};

type PacoteSessao = {
  id: string;
  pacoteId: string | null;
  agendamentoId: string | null;
  dataHora: Date;
  duracaoMinutos: number | null;
  regiaoTratada: string | null;
  presencaConfirmada: boolean;
  proximaSessaoRecomendada: Date | null;
  servicoNome: string;
  profissionalNome: string | null;
  profissionalEmail: string | null;
};

type PacoteLancamento = {
  id: string;
  pacoteId: string | null;
  tipo: string;
  categoria: string;
  descricao: string | null;
  valorCentavos: number;
  data: Date;
  formaPagamento: string | null;
  situacao: SituacaoLancamento;
};

type PacoteResumo = {
  id: string;
  clienteId: string;
  servicoId: string;
  clienteNome: string;
  servicoNome: string;
  quantidadeSessoes: number;
  dataContratacao?: Date;
  validade: Date | null;
  valorCentavos: number | null;
  formaPagamento: string | null;
  situacaoPagamento: SituacaoPagamento;
  ativo: boolean;
  progresso: ProgressoPacote;
  agendamentos?: PacoteAgendamento[];
  sessoes?: PacoteSessao[];
  lancamentos?: PacoteLancamento[];
};

type Opcao = { id: string; nome: string };

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });
const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const classePorSituacao: Record<SituacaoPagamento, string> = {
  pendente: "bg-dourado/20 text-dourado",
  parcial: "bg-lilas/25 text-roxo",
  pago: "bg-brand/15 text-brand",
};

const classePorStatusAgendamento: Record<StatusAgendamento, string> = {
  marcado: "bg-roxo/10 text-roxo",
  realizado: "bg-brand/15 text-brand",
  falta: "bg-dourado/20 text-dourado",
  cancelado: "bg-perigo/10 text-perigo",
};

function formatarValor(valorCentavos: number | null) {
  return valorCentavos === null ? "Valor a definir" : formatadorMoeda.format(valorCentavos / 100);
}

function formatarData(data?: Date | null) {
  return data ? formatadorData.format(data) : "Não informado";
}

function rotuloCategoria(categoria: string) {
  return rotulosCategoriaLancamento[categoria as CategoriaLancamento] ?? categoria;
}

function rotuloFormaPagamento(formaPagamento: string | null) {
  if (!formaPagamento) return "Não informado";

  return (
    rotulosFormaPagamentoLancamento[formaPagamento as FormaPagamentoLancamento] ?? formaPagamento
  );
}

function rotuloTipoLancamento(tipo: string) {
  return rotulosTipoLancamento[tipo as TipoLancamento] ?? tipo;
}

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function InfoResumo({ label, valor }: { label: string; valor: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-creme/45 p-3">
      <span className="block text-xs font-medium tracking-wide text-muted uppercase">{label}</span>
      <span className="mt-1 block text-sm font-semibold text-foreground">{valor}</span>
    </div>
  );
}

function ListaVazia({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-creme/35 px-4 py-5 text-sm text-muted">
      {children}
    </p>
  );
}

function DetalhesPacote({ pacote }: { pacote: PacoteResumo }) {
  const agendamentos = pacote.agendamentos ?? [];
  const sessoes = pacote.sessoes ?? [];
  const lancamentos = pacote.lancamentos ?? [];

  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted">Cliente</p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">{pacote.clienteNome}</h3>
            <p className="mt-1 text-sm text-muted">{pacote.servicoNome}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={classePorSituacao[pacote.situacaoPagamento]}>
              {rotulosSituacaoPagamento[pacote.situacaoPagamento]}
            </Badge>
            <Badge className={pacote.ativo ? "bg-brand/15 text-brand" : "bg-muted/10 text-muted"}>
              {pacote.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>

        <div>
          <div className="h-2.5 overflow-hidden rounded-full bg-creme">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${pacote.progresso.percentualConcluido}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted">
            {pacote.progresso.sessoesRealizadas} de {pacote.progresso.quantidadeSessoes} sessões
            concluídas · {pacote.progresso.sessoesRestantes} restantes
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoResumo label="Contratação" valor={formatarData(pacote.dataContratacao)} />
          <InfoResumo label="Validade" valor={formatarData(pacote.validade)} />
          <InfoResumo label="Valor" valor={formatarValor(pacote.valorCentavos)} />
          <InfoResumo label="Pagamento" valor={pacote.formaPagamento ?? "Não informado"} />
        </div>
      </section>

      <section className="grid gap-3">
        <h4 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <CalendarClock className="size-4 text-roxo" aria-hidden="true" />
          Agendamentos vinculados
        </h4>
        {agendamentos.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border">
            {agendamentos.map((agendamento) => (
              <div
                className="grid gap-2 border-b border-border/70 px-4 py-3 last:border-b-0 md:grid-cols-[1fr_auto]"
                key={agendamento.id}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatadorDataHora.format(agendamento.inicio)}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {agendamento.duracaoMinutos} min ·{" "}
                    {rotulosModalidadeAtendimento[agendamento.modalidade]}
                    {agendamento.profissionalNome ? ` · ${agendamento.profissionalNome}` : ""}
                  </p>
                  {agendamento.observacoes ? (
                    <p className="mt-2 text-sm text-foreground">{agendamento.observacoes}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-start gap-2 md:justify-end">
                  <Badge className={classePorStatusAgendamento[agendamento.status]}>
                    {rotulosStatusAgendamento[agendamento.status]}
                  </Badge>
                  {agendamento.checkinEm ? (
                    <Badge className="bg-brand/15 text-brand">Check-in realizado</Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ListaVazia>Nenhum agendamento vinculado a este pacote.</ListaVazia>
        )}
      </section>

      <section className="grid gap-3">
        <h4 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ClipboardList className="size-4 text-roxo" aria-hidden="true" />
          Sessões registradas
        </h4>
        {sessoes.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border">
            {sessoes.map((sessao) => (
              <div
                className="grid gap-2 border-b border-border/70 px-4 py-3 last:border-b-0 md:grid-cols-[1fr_auto]"
                key={sessao.id}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatadorDataHora.format(sessao.dataHora)}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {sessao.servicoNome}
                    {sessao.duracaoMinutos ? ` · ${sessao.duracaoMinutos} min` : ""}
                    {sessao.profissionalNome ? ` · ${sessao.profissionalNome}` : ""}
                  </p>
                  {sessao.regiaoTratada ? (
                    <p className="mt-2 text-sm text-foreground">
                      Região tratada: {sessao.regiaoTratada}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2 md:justify-items-end">
                  <Badge
                    className={
                      sessao.presencaConfirmada
                        ? "bg-brand/15 text-brand"
                        : "bg-dourado/20 text-dourado"
                    }
                  >
                    {sessao.presencaConfirmada ? "Presença confirmada" : "Presença pendente"}
                  </Badge>
                  {sessao.proximaSessaoRecomendada ? (
                    <span className="text-xs text-muted">
                      Próxima sugerida: {formatarData(sessao.proximaSessaoRecomendada)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ListaVazia>Nenhuma sessão registrada neste pacote.</ListaVazia>
        )}
      </section>

      <section className="grid gap-3">
        <h4 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ReceiptText className="size-4 text-roxo" aria-hidden="true" />
          Financeiro vinculado
        </h4>
        {lancamentos.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border">
            {lancamentos.map((lancamento) => (
              <div
                className="grid gap-2 border-b border-border/70 px-4 py-3 last:border-b-0 md:grid-cols-[1fr_auto]"
                key={lancamento.id}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatarValor(lancamento.valorCentavos)}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {rotuloTipoLancamento(lancamento.tipo)} ·{" "}
                    {rotuloCategoria(lancamento.categoria)} · {formatarData(lancamento.data)}
                  </p>
                  {lancamento.descricao ? (
                    <p className="mt-2 text-sm text-foreground">{lancamento.descricao}</p>
                  ) : null}
                </div>
                <div className="grid gap-2 md:justify-items-end">
                  <Badge className="bg-lilas/25 text-roxo">
                    {rotulosSituacaoLancamento[lancamento.situacao]}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
                    <CreditCard className="size-3.5 text-roxo" aria-hidden="true" />
                    {rotuloFormaPagamento(lancamento.formaPagamento)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ListaVazia>Nenhum lançamento financeiro vinculado a este pacote.</ListaVazia>
        )}
      </section>
    </div>
  );
}

function ItemPacote({
  clientes,
  ehUltimo,
  pacote,
  podeExcluir,
  servicos,
}: {
  clientes?: Opcao[];
  ehUltimo: boolean;
  pacote: PacoteResumo;
  podeExcluir: boolean;
  servicos?: Opcao[];
}) {
  const modalDetalhes = useOverlayState();

  function abrirPorTeclado(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    modalDetalhes.open();
  }

  return (
    <>
      <div
        className={`grid cursor-pointer gap-3 px-4 py-4 transition hover:bg-lilas/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo md:grid-cols-[minmax(12rem,1.25fr)_minmax(12rem,1.1fr)_minmax(13rem,1fr)_minmax(10rem,0.75fr)_auto] md:items-center ${
          ehUltimo ? "" : "border-b border-border/70"
        }`}
        onClick={modalDetalhes.open}
        onKeyDown={abrirPorTeclado}
        role="button"
        tabIndex={0}
      >
        <span className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 rounded-xl bg-lilas/35 p-2 text-roxo">
            <PackageCheck className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-foreground">{pacote.clienteNome}</span>
            <span className="mt-1 block text-sm text-muted">
              {pacote.ativo ? "Pacote ativo" : "Pacote inativo"}
            </span>
          </span>
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">
            {pacote.servicoNome}
          </span>
          <span className="mt-1 block text-sm text-muted">
            {formatarValor(pacote.valorCentavos)} · validade {formatarData(pacote.validade)}
          </span>
        </span>

        <span className="min-w-0">
          <span className="mb-2 flex items-center justify-between gap-2 text-sm text-muted">
            <span>
              {pacote.progresso.sessoesRealizadas}/{pacote.progresso.quantidadeSessoes} sessões
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-brand">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {pacote.progresso.percentualConcluido}%
            </span>
          </span>
          <span className="block h-2 overflow-hidden rounded-full bg-creme">
            <span
              className="block h-full rounded-full bg-brand"
              style={{ width: `${pacote.progresso.percentualConcluido}%` }}
            />
          </span>
        </span>

        <span className="flex flex-wrap items-center gap-2">
          <Badge className={classePorSituacao[pacote.situacaoPagamento]}>
            {rotulosSituacaoPagamento[pacote.situacaoPagamento]}
          </Badge>
          <span className="text-xs text-muted">{pacote.formaPagamento ?? "Sem forma"}</span>
        </span>

        <span
          className="justify-self-start md:justify-self-end"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {clientes && servicos ? (
            <MenuAcoesPacote
              clientes={clientes}
              pacote={pacote}
              podeExcluir={podeExcluir}
              servicos={servicos}
            />
          ) : null}
        </span>
      </div>

      <Modal state={modalDetalhes}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="lg">
            <ConteudoModal titulo="Detalhes do pacote">
              <DetalhesPacote pacote={pacote} />
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

export function ListaPacotes({
  clientes,
  pacotes,
  podeExcluir = false,
  servicos,
}: {
  clientes?: Opcao[];
  pacotes: PacoteResumo[];
  podeExcluir?: boolean;
  servicos?: Opcao[];
}) {
  if (pacotes.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
        Nenhum pacote encontrado para os filtros selecionados.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
      <div className="hidden border-b border-border/70 px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase md:grid md:grid-cols-[minmax(12rem,1.25fr)_minmax(12rem,1.1fr)_minmax(13rem,1fr)_minmax(10rem,0.75fr)_auto]">
        <span>Cliente</span>
        <span>Serviço</span>
        <span>Progresso</span>
        <span>Pagamento</span>
        <span className="text-right">Ações</span>
      </div>
      {pacotes.map((pacote, indice) => (
        <ItemPacote
          clientes={clientes}
          ehUltimo={indice === pacotes.length - 1}
          key={pacote.id}
          pacote={pacote}
          podeExcluir={podeExcluir}
          servicos={servicos}
        />
      ))}
    </section>
  );
}
