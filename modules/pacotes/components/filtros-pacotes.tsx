"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

type OpcaoFiltro = { id: string; nome: string };
type CampoFiltroPacotes = "ativo" | "busca" | "cliente" | "pagamento" | "servico" | "validade";
type ValoresFiltroPacotes = Record<CampoFiltroPacotes, string>;

function SelectFiltro({
  label,
  name,
  onChange,
  opcoes,
  placeholder = "Todos",
  value,
}: {
  label: string;
  name: CampoFiltroPacotes;
  onChange: (name: CampoFiltroPacotes, value: string) => void;
  opcoes: OpcaoFiltro[];
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted">
      {label}
      <select
        className="h-10 min-w-0 rounded-lg border border-border bg-surface px-3 text-sm font-normal text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {opcoes.map((opcao) => (
          <option key={opcao.id} value={opcao.id}>
            {opcao.nome}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FiltrosPacotes({
  ativo,
  busca,
  cliente,
  clientes,
  limparHref,
  pagamento,
  pagamentos,
  servico,
  servicos,
  validade,
  validadeOpcoes,
}: {
  ativo: string;
  busca: string;
  cliente: string;
  clientes: OpcaoFiltro[];
  limparHref: string;
  pagamento: string;
  pagamentos: OpcaoFiltro[];
  servico: string;
  servicos: OpcaoFiltro[];
  validade: string;
  validadeOpcoes: OpcaoFiltro[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerBuscaRef = useRef<number | null>(null);
  const [valores, setValores] = useState<ValoresFiltroPacotes>({
    ativo,
    busca,
    cliente,
    pagamento,
    servico,
    validade,
  });

  function enviarAgora() {
    if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    formRef.current?.requestSubmit();
  }

  function enviarBusca() {
    if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    timerBuscaRef.current = window.setTimeout(() => formRef.current?.requestSubmit(), 450);
  }

  function atualizarCampo(name: CampoFiltroPacotes, value: string) {
    setValores((atuais) => ({ ...atuais, [name]: value }));
  }

  function atualizarSelect(name: CampoFiltroPacotes, value: string) {
    atualizarCampo(name, value);
    enviarAgora();
  }

  function limparFiltrosVisiveis() {
    if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    setValores({
      ativo: "",
      busca: "",
      cliente: "",
      pagamento: "",
      servico: "",
      validade: "",
    });
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
        Filtros de pacotes
      </div>
      <form
        action="/painel/pacotes"
        className="grid gap-3 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))_auto]"
        method="get"
        ref={formRef}
      >
        <label className="grid gap-1.5 text-xs font-medium text-muted">
          Busca
          <span className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              className="h-10 w-full min-w-0 rounded-lg border border-border bg-surface pr-3 pl-9 text-sm font-normal text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20"
              name="busca"
              onChange={(event) => {
                atualizarCampo("busca", event.target.value);
                enviarBusca();
              }}
              placeholder="Cliente, serviço ou pagamento"
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
          label="Pagamento"
          name="pagamento"
          onChange={atualizarSelect}
          opcoes={pagamentos}
          value={valores.pagamento}
        />
        <SelectFiltro
          label="Pacote"
          name="ativo"
          onChange={atualizarSelect}
          opcoes={[
            { id: "ativos", nome: "Ativos" },
            { id: "inativos", nome: "Inativos" },
          ]}
          value={valores.ativo}
        />
        <SelectFiltro
          label="Validade"
          name="validade"
          onChange={atualizarSelect}
          opcoes={validadeOpcoes}
          value={valores.validade}
        />
        <div className="flex items-end">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
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
