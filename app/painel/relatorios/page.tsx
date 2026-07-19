import { ArrowUpCircle, CalendarCheck, Scale, UserPlus, UsersRound, Wallet } from "lucide-react";

import { CampoDataCalendario } from "@/components/ui/calendario-tailgrids";
import { CardKpi } from "@/components/ui/card-kpi";
import { agoraBrasilia, primeiroDiaDoMes, ultimoDiaDoMes } from "@/lib/utils";
import { rotulosStatusAgendamento, statusAgendamento } from "@/modules/agenda/schema";
import { obterRelatorioPeriodo } from "@/modules/relatorios/queries";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });

function paraDataInputValue(data: Date) {
  return data.toISOString().slice(0, 10);
}

function parseDataInicio(valor: string | undefined, padrao: Date) {
  if (!valor) return padrao;

  const data = new Date(`${valor}T00:00:00.000Z`);

  return Number.isNaN(data.getTime()) ? padrao : data;
}

function parseDataFim(valor: string | undefined, padrao: Date) {
  if (!valor) return padrao;

  const data = new Date(`${valor}T23:59:59.999Z`);

  return Number.isNaN(data.getTime()) ? padrao : data;
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string }>;
}) {
  const { fim: fimParam, inicio: inicioParam } = await searchParams;

  const hoje = agoraBrasilia();
  const inicio = parseDataInicio(inicioParam, primeiroDiaDoMes(hoje));
  const fim = parseDataFim(fimParam, ultimoDiaDoMes(hoje));

  const relatorio = await obterRelatorioPeriodo(inicio, fim);

  return (
    <div className="grid min-w-0 gap-6 sm:gap-8">
      <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-brand">Relatórios</h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground">
            Visão consolidada de agenda, clientes e financeiro no período.
          </p>
        </div>

        <form
          action="/painel/relatorios"
          className="grid w-full min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end lg:w-auto lg:grid-cols-[12rem_12rem_auto]"
        >
          <CampoDataCalendario
            defaultValue={paraDataInputValue(inicio)}
            label="De"
            name="inicio"
            required
          />
          <CampoDataCalendario
            defaultValue={paraDataInputValue(fim)}
            label="Até"
            name="fim"
            required
          />
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            type="submit"
          >
            Ver período
          </button>
        </form>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] items-stretch gap-4">
        <CardKpi
          icone={ArrowUpCircle}
          label="Faturamento"
          valor={formatadorMoeda.format(relatorio.financeiro.receitasPagas / 100)}
        />
        <CardKpi
          icone={Scale}
          label="Saldo"
          valor={formatadorMoeda.format(relatorio.financeiro.saldo / 100)}
        />
        <CardKpi
          icone={Wallet}
          label="Despesas"
          valor={formatadorMoeda.format(relatorio.financeiro.despesasPagas / 100)}
        />
        <CardKpi
          icone={CalendarCheck}
          label="Taxa de comparecimento"
          valor={`${relatorio.taxaComparecimento}%`}
        />
        <CardKpi
          icone={UsersRound}
          label="Atendimentos realizados"
          valor={String(relatorio.agendamentosPorStatus.realizado)}
        />
        <CardKpi icone={UserPlus} label="Novos clientes" valor={String(relatorio.clientesNovos)} />
      </div>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold text-foreground">Agendamentos por status</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
          {statusAgendamento.map((status) => (
            <div key={status} className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-muted">{rotulosStatusAgendamento[status]}</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {relatorio.agendamentosPorStatus[status]}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold text-foreground">Serviços mais realizados</h2>
        {relatorio.rankingServicos.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            Nenhum atendimento realizado no período.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <ul className="divide-y divide-border">
              {relatorio.rankingServicos.map((item) => (
                <li
                  key={item.servicoNome}
                  className="grid gap-1 p-4 text-sm sm:flex sm:items-center sm:justify-between sm:gap-3"
                >
                  <span className="min-w-0 font-medium text-foreground">{item.servicoNome}</span>
                  <span className="shrink-0 text-muted">{item.total} atendimentos</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
