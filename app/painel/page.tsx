import type { ComponentType } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CalendarX,
  CheckCircle2,
  ChevronRight,
  Clock3,
  PackageCheck,
  PackageX,
  Pill,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  UsersRound,
  Wallet,
} from "lucide-react";

import { cn, calcularVariacaoPercentual, primeiroDiaDoMes, ultimoDiaDoMes } from "@/lib/utils";
import { GraficoAtendimentos } from "@/modules/agenda/components/grafico-atendimentos";
import { listarAgendamentosDoDia, listarAgendamentosUltimosDias } from "@/modules/agenda/queries";
import type { StatusAgendamento } from "@/modules/agenda/schema";
import { agruparAgendamentosPorDia } from "@/modules/agenda/tendencia";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { listarClientes } from "@/modules/clientes/queries";
import { contarLotesProximosDoVencimento, listarProdutos } from "@/modules/estoque/queries";
import { listarLancamentos } from "@/modules/financeiro/queries";
import { calcularResumoFinanceiro } from "@/modules/financeiro/resumo";
import { contarMedicamentosPendentesVerificacao } from "@/modules/medicamentos/queries";
import { deveAvisarPacoteAcabando } from "@/modules/pacotes/progresso";
import { listarPacotes } from "@/modules/pacotes/queries";
import { contarClientesNovos } from "@/modules/relatorios/resumo";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorHorario = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const coresMetrica = {
  brand: "text-brand",
  roxo: "text-roxo",
  dourado: "text-dourado",
  perigo: "text-perigo",
} as const;

const classesStatusAgenda: Record<StatusAgendamento, string> = {
  marcado: "bg-lilas/25 text-roxo",
  realizado: "bg-brand/15 text-brand",
  falta: "bg-dourado/20 text-dourado",
  cancelado: "bg-perigo/10 text-perigo",
};

const rotulosStatusPainel: Record<StatusAgendamento, string> = {
  marcado: "Agendado",
  realizado: "Realizado",
  falta: "Falta",
  cancelado: "Cancelado",
};

type IconePainel = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

function formatarDuracao(minutos: number) {
  return `${minutos}min`;
}

function MetricaPainel({
  href,
  icone: Icone,
  label,
  valor,
  cor = "brand",
  tendencia,
}: {
  href: string;
  icone: IconePainel;
  label: string;
  valor: string;
  cor?: keyof typeof coresMetrica;
  tendencia?: { percentual: number; rotulo: string };
}) {
  return (
    <Link
      className="group flex min-h-28 flex-col gap-3 p-4 transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:p-5"
      href={href}
    >
      <span className="flex items-center gap-2 text-sm text-muted">
        <Icone className={cn("size-4 shrink-0", coresMetrica[cor])} aria-hidden={true} />
        <span>{label}</span>
      </span>
      <span className="text-2xl leading-none font-semibold text-foreground">{valor}</span>
      {tendencia ? (
        <span className="mt-auto flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "flex items-center gap-0.5 font-medium",
              tendencia.percentual >= 0 ? "text-brand" : "text-perigo",
            )}
          >
            {tendencia.percentual >= 0 ? (
              <TrendingUp className="size-3" aria-hidden="true" />
            ) : (
              <TrendingDown className="size-3" aria-hidden="true" />
            )}
            {Math.abs(tendencia.percentual)}%
          </span>
          <span className="text-muted">{tendencia.rotulo}</span>
        </span>
      ) : (
        <span className="mt-auto text-xs font-medium text-roxo opacity-0 transition group-hover:opacity-100">
          Abrir
        </span>
      )}
    </Link>
  );
}

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

