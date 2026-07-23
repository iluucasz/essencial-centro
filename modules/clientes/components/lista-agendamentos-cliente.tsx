"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Eye, Home, MapPin, Search, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { podeConfirmarPresenca } from "@/modules/agenda/checkin";
import { MenuAcoesAgendamento } from "@/modules/agenda/components/menu-acoes-agendamento";
import { BotaoConfirmarPresenca } from "@/modules/agenda/components/modal-confirmar-presenca";
import { BotaoDetalhesAgendamento } from "@/modules/agenda/components/modal-detalhes-agendamento";
import { BotaoRealizarAgendamento } from "@/modules/agenda/components/modal-realizar-agendamento";
import { BotaoConfirmarStatusAgendamento } from "@/modules/agenda/components/modal-status-agendamento";
import type { AgendamentoResumo } from "@/modules/agenda/components/tipos-agenda";
import { formatarHorarioPresenca } from "@/modules/agenda/formatacao";
import {
  modalidadeAtendimento,
  rotulosModalidadeAtendimento,
  rotulosStatusAgendamento,
  statusAgendamento,
  type ModalidadeAtendimento,
  type StatusAgendamento,
} from "@/modules/agenda/schema";
import type { SituacaoPagamento } from "@/modules/pacotes/schema";

type Opcao = { id: string; nome: string };

export type AgendamentoClienteLista = {
  id: string;
  clienteId: string;
  servicoId: string;
  profissionalId: string;
  pacoteId: string | null;
  inicio: Date | string;
  duracaoMinutos: number;
  status: StatusAgendamento;
  checkinEm: Date | string | null;
  modalidade: ModalidadeAtendimento;
  observacoes: string | null;
  pacoteQuantidadeSessoes: number | null;
  pacoteSituacaoPagamento: SituacaoPagamento | null;
  pacoteValorCentavos: number | null;
  servicoNome: string;
  servicoValorCentavos: number | null;
  profissionalNome: string | null;
};

type StatusFiltro = "todos" | StatusAgendamento;
type ModalidadeFiltro = "todas" | ModalidadeAtendimento;
type PacoteFiltro = "todos" | "sem-pacote" | string;

const classeFiltro =
  "h-10 min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

const classeStatusAgendamento: Record<StatusAgendamento, string> = {
  marcado: "bg-lilas/25 text-roxo",
  realizado: "bg-brand/15 text-brand",
  falta: "bg-dourado/20 text-dourado",
  cancelado: "bg-perigo/10 text-perigo",
};

const classeLinhaAgendamento: Record<StatusAgendamento, string> = {
  marcado: "border-l-roxo/45 bg-lilas/10",
  realizado: "border-l-brand/55 bg-brand/5",
  falta: "border-l-dourado/60 bg-dourado/10",
  cancelado: "border-l-perigo/55 bg-perigo/5",
};

const formatadorDataCurta = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
});

const formatadorHora = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

function paraData(data: Date | string) {
  return data instanceof Date ? data : new Date(data);
}

function valorMesAno(data: Date | string) {
  const dataNormalizada = paraData(data);
  const mes = String(dataNormalizada.getUTCMonth() + 1).padStart(2, "0");

  return `${dataNormalizada.getUTCFullYear()}-${mes}`;
}

function normalizarAgendamento(item: AgendamentoClienteLista, clienteNome: string) {
  return {
    ...item,
    checkinEm: item.checkinEm ? paraData(item.checkinEm) : null,
    clienteNome,
    inicio: paraData(item.inicio),
  } satisfies AgendamentoResumo & {
    profissionalId: string;
    servicoId: string;
  };
}

