import Link from "next/link";
import { CalendarClock, PackageCheck, TriangleAlert, UsersRound, Wallet } from "lucide-react";

import { CardKpi } from "@/components/ui/card-kpi";
import { calcularVariacaoPercentual, primeiroDiaDoMes, ultimoDiaDoMes } from "@/lib/utils";
import { GraficoAtendimentos } from "@/modules/agenda/components/grafico-atendimentos";
import { listarAgendamentosDoDia, listarAgendamentosUltimosDias } from "@/modules/agenda/queries";
import { agruparAgendamentosPorDia } from "@/modules/agenda/tendencia";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { listarClientes } from "@/modules/clientes/queries";
import { listarLancamentos } from "@/modules/financeiro/queries";
import { calcularResumoFinanceiro } from "@/modules/financeiro/resumo";
import { deveAvisarPacoteAcabando } from "@/modules/pacotes/progresso";
import { listarPacotes } from "@/modules/pacotes/queries";
import { contarClientesNovos } from "@/modules/relatorios/resumo";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

async function obterTendenciaFaturamento(hoje: Date) {
  const mesAnteriorRef = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 1, 1));

  const [lancamentosMesAtual, lancamentosMesAnterior] = await Promise.all([
    listarLancamentos({ inicio: primeiroDiaDoMes(hoje), fim: ultimoDiaDoMes(hoje) }),
    listarLancamentos({
      inicio: primeiroDiaDoMes(mesAnteriorRef),
      fim: ultimoDiaDoMes(mesAnteriorRef),
    }),
  ]);

  const atual = calcularResumoFinanceiro(lancamentosMesAtual).receitasPagas;
  const anterior = calcularResumoFinanceiro(lancamentosMesAnterior).receitasPagas;
  const percentual = calcularVariacaoPercentual(atual, anterior);

  return { valorCentavos: atual, percentual };
}

export default async function PainelPage() {
  const usuario = await exigirUsuarioAtual(["profissional", "recepcao"]);
  const hoje = new Date();

  const [agendamentosHoje, clientes, pacotes, agendamentosPeriodo] = await Promise.all([
    listarAgendamentosDoDia(hoje),
    listarClientes(),
    listarPacotes(),
    listarAgendamentosUltimosDias(30),
  ]);

  const tendenciaFaturamento =
    usuario.role === "profissional" ? await obterTendenciaFaturamento(hoje) : null;

  const pacotesAtivos = pacotes.filter((p) => p.ativo);
  const pacotesAcabando = pacotesAtivos.filter((p) =>
    deveAvisarPacoteAcabando(p.progresso.sessoesRestantes),
  );

  const novosClientesEsteMes = contarClientesNovos(
    clientes,
    primeiroDiaDoMes(hoje),
    ultimoDiaDoMes(hoje),
  );
  const percentualCrescimentoClientes = calcularVariacaoPercentual(
    clientes.length,
    clientes.length - novosClientesEsteMes,
  );

  const pontosGrafico = agruparAgendamentosPorDia(agendamentosPeriodo, 30, hoje);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-brand">Olá, {usuario.name ?? usuario.email}</h1>
        <p className="mt-1 text-sm text-foreground">Resumo do dia na clínica.</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Link className="rounded-2xl transition hover:-translate-y-0.5" href="/painel/agenda">
          <CardKpi
            cor="roxo"
            icone={CalendarClock}
            label="Atendimentos hoje"
            valor={String(agendamentosHoje.length)}
          />
        </Link>
        <Link className="rounded-2xl transition hover:-translate-y-0.5" href="/painel/clientes">
          <CardKpi
            cor="brand"
            icone={UsersRound}
            label="Clientes cadastrados"
            tendencia={
              percentualCrescimentoClientes === null
                ? undefined
                : { percentual: percentualCrescimentoClientes, rotulo: "vs base anterior" }
            }
            valor={String(clientes.length)}
          />
        </Link>
        <Link className="rounded-2xl transition hover:-translate-y-0.5" href="/painel/pacotes">
          <CardKpi
            cor="dourado"
            icone={PackageCheck}
            label="Pacotes ativos"
            valor={String(pacotesAtivos.length)}
          />
        </Link>
        <Link className="rounded-2xl transition hover:-translate-y-0.5" href="/painel/pacotes">
          <CardKpi
            cor={pacotesAcabando.length > 0 ? "perigo" : "roxo"}
            destaque={pacotesAcabando.length > 0 ? "neutro" : undefined}
            icone={TriangleAlert}
            label="Pacotes acabando"
            valor={String(pacotesAcabando.length)}
          />
        </Link>
        {tendenciaFaturamento ? (
          <Link className="rounded-2xl transition hover:-translate-y-0.5" href="/painel/financeiro">
            <CardKpi
              cor="brand"
              icone={Wallet}
              label="Faturamento do mês"
              tendencia={
                tendenciaFaturamento.percentual === null
                  ? undefined
                  : { percentual: tendenciaFaturamento.percentual, rotulo: "vs mês anterior" }
              }
              valor={formatadorMoeda.format(tendenciaFaturamento.valorCentavos / 100)}
            />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Atendimentos nos últimos 30 dias</h2>
        <GraficoAtendimentos pontos={pontosGrafico} />
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