async function obterAlertasOperacionais() {
  const [produtos, lotesVencendo, medicamentosPendentes] = await Promise.all([
    listarProdutos(),
    contarLotesProximosDoVencimento(),
    contarMedicamentosPendentesVerificacao(),
  ]);

  return {
    estoqueBaixo: produtos.filter((p) => p.avisoEstoqueBaixo).length,
    lotesVencendo,
    medicamentosPendentes,
  };
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
  const alertasOperacionais =
    usuario.role === "profissional" ? await obterAlertasOperacionais() : null;

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
  const alertasCompactos = alertasOperacionais
    ? [
        {
          href: "/painel/estoque",
          icone: PackageX,
          label: "Estoque baixo",
          valor: alertasOperacionais.estoqueBaixo,
        },
        {
          href: "/painel/estoque",
          icone: CalendarX,
          label: "Produtos vencendo",
          valor: alertasOperacionais.lotesVencendo,
        },
        {
          href: "/painel/clientes",
          icone: Pill,
          label: "Medicamentos pendentes",
          valor: alertasOperacionais.medicamentosPendentes,
        },
      ]
    : [];

  return (
    <div className="grid gap-6">
      <div>
        <p className="mb-3 inline-flex rounded-full bg-lilas/25 px-3 py-1 text-xs font-medium text-roxo">
          Área profissional
        </p>
        <h1 className="text-2xl font-semibold text-brand">Olá, {usuario.name ?? usuario.email}</h1>
        <p className="mt-1 text-sm text-muted">Resumo do dia na clínica.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div
          className={cn(
            "grid divide-y divide-border",
            tendenciaFaturamento
              ? "sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5"
              : "sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4",
          )}
        >
          <MetricaPainel
            cor="roxo"
            href="/painel/agenda"
            icone={CalendarClock}
            label="Atendimentos hoje"
            valor={String(agendamentosHoje.length)}
          />
          <MetricaPainel
            cor="brand"
            href="/painel/clientes"
            icone={UsersRound}
            label="Clientes cadastrados"
            tendencia={
              percentualCrescimentoClientes === null
                ? undefined
                : { percentual: percentualCrescimentoClientes, rotulo: "vs base anterior" }
            }
            valor={String(clientes.length)}
          />
          <MetricaPainel
            cor="dourado"
            href="/painel/pacotes"
            icone={PackageCheck}
            label="Pacotes ativos"
            valor={String(pacotesAtivos.length)}
          />
          <MetricaPainel
            cor={pacotesAcabando.length > 0 ? "perigo" : "roxo"}
            href="/painel/pacotes"
            icone={TriangleAlert}
            label="Pacotes acabando"
            valor={String(pacotesAcabando.length)}
          />
          {tendenciaFaturamento ? (
            <MetricaPainel
              cor="brand"
              href="/painel/financeiro"
              icone={Wallet}
              label="Faturamento do mês"
              tendencia={
                tendenciaFaturamento.percentual === null
                  ? undefined
                  : { percentual: tendenciaFaturamento.percentual, rotulo: "vs mês anterior" }
              }
              valor={formatadorMoeda.format(tendenciaFaturamento.valorCentavos / 100)}
            />
          ) : null}
        </div>
      </section>

      {alertasCompactos.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
            {alertasCompactos.map((alerta) => {
              const Icone = alerta.icone;
              const temPendencia = alerta.valor > 0;

              return (
                <Link
                  key={alerta.label}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:px-5"
                  href={alerta.href}
                >
                  <span className="flex items-center gap-2 text-muted">
                    <Icone
                      className={cn("size-4", temPendencia ? "text-perigo" : "text-roxo")}
                      aria-hidden={true}
                    />
                    {alerta.label}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      temPendencia ? "bg-perigo/10 text-perigo" : "bg-lilas/25 text-roxo",
                    )}
                  >
                    {alerta.valor}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
            <h2 className="text-lg font-semibold text-foreground">Agenda de hoje</h2>
            <Link
              className="inline-flex items-center gap-1 text-sm font-medium text-brand transition hover:text-roxo"
              href="/painel/agenda"
            >
              Ver completo
              <ChevronRight className="size-4" aria-hidden={true} />
            </Link>
          </div>

          {agendamentosHoje.length === 0 ? (
            <div className="p-6 text-sm text-muted">Nenhum atendimento marcado para hoje.</div>
          ) : (
            <ul className="divide-y divide-border">
              {agendamentosHoje.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  className="grid gap-3 px-4 py-4 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-5"
                >
                  <div>
                    <span className="text-xs text-muted">horário</span>
                    <span className="block text-lg leading-tight font-semibold text-foreground">
                      {formatadorHorario.format(a.inicio)}
                    </span>
                  </div>
                  <div className="min-w-0 border-l-2 border-brand pl-4">
                    <p className="truncate font-medium text-foreground">{a.clienteNome}</p>
                    <p className="mt-0.5 truncate text-sm text-muted">{a.servicoNome}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                        classesStatusAgenda[a.status],
                      )}
                    >
                      {a.status === "realizado" ? (
                        <CheckCircle2 className="size-3" aria-hidden={true} />
                      ) : null}
                      {a.checkinEm && a.status === "marcado"
                        ? "Check-in feito"
                        : rotulosStatusPainel[a.status]}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                      <Clock3 className="size-3" aria-hidden={true} />
                      {formatarDuracao(a.duracaoMinutos)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
            <h2 className="text-lg font-semibold text-foreground">Pacotes ativos</h2>
            <Link
              className="inline-flex items-center gap-1 text-sm font-medium text-brand transition hover:text-roxo"
              href="/painel/pacotes"
            >
              Ver todos
              <ChevronRight className="size-4" aria-hidden={true} />
            </Link>
          </div>

          {pacotesAtivos.length === 0 ? (
            <div className="p-6 text-sm text-muted">Nenhum pacote ativo no momento.</div>
          ) : (
            <ul className="divide-y divide-border">
              {pacotesAtivos.slice(0, 5).map((pacote) => (
                <li key={pacote.id} className="px-4 py-4 sm:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{pacote.clienteNome}</p>
                      <p className="mt-1 truncate text-sm text-muted">{pacote.servicoNome}</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-muted">
                      {pacote.progresso.sessoesRealizadas}/{pacote.progresso.quantidadeSessoes}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-creme">
                    <span
                      className="block h-full rounded-full bg-brand"
                      style={{ width: `${pacote.progresso.percentualConcluido}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {pacote.progresso.percentualConcluido}% concluído
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <h2 className="text-lg font-semibold text-foreground">
            Atendimentos nos últimos 30 dias
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <GraficoAtendimentos pontos={pontosGrafico} />
        </div>
      </section>
    </div>
  );
}
