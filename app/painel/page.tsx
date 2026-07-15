import Link from "next/link";
import { CalendarClock, PackageCheck, TriangleAlert, UsersRound } from "lucide-react";

import { CardKpi } from "@/components/ui/card-kpi";
import { listarAgendamentosDoDia } from "@/modules/agenda/queries";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { listarClientes } from "@/modules/clientes/queries";
import { deveAvisarPacoteAcabando } from "@/modules/pacotes/progresso";
import { listarPacotes } from "@/modules/pacotes/queries";

export default async function PainelPage() {
  const usuario = await exigirUsuarioAtual(["profissional", "recepcao"]);

  const [agendamentosHoje, clientes, pacotes] = await Promise.all([
    listarAgendamentosDoDia(new Date()),
    listarClientes(),
    listarPacotes(),
  ]);

  const pacotesAtivos = pacotes.filter((p) => p.ativo);
  const pacotesAcabando = pacotesAtivos.filter((p) =>
    deveAvisarPacoteAcabando(p.progresso.sessoesRestantes),
  );

  return (
    <div className="mx-auto grid max-w-5xl gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-brand">Olá, {usuario.name ?? usuario.email}</h1>
        <p className="mt-1 text-sm text-foreground">Resumo do dia na clínica.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link className="rounded-2xl transition hover:-translate-y-0.5" href="/painel/agenda">
          <CardKpi
            icone={CalendarClock}
            label="Atendimentos hoje"
            valor={String(agendamentosHoje.length)}
          />
        </Link>
        <Link className="rounded-2xl transition hover:-translate-y-0.5" href="/painel/clientes">
          <CardKpi
            icone={UsersRound}
            label="Clientes cadastrados"
            valor={String(clientes.length)}
          />
        </Link>
        <Link className="rounded-2xl transition hover:-translate-y-0.5" href="/painel/pacotes">
          <CardKpi
            icone={PackageCheck}
            label="Pacotes ativos"
            valor={String(pacotesAtivos.length)}
          />
        </Link>
        <Link className="rounded-2xl transition hover:-translate-y-0.5" href="/painel/pacotes">
          <CardKpi
            destaque={pacotesAcabando.length > 0 ? "neutro" : undefined}
            icone={TriangleAlert}
            label="Pacotes acabando"
            valor={String(pacotesAcabando.length)}
          />
        </Link>
      </div>

      <div className="grid gap-3">
        <h2 className="text-lg font-semibold text-foreground">Agenda de hoje</h2>
        {agendamentosHoje.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            Nenhum atendimento marcado para hoje.
          </div>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
            {agendamentosHoje.slice(0, 5).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 border-b border-border p-3 last:border-0"
              >
                <span className="text-sm font-semibold text-foreground">
                  {new Intl.DateTimeFormat("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC",
                  }).format(a.inicio)}
                </span>
                <span className="flex-1 text-sm text-foreground">{a.clienteNome}</span>
                <span className="text-sm text-muted">{a.servicoNome}</span>
              </li>
            ))}
          </ul>
        )}
        {agendamentosHoje.length > 5 ? (
          <Link className="text-sm font-medium text-roxo hover:text-brand" href="/painel/agenda">
            Ver agenda completa →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
