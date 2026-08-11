"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Modal, useOverlayState } from "@heroui/react";
import { ArrowLeft, CalendarClock, Clock3, Plus, UserRound } from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import {
  rotulosStatusAgendamento,
  statusAgendamento,
  type StatusAgendamento,
} from "@/modules/agenda/schema";

import { BotaoDetalhesAgendamento } from "./modal-detalhes-agendamento";
import type { AgendamentoResumo } from "./tipos-agenda";

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeZone: "UTC",
});

const formatadorHorario = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const classeStatus: Record<StatusAgendamento, string> = {
  marcado: "bg-lilas/25 text-roxo",
  realizado: "bg-brand/15 text-brand",
  falta: "bg-dourado/20 text-dourado",
  aguardando_confirmacao: "bg-muted/10 text-muted",
  cancelado: "bg-perigo/10 text-perigo",
  recusado: "bg-perigo/10 text-perigo",
};

const classeItemStatus: Record<StatusAgendamento, string> = {
  marcado: "border-l-roxo/45 bg-lilas/10",
  realizado: "border-l-brand/55 bg-brand/5",
  falta: "border-l-dourado/60 bg-dourado/10",
  aguardando_confirmacao: "border-l-muted/55 bg-muted/5",
  cancelado: "border-l-perigo/55 bg-perigo/5",
  recusado: "border-l-perigo/55 bg-perigo/5",
};

function contarStatus(agendamentos: AgendamentoResumo[]) {
  return statusAgendamento.map((status) => ({
    status,
    total: agendamentos.filter((agendamento) => agendamento.status === status).length,
  }));
}

function ItemAgendamentoDia({ agendamento }: { agendamento: AgendamentoResumo }) {
  return (
    <BotaoDetalhesAgendamento
      agendamento={agendamento}
      className={cn(
        "grid w-full gap-2 rounded-2xl border border-l-4 border-border p-3 text-left transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo",
        classeItemStatus[agendamento.status],
      )}
    >
      <span className="flex min-w-0 items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">
            {agendamento.clienteNome}
          </span>
          <span className="mt-1 block truncate text-sm text-muted">{agendamento.servicoNome}</span>
        </span>
        <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-foreground">
          {formatadorHorario.format(agendamento.inicio)}
        </span>
      </span>

      <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {agendamento.duracaoMinutos} min
        </span>
        <span className="inline-flex items-center gap-1">
          <UserRound className="size-3.5" aria-hidden="true" />
          {agendamento.profissionalNome ?? "Sem profissional"}
        </span>
        <span
          className={cn("rounded-full px-2 py-0.5 font-semibold", classeStatus[agendamento.status])}
        >
          {rotulosStatusAgendamento[agendamento.status]}
        </span>
      </span>
    </BotaoDetalhesAgendamento>
  );
}

export function BotaoDiaAgenda({
  agendamentos,
  children,
  className,
  data,
  formularioNovoAgendamento,
  hrefDia,
}: {
  agendamentos: AgendamentoResumo[];
  children: ReactNode;
  className?: string;
  data: Date;
  /**
   * Formulário de novo agendamento, já renderizado no servidor (clientes/serviços/profissionais não
   * cruzam a fronteira como referência). Ausente = o botão nem aparece.
   */
  formularioNovoAgendamento?: ReactNode;
  hrefDia: string;
}) {
  /*
    O formulário troca de lugar com o resumo DENTRO do mesmo modal, em vez de abrir um segundo modal
    por cima: dois overlays empilhados disputam a armadilha de foco do react-aria, e o de baixo
    acabaria capturando o teclado.
  */
  const [criando, setCriando] = useState(false);
  const modal = useOverlayState({ onOpenChange: (aberto) => !aberto && setCriando(false) });
  const totais = contarStatus(agendamentos).filter(({ total }) => total > 0);

  return (
    <>
      <button className={className} onClick={() => modal.open()} type="button">
        {children}
      </button>

      <Modal state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="lg">
            <ConteudoModal titulo={criando ? "Novo agendamento" : "Agenda do dia"}>
              {modal.isOpen && criando ? (
                <div className="grid gap-4">
                  {/*
                    Voltar vai ACIMA do formulário, como link discreto — mesmo padrão do seletor de
                    modelo de ficha. Embaixo ele disputava a linha com o "Criar agendamento" do
                    próprio formulário, que é alinhado à direita, e os dois saíam desencontrados.
                  */}
                  <button
                    className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo transition hover:text-brand"
                    onClick={() => setCriando(false)}
                    type="button"
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Voltar para a agenda do dia
                  </button>

                  {formularioNovoAgendamento}
                </div>
              ) : null}

              {modal.isOpen && !criando ? (
                <div className="grid gap-5">
                  <div className="grid gap-3 rounded-2xl border border-border bg-background/40 p-4">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <CalendarClock className="size-4 text-roxo" aria-hidden="true" />
                      {formatadorData.format(data)}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                        {agendamentos.length} agendamento{agendamentos.length === 1 ? "" : "s"}
                      </span>
                      {totais.map(({ status, total }) => (
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            classeStatus[status],
                          )}
                          key={status}
                        >
                          {rotulosStatusAgendamento[status]}: {total}
                        </span>
                      ))}
                    </div>
                  </div>

                  {agendamentos.length === 0 ? (
                    <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
                      Nenhum agendamento para este dia.
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {agendamentos.map((agendamento) => (
                        <ItemAgendamentoDia agendamento={agendamento} key={agendamento.id} />
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
                    {formularioNovoAgendamento ? (
                      <button
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-roxo/30 bg-lilas/10 px-4 text-sm font-semibold text-roxo transition hover:bg-lilas/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                        onClick={() => setCriando(true)}
                        type="button"
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        Novo agendamento
                      </button>
                    ) : null}

                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                      href={hrefDia}
                    >
                      Ver agenda do dia
                    </Link>
                  </div>
                </div>
              ) : null}
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
