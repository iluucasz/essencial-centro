import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { confirmarPresenca } from "@/modules/agenda/actions";
import { podeConfirmarPresenca } from "@/modules/agenda/checkin";
import { obterAgendamentoParaCheckin } from "@/modules/agenda/queries";

function formatarDataHora(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(data);
}

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

  return (
    <div className="mx-auto grid max-w-md gap-6">
      <Link
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
        href="/painel/agenda"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para a agenda
      </Link>

      <header>
        <h1 className="text-2xl font-semibold text-brand">Confirmar presença</h1>
      </header>

      <div className="grid gap-2 rounded-lg border border-border bg-surface p-5 shadow-sm">
        <p className="font-medium text-foreground">{agendamento.clienteNome}</p>
        <p className="text-sm text-muted">
          {agendamento.servicoNome} · {formatarDataHora(agendamento.inicio)}
        </p>
      </div>

      {agendamento.checkinEm ? (
        <p className="flex items-center gap-2 text-sm font-medium text-brand" role="status">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Presença confirmada às{" "}
          {new Intl.DateTimeFormat("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
          }).format(agendamento.checkinEm)}
          .
        </p>
      ) : podeConfirmarPresenca(agendamento.status, agendamento.checkinEm) ? (
        <form action={confirmarPresenca}>
          <input name="id" type="hidden" value={id} />
          <button
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            type="submit"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Confirmar presença
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted">
          Este agendamento não está mais marcado — não é possível confirmar presença.
        </p>
      )}
    </div>
  );
}
