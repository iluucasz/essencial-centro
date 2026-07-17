"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

type OpcaoFiltro = { id: string; nome: string };

function SelectFiltro({
  defaultValue,
  label,
  name,
  onChange,
  opcoes,
}: {
  defaultValue: string;
  label: string;
  name: string;
  onChange: () => void;
  opcoes: OpcaoFiltro[];
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted">
      {label}
      <select
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm font-normal text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
        defaultValue={defaultValue}
        name={name}
        onChange={onChange}
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

  function enviarAgora() {
    if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    formRef.current?.requestSubmit();
  }

  function enviarBusca() {
    if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    timerBuscaRef.current = window.setTimeout(() => formRef.current?.requestSubmit(), 450);
  }

  useEffect(() => {
    return () => {
      if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    };
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <SlidersHorizontal className="size-4 text-roxo" aria-hidden="true" />
        Filtros da agenda
      </div>
      <form
        action="/painel/agenda"
        className="grid gap-3 lg:grid-cols-[1.3fr_repeat(5,1fr)_auto]"
        method="get"
        ref={formRef}
      >
        <input name="data" type="hidden" value={data} />
        <input name="visualizacao" type="hidden" value={visualizacao} />
        <label className="grid gap-1.5 text-xs font-medium text-muted">
          Busca
          <span className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              className="h-10 w-full rounded-lg border border-border bg-surface pr-3 pl-9 text-sm font-normal text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
              defaultValue={busca}
              name="busca"
              onChange={enviarBusca}
              placeholder="Cliente, serviço ou profissional"
            />
          </span>
        </label>
        <SelectFiltro
          defaultValue={cliente}
          label="Cliente"
          name="cliente"
          onChange={enviarAgora}
          opcoes={clientes}
        />
        <SelectFiltro
          defaultValue={servico}
          label="Serviço"
          name="servico"
          onChange={enviarAgora}
          opcoes={servicos}
        />
        <SelectFiltro
          defaultValue={profissional}
          label="Profissional"
          name="profissional"
          onChange={enviarAgora}
          opcoes={profissionais}
        />
        <SelectFiltro
          defaultValue={status}
          label="Status"
          name="status"
          onChange={enviarAgora}
          opcoes={statusOpcoes}
        />
        <SelectFiltro
          defaultValue={modalidade}
          label="Modalidade"
          name="modalidade"
          onChange={enviarAgora}
          opcoes={modalidades}
        />
        <div className="flex items-end">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            href={limparHref}
          >
            Limpar
          </Link>
        </div>
      </form>
    </section>
  );
}