function textoBusca(item: AgendamentoClienteLista, clienteNome: string, pacoteNome?: string) {
  return [
    clienteNome,
    item.servicoNome,
    item.profissionalNome,
    pacoteNome,
    item.modalidade,
    rotulosStatusAgendamento[item.status],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function PainelVazio({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/90 p-6 text-sm text-muted">
      <span className="bg-menta rounded-2xl p-3 text-brand">
        <CalendarClock className="size-4" aria-hidden="true" />
      </span>
      {texto}
    </div>
  );
}

export function ListaAgendamentosCliente({
  agendamentos,
  clienteId,
  clienteNome,
  pacotes,
  profissionais,
  servicos,
}: {
  agendamentos: AgendamentoClienteLista[];
  clienteId: string;
  clienteNome: string;
  pacotes: Opcao[];
  profissionais: Opcao[];
  servicos: Opcao[];
}) {
  const [busca, setBusca] = useState("");
  const [mesAno, setMesAno] = useState("");
  const [pacote, setPacote] = useState<PacoteFiltro>("todos");
  const [status, setStatus] = useState<StatusFiltro>("todos");
  const [modalidade, setModalidade] = useState<ModalidadeFiltro>("todas");

  const nomePacotePorId = useMemo(
    () => new Map(pacotes.map((item) => [item.id, item.nome])),
    [pacotes],
  );

  const agendamentosOrdenados = useMemo(
    () =>
      [...agendamentos].sort((a, b) => paraData(a.inicio).getTime() - paraData(b.inicio).getTime()),
    [agendamentos],
  );

  const agendamentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return agendamentosOrdenados.filter((item) => {
      const pacoteNome = item.pacoteId ? nomePacotePorId.get(item.pacoteId) : undefined;
      const passaBusca = termo === "" || textoBusca(item, clienteNome, pacoteNome).includes(termo);
      const passaMesAno = mesAno === "" || valorMesAno(item.inicio) === mesAno;
      const passaPacote =
        pacote === "todos" ||
        (pacote === "sem-pacote" ? item.pacoteId === null : item.pacoteId === pacote);
      const passaStatus = status === "todos" || item.status === status;
      const passaModalidade = modalidade === "todas" || item.modalidade === modalidade;

      return passaBusca && passaMesAno && passaPacote && passaStatus && passaModalidade;
    });
  }, [
    agendamentosOrdenados,
    busca,
    clienteNome,
    mesAno,
    modalidade,
    nomePacotePorId,
    pacote,
    status,
  ]);

  if (agendamentos.length === 0) {
    return <PainelVazio texto="Nenhum agendamento registrado." />;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="grid gap-4 border-b border-border px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">Agendamentos</h3>
          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            {agendamentosFiltrados.length} de {agendamentos.length}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-background/60 p-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-12">
            <label className="grid min-w-0 gap-1.5 lg:col-span-3">
              <span className="text-xs font-semibold text-muted">Busca</span>
              <span className="relative min-w-0">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  className={cn(classeFiltro, "w-full pl-9")}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Atendimento ou profissional"
                  type="search"
                  value={busca}
                />
              </span>
            </label>

            <label className="grid min-w-0 gap-1.5 lg:col-span-2">
              <span className="text-xs font-semibold text-muted">Mês/ano</span>
              <input
                className={cn(classeFiltro, "w-full")}
                onChange={(event) => setMesAno(event.target.value)}
                type="month"
                value={mesAno}
              />
            </label>

            <label className="grid min-w-0 gap-1.5 lg:col-span-3">
              <span className="text-xs font-semibold text-muted">Pacote</span>
              <select
                className={classeFiltro}
                onChange={(event) => setPacote(event.target.value as PacoteFiltro)}
                value={pacote}
              >
                <option value="todos">Todos os pacotes</option>
                <option value="sem-pacote">Sessões avulsas</option>
                {pacotes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid min-w-0 gap-1.5 lg:col-span-2">
              <span className="text-xs font-semibold text-muted">Status</span>
              <select
                className={classeFiltro}
                onChange={(event) => setStatus(event.target.value as StatusFiltro)}
                value={status}
              >
                <option value="todos">Todos os status</option>
                {statusAgendamento.map((item) => (
                  <option key={item} value={item}>
                    {rotulosStatusAgendamento[item]}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid min-w-0 gap-1.5 lg:col-span-2">
              <span className="text-xs font-semibold text-muted">Modalidade</span>
              <select
                className={classeFiltro}
                onChange={(event) => setModalidade(event.target.value as ModalidadeFiltro)}
                value={modalidade}
              >
                <option value="todas">Todas modalidades</option>
                {modalidadeAtendimento.map((item) => (
                  <option key={item} value={item}>
                    {rotulosModalidadeAtendimento[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {agendamentosFiltrados.length === 0 ? (
        <PainelVazio texto="Nenhum agendamento encontrado com estes filtros." />
      ) : (
        <>
          <div className="hidden grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)_minmax(22rem,auto)] gap-4 border-b border-border bg-background px-4 py-3 text-xs font-medium text-muted md:grid">
            <span>Data</span>
            <span>Profissional</span>
            <span>Atendimento</span>
            <span>Status e ações</span>
          </div>
          <ul className="divide-y divide-border">
            {agendamentosFiltrados.map((item) => {
              const agendamento = normalizarAgendamento(item, clienteNome);

              return (
                <li
                  className={cn(
                    "grid gap-3 border-l-4 p-4 transition hover:bg-creme/35 md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)_minmax(22rem,auto)] md:items-center",
                    classeLinhaAgendamento[item.status],
                  )}
                  key={item.id}
                >
                  <BotaoDetalhesAgendamento
                    agendamento={agendamento}
                    className="grid min-w-0 gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo md:col-span-3 md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)] md:items-center"
                  >
                    <span className="grid gap-1">
                      <span className="text-base font-semibold text-foreground">
                        {formatadorHora.format(agendamento.inicio)}
                      </span>
                      <span className="text-xs font-medium text-muted">
                        {formatadorDataCurta.format(agendamento.inicio)}
                      </span>
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {item.profissionalNome ?? "Sem profissional"}
                      </span>
                      <span
                        className={cn(
                          "mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                          item.profissionalNome
                            ? "bg-lilas/25 text-roxo"
                            : "bg-background text-muted",
                        )}
                      >
                        <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">Profissional responsável</span>
                      </span>
                    </span>

                    <span className="min-w-0 text-sm text-muted">
                      <span className="block truncate font-medium text-foreground">
                        {item.servicoNome}
                      </span>
                      <span className="mt-1 block">{item.duracaoMinutos} min</span>
                      {item.pacoteId ? (
                        <span className="mt-2 inline-flex rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                          {nomePacotePorId.get(item.pacoteId) ?? "Pacote vinculado"}
                        </span>
                      ) : null}
                    </span>
                  </BotaoDetalhesAgendamento>

                  <div className="flex flex-col gap-2 md:items-end">
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          classeStatusAgendamento[item.status],
                        )}
                      >
                        {rotulosStatusAgendamento[item.status]}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted">
                        {item.modalidade === "domiciliar" ? (
                          <Home className="size-3" aria-hidden="true" />
                        ) : (
                          <MapPin className="size-3" aria-hidden="true" />
                        )}
                        {rotulosModalidadeAtendimento[item.modalidade]}
                      </span>

                      {agendamento.checkinEm ? (
                        <span className="text-xs font-medium text-muted">
                          Presença às {formatarHorarioPresenca(agendamento.checkinEm)}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <BotaoDetalhesAgendamento
                        agendamento={agendamento}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                      >
                        <Eye className="size-3.5" aria-hidden="true" />
                        Ver
                      </BotaoDetalhesAgendamento>

                      {item.status === "marcado" ? (
                        <>
                          {podeConfirmarPresenca(item.status, agendamento.checkinEm) ? (
                            <BotaoConfirmarPresenca agendamento={agendamento} />
                          ) : null}

                          <BotaoRealizarAgendamento agendamento={agendamento} />
                          <BotaoConfirmarStatusAgendamento
                            agendamentoId={item.id}
                            clienteNome={clienteNome}
                            inicio={agendamento.inicio}
                            servicoNome={item.servicoNome}
                            status="falta"
                          />
                          <BotaoConfirmarStatusAgendamento
                            agendamentoId={item.id}
                            clienteNome={clienteNome}
                            inicio={agendamento.inicio}
                            servicoNome={item.servicoNome}
                            status="cancelado"
                          />
                        </>
                      ) : null}

                      <MenuAcoesAgendamento
                        agendamento={agendamento}
                        clienteFixoId={clienteId}
                        clientes={[]}
                        pacotes={pacotes}
                        profissionais={profissionais}
                        servicos={servicos}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
