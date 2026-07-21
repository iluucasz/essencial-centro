"use client";

import type { ReactNode } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Home,
  MapPin,
  StickyNote,
  UserRound,
} from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import { podeConfirmarPresenca } from "@/modules/agenda/checkin";
import { formatarHorarioPresenca } from "@/modules/agenda/formatacao";
import {
  rotulosModalidadeAtendimento,
  rotulosStatusAgendamento,
  type StatusAgendamento,
} from "@/modules/agenda/schema";
import { rotulosSituacaoPagamento } from "@/modules/pacotes/schema";

import { BotaoConfirmarPresenca } from "./modal-confirmar-presenca";
import { BotaoRealizarAgendamento } from "./modal-realizar-agendamento";
import { BotaoConfirmarStatusAgendamento } from "./modal-status-agendamento";
import type { AgendamentoResumo } from "./tipos-agenda";

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "UTC",
});

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

const classeStatus: Record<StatusAgendamento, string> = {
  marcado: "border-roxo/25 bg-lilas/20 text-roxo",
  realizado: "border-brand/25 bg-brand/10 text-brand",
  falta: "border-dourado/30 bg-dourado/15 text-dourado",
  cancelado: "border-perigo/25 bg-perigo/10 text-perigo",
};

function valorMoeda(valorCentavos: number | null) {
  if (valorCentavos === null) return "Não informado";

  return formatadorMoeda.format(valorCentavos / 100);
}

function descreverPresenca(agendamento: AgendamentoResumo) {
  if (agendamento.checkinEm) {
    return `Confirmada às ${formatarHorarioPresenca(agendamento.checkinEm)}`;
  }

  if (agendamento.status === "falta") return "Não compareceu";
  if (agendamento.status === "cancelado") return "Agendamento cancelado";
  if (agendamento.status === "realizado") return "Não registrada";

  return "Ainda não confirmada";
}

function CampoDetalhe({
  icone,
  label,
  valor,
}: {
  icone: ReactNode;
  label: string;
  valor: ReactNode;
}) {
  return (
    <div className="grid gap-1 rounded-2xl border border-border bg-background/40 p-3">
      <span className="flex items-center gap-2 text-xs font-medium text-muted">
        {icone}
        {label}
      </span>
      <span className="min-w-0 text-sm font-semibold text-foreground">{valor}</span>
    </div>
  );
}

function AcoesAgendamento({ agendamento }: { agendamento: AgendamentoResumo }) {
  if (agendamento.status !== "marcado") {
    return (
      <p className="rounded-xl bg-background px-3 py-2 text-sm text-muted">
        Este agendamento já está resolvido.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {podeConfirmarPresenca(agendamento.status, agendamento.checkinEm) ? (
        <BotaoConfirmarPresenca agendamento={agendamento} />
      ) : null}

      <BotaoRealizarAgendamento agendamento={agendamento} />
      <BotaoConfirmarStatusAgendamento
        agendamentoId={agendamento.id}
        clienteNome={agendamento.clienteNome}
        inicio={agendamento.inicio}
        servicoNome={agendamento.servicoNome}
        status="falta"
      />
      <BotaoConfirmarStatusAgendamento
        agendamentoId={agendamento.id}
        clienteNome={agendamento.clienteNome}
        inicio={agendamento.inicio}
        servicoNome={agendamento.servicoNome}
        status="cancelado"
      />
    </div>
  );
}

export function ConteudoDetalhesAgendamento({ agendamento }: { agendamento: AgendamentoResumo }) {
  const temContrato = agendamento.pacoteId !== null;
  const valorBase = agendamento.pacoteValorCentavos ?? agendamento.servicoValorCentavos;

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-2xl border border-border bg-background/40 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-base font-semibold text-foreground">
              {agendamento.clienteNome}
            </span>
            <span className="mt-1 block text-sm text-muted">{agendamento.servicoNome}</span>
          </span>
          <span
            className={cn(
              "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold",
              classeStatus[agendamento.status],
            )}
          >
            {rotulosStatusAgendamento[agendamento.status]}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CampoDetalhe
          icone={<CalendarClock className="size-4" aria-hidden="true" />}
          label="Data e horário"
          valor={formatadorDataHora.format(agendamento.inicio)}
        />
        <CampoDetalhe
          icone={<Clock3 className="size-4" aria-hidden="true" />}
          label="Duração"
          valor={`${agendamento.duracaoMinutos} min`}
        />
        <CampoDetalhe
          icone={<UserRound className="size-4" aria-hidden="true" />}
          label="Profissional"
          valor={agendamento.profissionalNome ?? "Sem profissional"}
        />
        <CampoDetalhe
          icone={
            agendamento.modalidade === "domiciliar" ? (
              <Home className="size-4" aria-hidden="true" />
            ) : (
              <MapPin className="size-4" aria-hidden="true" />
            )
          }
          label="Modalidade"
          valor={rotulosModalidadeAtendimento[agendamento.modalidade]}
        />
        <CampoDetalhe
          icone={<CheckCircle2 className="size-4" aria-hidden="true" />}
          label="Presença"
          valor={descreverPresenca(agendamento)}
        />
        <CampoDetalhe
          icone={<CircleDollarSign className="size-4" aria-hidden="true" />}
          label={temContrato ? "Contrato" : "Sessão avulsa"}
          valor={
            <span className="grid gap-1">
              <span>{valorMoeda(valorBase)}</span>
              {agendamento.pacoteSituacaoPagamento ? (
                <span className="text-xs font-medium text-muted">
                  {rotulosSituacaoPagamento[agendamento.pacoteSituacaoPagamento]}
                  {agendamento.pacoteQuantidadeSessoes
                    ? ` · ${agendamento.pacoteQuantidadeSessoes} sessões`
                    : ""}
                </span>
              ) : null}
            </span>
          }
        />
      </div>

      {agendamento.observacoes ? (
        <div className="grid gap-2 rounded-2xl border border-border bg-background/40 p-4">
          <span className="flex items-center gap-2 text-xs font-medium text-muted">
            <StickyNote className="size-4" aria-hidden="true" />
            Observações
          </span>
          <p className="text-sm whitespace-pre-wrap text-foreground">{agendamento.observacoes}</p>
        </div>
      ) : null}

      <div className="grid gap-3 border-t border-border/70 pt-4">
        <span className="text-sm font-semibold text-foreground">Ações</span>
        <AcoesAgendamento agendamento={agendamento} />
      </div>
    </div>
  );
}

export function BotaoDetalhesAgendamento({
  agendamento,
  children,
  className,
}: {
  agendamento: AgendamentoResumo;
  children: ReactNode;
  className?: string;
}) {
  const modal = useOverlayState();

  return (
    <>
      <button className={className} onClick={() => modal.open()} type="button">
        {children}
      </button>

      <Modal state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="lg">
            <ConteudoModal titulo="Detalhes do agendamento">
              {modal.isOpen ? <ConteudoDetalhesAgendamento agendamento={agendamento} /> : null}
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
