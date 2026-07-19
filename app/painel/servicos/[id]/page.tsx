import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  PackageCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import { CardKpi } from "@/components/ui/card-kpi";
import { agoraBrasilia } from "@/lib/utils";
import { listarAgendamentosDoServico } from "@/modules/agenda/queries";
import { rotulosStatusAgendamento, type StatusAgendamento } from "@/modules/agenda/schema";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { listarPacotesDoServico } from "@/modules/pacotes/queries";
import { rotulosSituacaoPagamento, type SituacaoPagamento } from "@/modules/pacotes/schema";
import { podeGerenciarServicos } from "@/modules/servicos/acesso";
import { MenuAcoesServico } from "@/modules/servicos/components/menu-acoes-servico";
import { listarOpcoesServico, obterServico } from "@/modules/servicos/queries";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });
const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatarValor(valorCentavos: number | null) {
  return valorCentavos === null ? "A definir" : formatadorMoeda.format(valorCentavos / 100);
}

const classePorStatusAgendamento: Record<StatusAgendamento, string> = {
  marcado: "bg-lilas/25 text-roxo",
  realizado: "bg-brand/15 text-brand",
  falta: "bg-dourado/20 text-dourado",
  cancelado: "bg-perigo/10 text-perigo",
};

const classePorSituacaoPagamento: Record<SituacaoPagamento, string> = {
  pendente: "bg-dourado/20 text-dourado",
  parcial: "bg-lilas/25 text-roxo",
  pago: "bg-brand/15 text-brand",
};

function CampoDetalhe({ label, valor }: { label: string; valor: string | null }) {
  if (!valor) return null;

  return (
    <div className="grid gap-1">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="text-sm whitespace-pre-line text-foreground">{valor}</p>
    </div>
  );
}

export default async function ServicoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuarioAtual = await exigirUsuarioAtual(["profissional", "recepcao"]);
  const podeGerenciar = podeGerenciarServicos(usuarioAtual);

  const [servico, pacotes, agendamentos] = await Promise.all([
    obterServico(id),
    listarPacotesDoServico(id),
    listarAgendamentosDoServico(id),
  ]);

  if (!servico) {
    notFound();
  }

  const [opcoesGrupo, opcoesPeriodicidade] = podeGerenciar
    ? await Promise.all([listarOpcoesServico("grupo"), listarOpcoesServico("periodicidade")])
    : [[], []];

  const receitaCentavos = pacotes.reduce((total, p) => total + (p.valorCentavos ?? 0), 0);
  const agora = agoraBrasilia();
  const proximoAgendamento = agendamentos
    .filter((a) => a.status === "marcado" && a.inicio >= agora)
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())[0];

  return (
    <div className="grid gap-6">
      <Link
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
        href="/painel/servicos"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para serviços
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg bg-lilas/35 p-2 text-roxo">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-brand">{servico.nome}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-lilas/25 px-2.5 py-1 text-xs font-medium text-roxo">
                {servico.grupo}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  servico.ativo ? "bg-brand/15 text-brand" : "bg-perigo/15 text-perigo"
                }`}
              >
                {servico.ativo ? "Ativo" : "Inativo"}
              </span>
              {servico.periodicidade ? (
                <span className="rounded-full bg-creme px-2.5 py-1 text-xs font-medium text-muted">
                  {servico.periodicidade}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        {podeGerenciar ? (
          <MenuAcoesServico
            opcoesGrupo={opcoesGrupo}
            opcoesPeriodicidade={opcoesPeriodicidade}
            servico={servico}
          />
        ) : null}
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CardKpi
          cor="roxo"
          icone={PackageCheck}
          label="Pacotes vinculados"
          valor={String(pacotes.length)}
        />
        <CardKpi
          cor="brand"
          icone={CalendarDays}
          label="Agendamentos vinculados"
          valor={String(agendamentos.length)}
        />
        <CardKpi
          cor="dourado"
          icone={Wallet}
          label="Receita em pacotes"
          valor={formatarValor(receitaCentavos)}
        />
        <CardKpi
          cor="roxo"
          icone={CalendarClock}
          label="Próximo agendamento"
          valor={
            proximoAgendamento ? formatadorDataHora.format(proximoAgendamento.inicio) : "Nenhum"
          }
        />
      </section>

      <section className="grid gap-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Detalhes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoDetalhe label="Duração" valor={`${servico.duracaoMinutos} minutos`} />
          <CampoDetalhe label="Valor" valor={formatarValor(servico.valorCentavos)} />
          <CampoDetalhe label="Descrição" valor={servico.descricao} />
          <CampoDetalhe label="Indicação" valor={servico.indicacao} />
          <CampoDetalhe label="Contraindicações" valor={servico.contraindicacoes} />
          <CampoDetalhe label="Preparo prévio" valor={servico.preparo} />
          <CampoDetalhe label="Cuidados posteriores" valor={servico.cuidadosPosteriores} />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
        <div className="border-b border-border pb-5">
          <h2 className="text-base font-semibold text-foreground">Pacotes vinculados</h2>
          <p className="mt-1 text-sm text-muted">
            {pacotes.length} {pacotes.length === 1 ? "pacote" : "pacotes"}
          </p>
        </div>
        {pacotes.length === 0 ? (
          <p className="pt-5 text-sm text-muted">
            Nenhum pacote contratado com este serviço ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {pacotes.map((pacote) => (
              <li key={pacote.id}>
                <Link
                  className="flex flex-wrap items-center justify-between gap-3 px-1 py-4 transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-roxo"
                  href={`/painel/clientes/${pacote.clienteId}`}
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">{pacote.clienteNome}</span>
                    <span className="mt-1 block text-sm text-muted">
                      {pacote.quantidadeSessoes} sessões · {formatarValor(pacote.valorCentavos)}
                      {pacote.validade
                        ? ` · válido até ${formatadorData.format(pacote.validade)}`
                        : ""}
                      {pacote.ativo ? "" : " · inativo"}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${classePorSituacaoPagamento[pacote.situacaoPagamento]}`}
                  >
                    {rotulosSituacaoPagamento[pacote.situacaoPagamento]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
        <div className="border-b border-border pb-5">
          <h2 className="text-base font-semibold text-foreground">Agendamentos vinculados</h2>
          <p className="mt-1 text-sm text-muted">
            {agendamentos.length} {agendamentos.length === 1 ? "agendamento" : "agendamentos"}
          </p>
        </div>
        {agendamentos.length === 0 ? (
          <p className="pt-5 text-sm text-muted">Nenhum agendamento com este serviço ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {agendamentos.map((item) => (
              <li key={item.id}>
                <Link
                  className="flex flex-wrap items-center justify-between gap-3 px-1 py-4 transition hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-roxo"
                  href={`/painel/clientes/${item.clienteId}`}
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">{item.clienteNome}</span>
                    <span className="mt-1 flex items-center gap-2 text-sm text-muted">
                      <CalendarDays className="size-4 text-roxo" aria-hidden="true" />
                      {formatadorDataHora.format(item.inicio)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${classePorStatusAgendamento[item.status]}`}
                  >
                    {rotulosStatusAgendamento[item.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
