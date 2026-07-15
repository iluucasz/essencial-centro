import { CalendarClock, Check, UserX, X } from "lucide-react";

import { atualizarStatusAgendamento } from "@/modules/agenda/actions";
import { rotulosStatusAgendamento, type StatusAgendamento } from "@/modules/agenda/schema";

type AgendamentoResumo = {
  id: string;
  inicio: Date;
  duracaoMinutos: number;
  status: StatusAgendamento;
  observacoes: string | null;
  clienteNome: string;
  servicoNome: string;
  profissionalNome: string | null;
};

const classePorStatus: Record<StatusAgendamento, string> = {
  marcado: "bg-lilas/25 text-roxo",
  realizado: "bg-brand/15 text-brand",
  falta: "bg-dourado/20 text-dourado",
  cancelado: "bg-perigo/10 text-perigo",
};

function formatarHorario(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(data);
}

function BotaoStatus({
  agendamentoId,
  icone: Icone,
  label,
  status,
}: {
  agendamentoId: string;
  icone: typeof Check;
  label: string;
  status: StatusAgendamento;
}) {
  return (
    <form action={atualizarStatusAgendamento}>
      <input name="id" type="hidden" value={agendamentoId} />
      <input name="status" type="hidden" value={status} />
      <button
        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        type="submit"
      >
        <Icone className="size-3.5" aria-hidden="true" />
        {label}
      </button>
    </form>
  );
}

export function ListaAgenda({ agendamentos }: { agendamentos: AgendamentoResumo[] }) {
  if (agendamentos.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-6 text-sm text-muted">
        <CalendarClock className="size-4" aria-hidden="true" />
        Nenhum agendamento para este dia.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <ul className="divide-y divide-border">
        {agendamentos.map((agendamento) => (
          <li
            key={agendamento.id}
            className="grid gap-3 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
          >
            <span className="text-sm font-semibold text-foreground">
              {formatarHorario(agendamento.inicio)}
            </span>

            <span>
              <span className="block font-medium text-foreground">{agendamento.clienteNome}</span>
              <span className="mt-1 block text-sm text-muted">
                {agendamento.servicoNome} · {agendamento.profissionalNome ?? "Sem profissional"} ·{" "}
                {agendamento.duracaoMinutos} min
              </span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${classePorStatus[agendamento.status]}`}
              >
                {rotulosStatusAgendamento[agendamento.status]}
              </span>

              {agendamento.status === "marcado" ? (
                <>
                  <BotaoStatus
                    agendamentoId={agendamento.id}
                    icone={Check}
                    label="Realizado"
                    status="realizado"
                  />
                  <BotaoStatus
                    agendamentoId={agendamento.id}
                    icone={UserX}
                    label="Falta"
                    status="falta"
                  />
                  <BotaoStatus
                    agendamentoId={agendamento.id}
                    icone={X}
                    label="Cancelar"
                    status="cancelado"
                  />
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
