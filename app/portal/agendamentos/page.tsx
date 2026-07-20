import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2 } from "lucide-react";

import { podeConfirmarPresenca } from "@/modules/agenda/checkin";
import { ModalQrAgendamento } from "@/modules/agenda/components/modal-qr-agendamento";
import { QrCheckin } from "@/modules/agenda/components/qr-checkin";
import { rotulosStatusAgendamento, type StatusAgendamento } from "@/modules/agenda/schema";
import { listarMeuHistoricoAgendamentos, listarMeusAgendamentos } from "@/modules/agenda/queries";
import { ErroAutorizacao } from "@/modules/auth/rbac";

function formatarDataHora(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(data);
}

const classesBadgeStatus: Record<Exclude<StatusAgendamento, "marcado">, string> = {
  realizado: "border-brand/25 bg-brand/10 text-brand",
  falta: "border-perigo/25 bg-perigo/10 text-perigo",
  cancelado: "border-perigo/25 bg-perigo/10 text-perigo",
};

type Agendamento = Awaited<ReturnType<typeof listarMeusAgendamentos>>[number];

function LinhaAgendamento({ agendamento }: { agendamento: Agendamento }) {
  return (
    <div>
      <span className="block font-medium text-foreground">
        {formatarDataHora(agendamento.inicio)}
      </span>
      <span className="mt-1 block text-sm text-muted">
        {agendamento.servicoNome} · {agendamento.profissionalNome ?? "Profissional"}
      </span>
    </div>
  );
}

export default async function MeusAgendamentosPage() {
  let marcados: Agendamento[] = [];
  let historico: Agendamento[] = [];
  let erro: string | null = null;

  try {
    [marcados, historico] = await Promise.all([
      listarMeusAgendamentos(),
      listarMeuHistoricoAgendamentos(),
    ]);
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
          <p className="mt-2 text-sm text-foreground">Atendimentos marcados e histórico.</p>
        </header>

        {erro ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            {erro}
          </div>
        ) : (
          <>
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold text-foreground">Atendimentos marcados</h2>
              {marcados.length === 0 ? (
                <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
                  Nenhum atendimento marcado.
                </div>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
                  {marcados.map((agendamento) =>
                    podeConfirmarPresenca(agendamento.status, agendamento.checkinEm) ? (
                      <li key={agendamento.id}>
                        <ModalQrAgendamento
                          titulo="QR de presença"
                          gatilho={<LinhaAgendamento agendamento={agendamento} />}
                        >
                          <QrCheckin agendamentoId={agendamento.id} tamanho={220} />
                        </ModalQrAgendamento>
                      </li>
                    ) : (
                      <li
                        key={agendamento.id}
                        className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <LinhaAgendamento agendamento={agendamento} />
                        <span className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-brand">
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                          Presença confirmada
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </section>

            {historico.length > 0 ? (
              <section className="grid gap-3">
                <h2 className="text-sm font-semibold text-foreground">Histórico</h2>
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
                  {historico.map((agendamento) => (
                    <li
                      key={agendamento.id}
                      className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <LinhaAgendamento agendamento={agendamento} />
                      {agendamento.status !== "marcado" ? (
                        <span
                          className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${classesBadgeStatus[agendamento.status]}`}
                        >
                          {rotulosStatusAgendamento[agendamento.status]}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
