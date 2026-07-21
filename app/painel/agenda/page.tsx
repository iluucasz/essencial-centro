import Link from "next/link";
import { CalendarClock, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { ModalFormulario } from "@/components/ui/modal-formulario";
import { agoraBrasilia, cn } from "@/lib/utils";
import { listarProfissionaisAtivos } from "@/modules/auth/queries";
import { FiltrosAgenda } from "@/modules/agenda/components/filtros-agenda";
import { FormularioContrato } from "@/modules/agenda/components/formulario-contrato";
import { ListaAgenda } from "@/modules/agenda/components/lista-agenda";
import { BotaoDiaAgenda } from "@/modules/agenda/components/modal-dia-agenda";
import { RotaDomiciliar } from "@/modules/agenda/components/rota-domiciliar";
import {
  listarAgendamentosDaAgenda,
  listarParadasDomiciliaresDoDia,
} from "@/modules/agenda/queries";
import {
  modalidadeAtendimento,
  rotulosModalidadeAtendimento,
  rotulosStatusAgendamento,
  statusAgendamento,
  type ModalidadeAtendimento,
  type StatusAgendamento,
} from "@/modules/agenda/schema";
import { listarClientes } from "@/modules/clientes/queries";
import { listarServicosComPlanos } from "@/modules/planos/queries";

const visualizacoesAgenda = ["mes", "semana", "dia"] as const;
type VisualizacaoAgenda = (typeof visualizacoesAgenda)[number];
type AgendamentoDaAgenda = Awaited<ReturnType<typeof listarAgendamentosDaAgenda>>[number];

const rotulosVisualizacao: Record<VisualizacaoAgenda, string> = {
  mes: "Mês",
  semana: "Semana",
  dia: "Dia",
};

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const formatadorMesAno = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});
const formatadorDiaSemana = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
  weekday: "short",
});
const formatadorDataLonga = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeZone: "UTC",
});
const formatadorHorario = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const classesEventoPorStatus: Record<StatusAgendamento, string> = {
  marcado: "border-l-roxo bg-lilas/15 text-roxo",
  realizado: "border-l-brand bg-brand/10 text-brand",
  falta: "border-l-dourado bg-dourado/15 text-dourado",
  cancelado: "border-l-perigo bg-perigo/10 text-perigo",
};

function criarDataUtc(ano: number, mes: number, dia: number) {
  return new Date(Date.UTC(ano, mes, dia));
}

