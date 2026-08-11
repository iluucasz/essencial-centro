import { CalendarClock, Home, UserRound } from "lucide-react";

import { podeConfirmarPresenca } from "@/modules/agenda/checkin";
import { AvatarUsuario } from "@/modules/auth/components/avatar-usuario";
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
  aguardando_confirmacao: "bg-muted/10 text-muted",
  cancelado: "bg-perigo/10 text-perigo",
  recusado: "bg-perigo/10 text-perigo",
};

const classeLinhaPorStatus: Record<StatusAgendamento, string> = {
  marcado: "border-l-roxo/45 bg-lilas/10",
  realizado: "border-l-brand/55 bg-brand/5",
  falta: "border-l-dourado/60 bg-dourado/10",
  aguardando_confirmacao: "border-l-muted/55 bg-muted/5",
  cancelado: "border-l-perigo/55 bg-perigo/5",
  recusado: "border-l-perigo/55 bg-perigo/5",
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
              {/*
                No mobile o horário divide a linha com o status, em vez de ocupar uma linha só —
                era uma das linhas desperdiçadas que deixavam o card comprido demais. No desktop o
                status volta pra coluna de ações e este bloco fica só com a hora.
              */}
              <span className="flex items-center justify-between gap-2 md:block">
                <span className="text-base font-semibold text-foreground">
                  {formatarHorario(agendamento.inicio)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium md:hidden ${classePorStatus[agendamento.status]}`}
                >
                  {rotulosStatusAgendamento[agendamento.status]}
                </span>
              </span>

              <span className="min-w-0">
                <span className="block font-medium text-foreground">{agendamento.clienteNome}</span>

                {/* Foto de quem atende no lugar do texto "Profissional: X" — reconhece mais rápido. */}
                <span className="mt-1.5 flex min-w-0 items-center gap-2">
                  {agendamento.profissionalId ? (
                    <AvatarUsuario
                      imagem={agendamento.profissionalImagem ?? null}
                      nome={agendamento.profissionalNome ?? "Profissional"}
                      tamanho="sm"
                      usuarioId={agendamento.profissionalId}
                    />
                  ) : (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-muted">
                      <UserRound className="size-3.5" aria-hidden="true" />
                    </span>
                  )}
                  <span className="truncate text-xs font-medium text-muted">
                    {agendamento.profissionalNome ?? "Sem profissional"}
                  </span>
                </span>
              </span>

              {/* Serviço e duração numa linha: eram duas, e "60 min" não merece linha própria. */}
              <span className="flex min-w-0 items-baseline gap-1.5 text-sm">
                <span className="truncate font-medium text-foreground">
                  {agendamento.servicoNome}
                </span>
                <span className="shrink-0 text-muted">· {agendamento.duracaoMinutos} min</span>
              </span>
            </BotaoDetalhesAgendamento>

            <div className="flex flex-col gap-2 md:items-end">
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                {/* No mobile o status já aparece ao lado do horário; aqui só do md pra cima. */}
                <span
                  className={`hidden rounded-full px-2.5 py-1 text-xs font-medium md:inline ${classePorStatus[agendamento.status]}`}
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
                /*
                  Grade de 2 colunas no mobile: com `flex-wrap` os botões ficavam de larguras
                  diferentes e quebravam de forma irregular. Cada filho ocupa a célula inteira, então
                  os quatro saem alinhados. Do md pra cima volta a ser flex à direita.
                */
                <div className="grid grid-cols-2 gap-2 *:w-full md:flex md:flex-wrap md:items-center md:justify-end md:*:w-auto">
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
