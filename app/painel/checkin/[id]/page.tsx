import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock, MapPin, User } from "lucide-react";

import { podeConfirmarPresenca } from "@/modules/agenda/checkin";
import { ConfirmacaoManualPresenca } from "@/modules/agenda/components/confirmacao-manual-presenca";
import { LeitorQrPresenca } from "@/modules/agenda/components/leitor-qr-presenca";
import {
  rotulosModalidadeAtendimento,
  rotulosStatusAgendamento,
  type StatusAgendamento,
} from "@/modules/agenda/schema";
import { obterAgendamentoParaCheckin } from "@/modules/agenda/queries";

function formatarDataHora(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(data);
}

function formatarHorario(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(data);
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1][0] ?? "") : "";

  return (primeira + ultima).toUpperCase() || "?";
}

const classesBadgeStatus: Record<StatusAgendamento, string> = {
  marcado: "border-roxo/25 bg-lilas/15 text-roxo",
  realizado: "border-brand/25 bg-brand/10 text-brand",
  falta: "border-perigo/25 bg-perigo/10 text-perigo",
  cancelado: "border-border bg-creme text-muted",
};

export default async function CheckinAgendamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agendamento = await obterAgendamentoParaCheckin(id);

  if (!agendamento) {
    notFound();
  }

  const confirmavel = podeConfirmarPresenca(agendamento.status, agendamento.checkinEm);

  return (
    <div className="mx-auto grid max-w-md gap-6">
      <Link
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo transition hover:text-brand"
        href="/painel/agenda"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para a agenda
      </Link>

      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold text-brand">Confirmar presença</h1>
        <p className="text-sm text-muted">
          Leia o QR de presença do cliente ou confirme manualmente.
        </p>
      </header>

      <div className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-lilas/20 text-base font-semibold text-roxo"
          >
            {iniciais(agendamento.clienteNome)}
          </span>
          <div className="grid min-w-0 gap-0.5">
            <p className="truncate font-semibold text-foreground">{agendamento.clienteNome}</p>
            <span
              className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium ${classesBadgeStatus[agendamento.status]}`}
            >
              {rotulosStatusAgendamento[agendamento.status]}
            </span>
          </div>
        </div>

        <dl className="grid gap-2 border-t border-border pt-4 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <User className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <dt className="sr-only">Serviço</dt>
            <dd>{agendamento.servicoNome}</dd>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <CalendarClock className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <dt className="sr-only">Data e hora</dt>
            <dd>{formatarDataHora(agendamento.inicio)}</dd>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <MapPin className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <dt className="sr-only">Modalidade</dt>
            <dd>{rotulosModalidadeAtendimento[agendamento.modalidade]}</dd>
          </div>
        </dl>
      </div>

      {agendamento.checkinEm ? (
        <div
          className="flex items-center gap-3 rounded-2xl border border-brand/25 bg-brand/10 p-5"
          role="status"
        >
          <CheckCircle2 className="size-6 shrink-0 text-brand" aria-hidden="true" />
          <div className="grid gap-0.5">
            <p className="font-semibold text-brand">Presença confirmada</p>
            <p className="flex items-center gap-1.5 text-sm text-brand/80">
              <Clock className="size-3.5" aria-hidden="true" />
              às {formatarHorario(agendamento.checkinEm)}
            </p>
          </div>
        </div>
      ) : confirmavel ? (
        <div className="grid gap-4">
          <LeitorQrPresenca agendamentoId={id} />

          <div className="flex items-center gap-3 text-xs font-medium text-muted">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>

          <ConfirmacaoManualPresenca agendamentoId={id} />
        </div>
      ) : (
        <p className="rounded-2xl border border-border bg-creme/60 px-4 py-3 text-sm text-muted">
          Este agendamento não está mais marcado — não é possível confirmar presença.
        </p>
      )}
    </div>
  );
}