function formatarDataParam(data: Date) {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function hojeUtc() {
  const hoje = agoraBrasilia();

  return criarDataUtc(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate());
}

function parseData(valor: string | undefined) {
  if (!valor) return hojeUtc();

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!match) return hojeUtc();

  const data = criarDataUtc(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  return Number.isNaN(data.getTime()) ? hojeUtc() : data;
}

function adicionarDias(data: Date, dias: number) {
  return criarDataUtc(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate() + dias);
}

function adicionarMeses(data: Date, meses: number) {
  return criarDataUtc(data.getUTCFullYear(), data.getUTCMonth() + meses, 1);
}

function inicioDaSemana(data: Date) {
  return adicionarDias(data, -data.getUTCDay());
}

function inicioDaGradeMensal(data: Date) {
  const primeiroDiaDoMes = criarDataUtc(data.getUTCFullYear(), data.getUTCMonth(), 1);

  return adicionarDias(primeiroDiaDoMes, -primeiroDiaDoMes.getUTCDay());
}

function montarDias(inicio: Date, total: number) {
  return Array.from({ length: total }, (_, indice) => adicionarDias(inicio, indice));
}

function obterPeriodoBusca(data: Date, visualizacao: VisualizacaoAgenda) {
  if (visualizacao === "dia") {
    const inicio = criarDataUtc(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());

    return { inicio, fim: adicionarDias(inicio, 1) };
  }

  if (visualizacao === "semana") {
    const inicio = inicioDaSemana(data);

    return { inicio, fim: adicionarDias(inicio, 7) };
  }

  const inicio = inicioDaGradeMensal(data);

  return { inicio, fim: adicionarDias(inicio, 42) };
}

function normalizarTexto(valor: string | null | undefined) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function agruparPorDia(agendamentos: AgendamentoDaAgenda[]) {
  const grupos = new Map<string, AgendamentoDaAgenda[]>();

  for (const agendamento of agendamentos) {
    const chave = formatarDataParam(agendamento.inicio);
    const lista = grupos.get(chave) ?? [];

    lista.push(agendamento);
    grupos.set(chave, lista);
  }

  return grupos;
}

function hrefAgenda({
  busca,
  cliente,
  data,
  modalidade,
  profissional,
  servico,
  status,
  visualizacao,
}: {
  busca?: string;
  cliente?: string;
  data: Date | string;
  modalidade?: string;
  profissional?: string;
  servico?: string;
  status?: string;
  visualizacao: VisualizacaoAgenda;
}) {
  const params = new URLSearchParams();

  params.set("data", typeof data === "string" ? data : formatarDataParam(data));
  params.set("visualizacao", visualizacao);
  if (busca) params.set("busca", busca);
  if (cliente) params.set("cliente", cliente);
  if (servico) params.set("servico", servico);
  if (profissional) params.set("profissional", profissional);
  if (status) params.set("status", status);
  if (modalidade) params.set("modalidade", modalidade);

  return `/painel/agenda?${params.toString()}`;
}

function normalizarVisualizacao(valor: string | undefined): VisualizacaoAgenda {
  return visualizacoesAgenda.includes(valor as VisualizacaoAgenda)
    ? (valor as VisualizacaoAgenda)
    : "mes";
}

function normalizarStatus(valor: string | undefined): string {
  return valor && statusAgendamento.includes(valor as StatusAgendamento) ? valor : "";
}

function normalizarModalidade(valor: string | undefined): string {
  return valor && modalidadeAtendimento.includes(valor as ModalidadeAtendimento) ? valor : "";
}

function filtrarAgendamentos({
  agendamentos,
  busca,
  cliente,
  modalidade,
  profissional,
  servico,
  status,
}: {
  agendamentos: AgendamentoDaAgenda[];
  busca: string;
  cliente: string;
  modalidade: string;
  profissional: string;
  servico: string;
  status: string;
}) {
  const termo = normalizarTexto(busca);

  return agendamentos.filter((agendamento) => {
    if (cliente && agendamento.clienteId !== cliente) return false;
    if (servico && agendamento.servicoId !== servico) return false;
    if (profissional && agendamento.profissionalId !== profissional) return false;
    if (status && agendamento.status !== status) return false;
    if (modalidade && agendamento.modalidade !== modalidade) return false;

    if (!termo) return true;

    const texto = normalizarTexto(
      `${agendamento.clienteNome} ${agendamento.servicoNome} ${agendamento.profissionalNome ?? ""}`,
    );

    return texto.includes(termo);
  });
}

function EventoCalendario({ agendamento }: { agendamento: AgendamentoDaAgenda }) {
  return (
    <span
      className={cn(
        "block truncate rounded-md border-l-2 px-2 py-1 text-xs font-medium",
        classesEventoPorStatus[agendamento.status],
      )}
    >
      {formatadorHorario.format(agendamento.inicio)} · {agendamento.clienteNome}
    </span>
  );
}

function DiasAgendaMobile({
  agendamentosPorDia,
  busca,
  cliente,
  dataSelecionada,
  dias,
  modalidade,
  profissional,
  servico,
  status,
}: {
  agendamentosPorDia: Map<string, AgendamentoDaAgenda[]>;
  busca: string;
  cliente: string;
  dataSelecionada: Date;
  dias: Date[];
  modalidade: string;
  profissional: string;
  servico: string;
  status: string;
}) {
  const diaSelecionado = formatarDataParam(dataSelecionada);

  return (
    <div className="grid gap-2 border-t border-border p-3 md:hidden">
      {dias.map((dia) => {
        const iso = formatarDataParam(dia);
        const agendamentos = agendamentosPorDia.get(iso) ?? [];
        const selecionado = iso === diaSelecionado;

        return (
          <BotaoDiaAgenda
            agendamentos={agendamentos}
            className={cn(
              "grid w-full gap-3 rounded-2xl border border-border bg-surface p-3 text-left transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo",
              selecionado && "border-roxo bg-lilas/15",
            )}
            data={dia}
            hrefDia={hrefAgenda({
              busca,
              cliente,
              data: iso,
              modalidade,
              profissional,
              servico,
              status,
              visualizacao: "dia",
            })}
            key={iso}
          >
            <span className="flex min-w-0 items-center justify-between gap-3">
              <span className="truncate text-sm font-semibold text-foreground">
                {formatadorDiaSemana.format(dia)}
              </span>
              <span className="shrink-0 rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand">
                {agendamentos.length}
              </span>
            </span>

            <span className="grid gap-1.5">
              {agendamentos.length === 0 ? (
                <span className="text-sm text-muted">Livre</span>
              ) : (
                agendamentos
                  .slice(0, 3)
                  .map((agendamento) => (
                    <EventoCalendario agendamento={agendamento} key={agendamento.id} />
                  ))
              )}
              {agendamentos.length > 3 ? (
                <span className="text-xs font-medium text-muted">
                  +{agendamentos.length - 3} agendamentos
                </span>
              ) : null}
            </span>
          </BotaoDiaAgenda>
        );
      })}
    </div>
  );
}

function GradeMensal({
  agendamentosPorDia,
  busca,
  cliente,
  dataSelecionada,
  modalidade,
  profissional,
  servico,
  status,
}: {
  agendamentosPorDia: Map<string, AgendamentoDaAgenda[]>;
  busca: string;
  cliente: string;
  dataSelecionada: Date;
  modalidade: string;
  profissional: string;
  servico: string;
  status: string;
}) {
  const inicio = inicioDaGradeMensal(dataSelecionada);
  const dias = montarDias(inicio, 42);
  const diasDoMes = dias.filter((dia) => dia.getUTCMonth() === dataSelecionada.getUTCMonth());
  const mesSelecionado = dataSelecionada.getUTCMonth();
  const diaSelecionado = formatarDataParam(dataSelecionada);

  return (
    <>
      <DiasAgendaMobile
        agendamentosPorDia={agendamentosPorDia}
        busca={busca}
        cliente={cliente}
        dataSelecionada={dataSelecionada}
        dias={diasDoMes}
        modalidade={modalidade}
        profissional={profissional}
        servico={servico}
        status={status}
      />
      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-7 border-y border-border bg-background text-xs font-medium text-muted">
            {diasSemana.map((dia) => (
              <div key={dia} className="px-4 py-4">
                {dia}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {dias.map((dia) => {
              const iso = formatarDataParam(dia);
              const agendamentos = agendamentosPorDia.get(iso) ?? [];
              const selecionado = iso === diaSelecionado;
              const foraDoMes = dia.getUTCMonth() !== mesSelecionado;

              return (
                <BotaoDiaAgenda
                  agendamentos={agendamentos}
                  key={iso}
                  className={cn(
                    "block min-h-36 w-full border-r border-b border-border p-3 text-left transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo",
                    foraDoMes && "text-muted/60",
                    selecionado && "bg-lilas/15 ring-1 ring-roxo/30",
                  )}
                  data={dia}
                  hrefDia={hrefAgenda({
                    busca,
                    cliente,
                    data: iso,
                    modalidade,
                    profissional,
                    servico,
                    status,
                    visualizacao: "dia",
                  })}
                >
                  <span className="text-sm font-semibold text-foreground">{dia.getUTCDate()}</span>
                  <span className="mt-3 grid gap-1">
                    {agendamentos.slice(0, 3).map((agendamento) => (
                      <EventoCalendario agendamento={agendamento} key={agendamento.id} />
                    ))}
                    {agendamentos.length > 3 ? (
                      <span className="text-xs font-medium text-muted">
                        +{agendamentos.length - 3} agendamentos
                      </span>
                    ) : null}
                  </span>
                </BotaoDiaAgenda>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function GradeSemana({
  agendamentosPorDia,
  busca,
  cliente,
  dataSelecionada,
  modalidade,
  profissional,
  servico,
  status,
}: {
  agendamentosPorDia: Map<string, AgendamentoDaAgenda[]>;
  busca: string;
  cliente: string;
  dataSelecionada: Date;
  modalidade: string;
  profissional: string;
  servico: string;
  status: string;
}) {
  const dias = montarDias(inicioDaSemana(dataSelecionada), 7);
  const diaSelecionado = formatarDataParam(dataSelecionada);

  return (
    <>
      <DiasAgendaMobile
        agendamentosPorDia={agendamentosPorDia}
        busca={busca}
        cliente={cliente}
        dataSelecionada={dataSelecionada}
        dias={dias}
        modalidade={modalidade}
        profissional={profissional}
        servico={servico}
        status={status}
      />
      <div className="hidden overflow-x-auto md:block">
        <div className="grid min-w-[980px] grid-cols-7 divide-x divide-border border-t border-border">
          {dias.map((dia) => {
            const iso = formatarDataParam(dia);
            const agendamentos = agendamentosPorDia.get(iso) ?? [];

            return (
              <BotaoDiaAgenda
                agendamentos={agendamentos}
                key={iso}
                className={cn(
                  "block min-h-96 w-full p-4 text-left transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo",
                  iso === diaSelecionado && "bg-lilas/15",
                )}
                data={dia}
                hrefDia={hrefAgenda({
                  busca,
                  cliente,
                  data: iso,
                  modalidade,
                  profissional,
                  servico,
                  status,
                  visualizacao: "dia",
                })}
              >
                <span className="text-xs font-medium text-muted">
                  {formatadorDiaSemana.format(dia)}
                </span>
                <span className="mt-3 grid gap-1.5">
                  {agendamentos.length === 0 ? (
                    <span className="text-xs text-muted">Livre</span>
                  ) : (
                    agendamentos.map((agendamento) => (
                      <EventoCalendario agendamento={agendamento} key={agendamento.id} />
                    ))
                  )}
                </span>
              </BotaoDiaAgenda>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string;
    cliente?: string;
    data?: string;
    modalidade?: string;
    profissional?: string;
    servico?: string;
    status?: string;
    visualizacao?: string;
  }>;
}) {
  const params = await searchParams;
  const dataSelecionada = parseData(params.data);
  const visualizacao = normalizarVisualizacao(params.visualizacao);
  const busca = params.busca?.trim() ?? "";
  const clienteFiltro = params.cliente ?? "";
  const servicoFiltro = params.servico ?? "";
  const profissionalFiltro = params.profissional ?? "";
  const statusFiltro = normalizarStatus(params.status);
  const modalidadeFiltro = normalizarModalidade(params.modalidade);
  const periodo = obterPeriodoBusca(dataSelecionada, visualizacao);

  const [agendamentosPeriodo, paradasDomiciliares, clientes, servicos, profissionais] =
    await Promise.all([
      listarAgendamentosDaAgenda(periodo.inicio, periodo.fim),
      listarParadasDomiciliaresDoDia(dataSelecionada),
      listarClientes(),
      listarServicosComPlanos(),
      listarProfissionaisAtivos(),
    ]);

  const agendamentosFiltrados = filtrarAgendamentos({
    agendamentos: agendamentosPeriodo,
    busca,
    cliente: clienteFiltro,
    modalidade: modalidadeFiltro,
    profissional: profissionalFiltro,
    servico: servicoFiltro,
    status: statusFiltro,
  });
  const agendamentosPorDia = agruparPorDia(agendamentosFiltrados);
  const agendamentosDia = agendamentosPorDia.get(formatarDataParam(dataSelecionada)) ?? [];
  const dataAnterior =
    visualizacao === "mes"
      ? adicionarMeses(dataSelecionada, -1)
      : adicionarDias(dataSelecionada, visualizacao === "semana" ? -7 : -1);
  const proximaData =
    visualizacao === "mes"
      ? adicionarMeses(dataSelecionada, 1)
      : adicionarDias(dataSelecionada, visualizacao === "semana" ? 7 : 1);
  const tituloPeriodoAgenda =
    visualizacao === "semana"
      ? `${formatadorDiaSemana.format(periodo.inicio)} - ${formatadorDiaSemana.format(
          adicionarDias(periodo.fim, -1),
        )}`
      : visualizacao === "dia"
        ? formatadorDataLonga.format(dataSelecionada)
        : formatadorMesAno.format(dataSelecionada);

  return (
    <div className="grid min-w-0 gap-6">
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <CalendarClock className="size-4" aria-hidden="true" />
            Agenda
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-brand">Calendário de atendimentos</h1>
        </div>

        <ModalFormulario
          icone={<Plus className="size-4" aria-hidden />}
          rotuloBotao="Novo agendamento"
          titulo="Novo agendamento"
        >
          <FormularioContrato
            clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
            profissionais={profissionais.map((p) => ({
              id: p.id,
              nome: p.name ?? p.email ?? "",
            }))}
            servicos={servicos}
          />
        </ModalFormulario>
      </header>

      <FiltrosAgenda
        busca={busca}
        cliente={clienteFiltro}
        clientes={clientes.map((cliente) => ({ id: cliente.id, nome: cliente.nome }))}
        data={formatarDataParam(dataSelecionada)}
        key={`${formatarDataParam(dataSelecionada)}:${visualizacao}:${busca}:${clienteFiltro}:${servicoFiltro}:${profissionalFiltro}:${statusFiltro}:${modalidadeFiltro}`}
        limparHref={hrefAgenda({ data: dataSelecionada, visualizacao })}
        modalidade={modalidadeFiltro}
        modalidades={modalidadeAtendimento.map((modalidade) => ({
          id: modalidade,
          nome: rotulosModalidadeAtendimento[modalidade],
        }))}
        profissional={profissionalFiltro}
        profissionais={profissionais.map((profissional) => ({
          id: profissional.id,
          nome: profissional.name ?? profissional.email ?? "",
        }))}
        servico={servicoFiltro}
        servicos={servicos.map((servico) => ({ id: servico.id, nome: servico.nome }))}
        status={statusFiltro}
        statusOpcoes={statusAgendamento.map((status) => ({
          id: status,
          nome: rotulosStatusAgendamento[status],
        }))}
        visualizacao={visualizacao}
      />

      <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Link
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-muted transition hover:bg-creme hover:text-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              href={hrefAgenda({
                busca,
                cliente: clienteFiltro,
                data: dataAnterior,
                modalidade: modalidadeFiltro,
                profissional: profissionalFiltro,
                servico: servicoFiltro,
                status: statusFiltro,
                visualizacao,
              })}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="sr-only">Anterior</span>
            </Link>
            <Link
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-muted transition hover:bg-creme hover:text-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              href={hrefAgenda({
                busca,
                cliente: clienteFiltro,
                data: proximaData,
                modalidade: modalidadeFiltro,
                profissional: profissionalFiltro,
                servico: servicoFiltro,
                status: statusFiltro,
                visualizacao,
              })}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
              <span className="sr-only">Próximo</span>
            </Link>
            <Link
              className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:flex-none"
              href={hrefAgenda({
                busca,
                cliente: clienteFiltro,
                data: hojeUtc(),
                modalidade: modalidadeFiltro,
                profissional: profissionalFiltro,
                servico: servicoFiltro,
                status: statusFiltro,
                visualizacao,
              })}
            >
              Hoje
            </Link>
          </div>

          <div className="order-first min-w-0 text-center sm:order-none sm:w-auto">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Agenda</p>
            <h2 className="mt-1 text-lg font-semibold text-brand">{tituloPeriodoAgenda}</h2>
          </div>

          <div className="grid w-full grid-cols-3 rounded-lg bg-background p-1 sm:flex sm:w-auto">
            {visualizacoesAgenda.map((item) => (
              <Link
                className={cn(
                  "inline-flex h-9 min-w-0 items-center justify-center rounded-md px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:px-4",
                  visualizacao === item
                    ? "bg-surface text-roxo shadow-sm"
                    : "text-muted hover:text-foreground",
                )}
                href={hrefAgenda({
                  busca,
                  cliente: clienteFiltro,
                  data: dataSelecionada,
                  modalidade: modalidadeFiltro,
                  profissional: profissionalFiltro,
                  servico: servicoFiltro,
                  status: statusFiltro,
                  visualizacao: item,
                })}
                key={item}
              >
                {rotulosVisualizacao[item]}
              </Link>
            ))}
          </div>
        </div>

        {visualizacao === "semana" ? (
          <GradeSemana
            agendamentosPorDia={agendamentosPorDia}
            busca={busca}
            cliente={clienteFiltro}
            dataSelecionada={dataSelecionada}
            modalidade={modalidadeFiltro}
            profissional={profissionalFiltro}
            servico={servicoFiltro}
            status={statusFiltro}
          />
        ) : visualizacao === "dia" ? (
          <div className="border-t border-border p-4">
            <ListaAgenda agendamentos={agendamentosDia} />
          </div>
        ) : (
          <GradeMensal
            agendamentosPorDia={agendamentosPorDia}
            busca={busca}
            cliente={clienteFiltro}
            dataSelecionada={dataSelecionada}
            modalidade={modalidadeFiltro}
            profissional={profissionalFiltro}
            servico={servicoFiltro}
            status={statusFiltro}
          />
        )}
      </section>

      <RotaDomiciliar paradas={paradasDomiciliares} />

      {visualizacao === "dia" ? null : (
        <section className="grid gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Agenda do dia</h2>
            <p className="mt-1 text-sm text-muted">{formatadorDataLonga.format(dataSelecionada)}</p>
          </div>
          <ListaAgenda agendamentos={agendamentosDia} />
        </section>
      )}
    </div>
  );
}
