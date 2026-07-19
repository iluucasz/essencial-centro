"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

type OpcaoFiltro = { id: string; nome: string };
type CampoFiltroAgenda = "busca" | "cliente" | "servico" | "profissional" | "status" | "modalidade";
type ValoresFiltroAgenda = Record<CampoFiltroAgenda, string>;

function SelectFiltro({
  label,
  name,
  onChange,
  opcoes,
  value,
}: {
  label: string;
  name: CampoFiltroAgenda;
  onChange: (name: CampoFiltroAgenda, value: string) => void;
  opcoes: OpcaoFiltro[];
  value: string;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted">
      {label}
      <select
        className="h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm font-normal text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        value={value}
      >
        <option value="">Todos</option>
        {opcoes.map((opcao) => (
          <option key={opcao.id} value={opcao.id}>
            {opcao.nome}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FiltrosAgenda({
  busca,
  cliente,
  clientes,
  data,
  limparHref,
  modalidade,
  modalidades,
  profissional,
  profissionais,
  servico,
  servicos,
  status,
  statusOpcoes,
  visualizacao,
}: {
  busca: string;
  cliente: string;
  clientes: OpcaoFiltro[];
  data: string;
  limparHref: string;
  modalidade: string;
  modalidades: OpcaoFiltro[];
  profissional: string;
  profissionais: OpcaoFiltro[];
  servico: string;
  servicos: OpcaoFiltro[];
  status: string;
  statusOpcoes: OpcaoFiltro[];
  visualizacao: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerBuscaRef = useRef<number | null>(null);
  const [valores, setValores] = useState<ValoresFiltroAgenda>({
    busca,
    cliente,
    modalidade,
    profissional,
    servico,
    status,
  });

  function enviarAgora() {
    if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    formRef.current?.requestSubmit();
  }

  function enviarBusca() {
    if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    timerBuscaRef.current = window.setTimeout(() => formRef.current?.requestSubmit(), 450);
  }

  function atualizarCampo(name: CampoFiltroAgenda, value: string) {
    setValores((atuais) => ({ ...atuais, [name]: value }));
  }

  function atualizarSelect(name: CampoFiltroAgenda, value: string) {
    atualizarCampo(name, value);
    enviarAgora();
  }

  function limparFiltrosVisiveis() {
    if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    setValores({
      busca: "",
      cliente: "",
      modalidade: "",
      profissional: "",
      servico: "",
      status: "",
    });
  }

  useEffect(() => {
    return () => {
      if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    };
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <SlidersHorizontal className="size-4 text-roxo" aria-hidden="true" />
        Filtros da agenda
      </div>
      <form
        action="/painel/agenda"
        className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_repeat(5,1fr)_auto]"
        method="get"
        ref={formRef}
      >
        <input name="data" type="hidden" value={data} />
        <input name="visualizacao" type="hidden" value={visualizacao} />
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted">
          Busca
          <span className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              className="h-10 w-full rounded-lg border border-border bg-surface pr-3 pl-9 text-sm font-normal text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
              name="busca"
              onChange={(event) => {
                atualizarCampo("busca", event.target.value);
                enviarBusca();
              }}
              placeholder="Cliente, serviço ou profissional"
              value={valores.busca}
            />
          </span>
        </label>
        <SelectFiltro
          label="Cliente"
          name="cliente"
          onChange={atualizarSelect}
          opcoes={clientes}
          value={valores.cliente}
        />
        <SelectFiltro
          label="Serviço"
          name="servico"
          onChange={atualizarSelect}
          opcoes={servicos}
          value={valores.servico}
        />
        <SelectFiltro
          label="Profissional"
          name="profissional"
          onChange={atualizarSelect}
          opcoes={profissionais}
          value={valores.profissional}
        />
        <SelectFiltro
          label="Status"
          name="status"
          onChange={atualizarSelect}
          opcoes={statusOpcoes}
          value={valores.status}
        />
        <SelectFiltro
          label="Modalidade"
          name="modalidade"
          onChange={atualizarSelect}
          opcoes={modalidades}
          value={valores.modalidade}
        />
        <div className="flex items-end md:col-span-2 xl:col-span-1">
          <Link
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo xl:w-auto"
            href={limparHref}
            onClick={limparFiltrosVisiveis}
          >
            Limpar
          </Link>
        </div>
      </form>
    </section>
  );
}
