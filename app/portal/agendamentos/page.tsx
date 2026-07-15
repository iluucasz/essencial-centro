import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";

import { podeConfirmarPresenca } from "@/modules/agenda/checkin";
import { QrCheckin } from "@/modules/agenda/components/qr-checkin";
import { rotulosStatusAgendamento } from "@/modules/agenda/schema";
import { listarMeusAgendamentos } from "@/modules/agenda/queries";
import { ErroAutorizacao } from "@/modules/auth/rbac";

function formatarDataHora(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(data);
}

export default async function MeusAgendamentosPage() {
  let agendamentos: Awaited<ReturnType<typeof listarMeusAgendamentos>> = [];
  let erro: string | null = null;

  try {
    agendamentos = await listarMeusAgendamentos();
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      erro = error.message;
    } else {
      throw error;
    }
  }

  return (
    <main className="area-interna mx-auto min-h-screen w-full max-w-[1600px] bg-creme px-6 py-8">
      <div className="grid gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
          href="/portal"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao portal
        </Link>

        <header>
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <CalendarClock className="size-4" aria-hidden="true" />
            Área do cliente
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-roxo">Meus agendamentos</h1>
          <p className="mt-2 text-sm text-foreground">Próximos atendimentos marcados.</p>
        </header>

        {erro ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            {erro}
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            Nenhum agendamento futuro.
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
            {agendamentos.map((agendamento) => (
              <li
                key={agendamento.id}
                className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <span className="block font-medium text-foreground">
                    {formatarDataHora(agendamento.inicio)}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {agendamento.servicoNome} · {agendamento.profissionalNome ?? "Profissional"} ·{" "}
                    {rotulosStatusAgendamento[agendamento.status]}
                  </span>
                </div>

                {podeConfirmarPresenca(agendamento.status, agendamento.checkinEm) ? (
                  <div className="grid justify-items-center gap-1">
                    <QrCheckin agendamentoId={agendamento.id} />
                    <span className="text-xs text-muted">Mostre na recepção</span>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
