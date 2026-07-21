import { CalendarClock, Home, UserRound } from "lucide-react";

import { podeConfirmarPresenca } from "@/modules/agenda/checkin";
import { formatarHorarioPresenca } from "@/modules/agenda/formatacao";
import { rotulosStatusAgendamento, type StatusAgendamento } from "@/modules/agenda/schema";

import { BotaoConfirmarPresenca } from "./modal-confirmar-presenca";
import { BotaoDetalhesAgendamento } from "./modal-detalhes-agendamento";
import { BotaoRealizarAgendamento } from "./modal-realizar-agendamento";
import { BotaoConfirmarStatusAgendamento } from "./modal-status-agendamento";
import type { AgendamentoResumo } from "./tipos-agenda";

const classePorStatus: Record<StatusAgendamento, string> = {
  marcado: "bg-lilas/25 text-roxo",
  realizado: "bg-brand/15 text-brand",
  falta: "bg-dourado/20 text-dourado",
  cancelado: "bg-perigo/10 text-perigo",
};

const classeLinhaPorStatus: Record<StatusAgendamento, string> = {
  marcado: "border-l-roxo/45 bg-lilas/10",
  realizado: "border-l-brand/55 bg-brand/5",
  falta: "border-l-dourado/60 bg-dourado/10",
  cancelado: "border-l-perigo/55 bg-perigo/5",
};

function formatarHorario(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(data);
}

export function ListaAgenda({ agendamentos }: { agendamentos: AgendamentoResumo[] }) {
  if (agendamentos.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
        <CalendarClock className="size-4" aria-hidden="true" />
        Nenhum agendamento para este dia.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="hidden grid-cols-[5rem_minmax(0,1.1fr)_minmax(0,1fr)_minmax(22rem,auto)] gap-4 border-b border-border bg-background px-4 py-3 text-xs font-medium text-muted md:grid">
        <span>Horário</span>
        <span>Cliente</span>
        <span>Atendimento</span>
        <span>Status e ações</span>
      </div>
      <ul className="divide-y divide-border">
        {agendamentos.map((agendamento) => (
          <li
            key={agendamento.id}
            className={`grid gap-3 border-l-4 p-4 transition hover:bg-creme/35 md:grid-cols-[5rem_minmax(0,1.1fr)_minmax(0,1fr)_minmax(22rem,auto)] md:items-center ${classeLinhaPorStatus[agendamento.status]}`}
          >
            <BotaoDetalhesAgendamento
              agendamento={agendamento}
              className="grid min-w-0 gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo md:col-span-3 md:grid-cols-[5rem_minmax(0,1.1fr)_minmax(0,1fr)] md:items-center"
            >
              <span className="text-sm font-semibold text-foreground md:text-base">
                {formatarHorario(agendamento.inicio)}
              </span>

              <span className="min-w-0">
                <span className="block font-medium text-foreground">{agendamento.clienteNome}</span>
                <span
                  className={`mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    agendamento.profissionalNome
                      ? "bg-lilas/25 text-roxo"
                      : "bg-background text-muted"
                  }`}
                >
                  <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    Profissional: {agendamento.profissionalNome ?? "Sem profissional"}
                  </span>
                </span>
              </span>

              <span className="min-w-0 text-sm text-muted">
                <span className="block truncate font-medium text-foreground">
                  {agendamento.servicoNome}
                </span>
                <span className="mt-1 block">{agendamento.duracaoMinutos} min</span>
              </span>
            </BotaoDetalhesAgendamento>

            <div className="flex flex-col gap-2 md:items-end">
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${classePorStatus[agendamento.status]}`}
                >
                  {rotulosStatusAgendamento[agendamento.status]}
                </span>

                {agendamento.modalidade === "domiciliar" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-dourado/20 px-2.5 py-1 text-xs font-medium text-dourado">
                    <Home className="size-3" aria-hidden="true" />
                    Domiciliar
                  </span>
                ) : null}

                {agendamento.checkinEm ? (
                  <span className="text-xs font-medium text-muted">
                    Presença às {formatarHorarioPresenca(agendamento.checkinEm)}
                  </span>
                ) : null}
              </div>

              {agendamento.status === "marcado" ? (
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
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
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
