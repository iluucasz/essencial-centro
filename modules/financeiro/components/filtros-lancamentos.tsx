"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

type OpcaoFiltro = { id: string; nome: string };
type CampoFiltroLancamentos =
  "busca" | "categoria" | "cliente" | "de" | "formaPagamento" | "situacao" | "tipo" | "ate";
type ValoresFiltroLancamentos = Record<CampoFiltroLancamentos, string>;

const classeCampo =
  "h-10 min-w-0 rounded-lg border border-border bg-surface px-3 text-sm font-normal text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20";

function SelectFiltro({
  label,
  name,
  onChange,
  opcoes,
  placeholder = "Todos",
  value,
}: {
  label: string;
  name: CampoFiltroLancamentos;
  onChange: (name: CampoFiltroLancamentos, value: string) => void;
  opcoes: OpcaoFiltro[];
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted">
      {label}
      <select
        className={classeCampo}
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

function CampoDataFiltro({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name: CampoFiltroLancamentos;
  onChange: (name: CampoFiltroLancamentos, value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted">
      {label}
      <input
        className={classeCampo}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        type="date"
        value={value}
      />
    </label>
  );
}

export function FiltrosLancamentos({
  ate,
  busca,
  categoria,
  categorias,
  cliente,
  clientes,
  de,
  formaPagamento,
  formasPagamento,
  limparHref,
  situacao,
  situacoes,
  tipo,
  tipos,
}: {
  ate: string;
  busca: string;
  categoria: string;
  categorias: OpcaoFiltro[];
  cliente: string;
  clientes: OpcaoFiltro[];
  de: string;
  formaPagamento: string;
  formasPagamento: OpcaoFiltro[];
  limparHref: string;
  situacao: string;
  situacoes: OpcaoFiltro[];
  tipo: string;
  tipos: OpcaoFiltro[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerBuscaRef = useRef<number | null>(null);
  const [valores, setValores] = useState<ValoresFiltroLancamentos>({
    ate,
    busca,
    categoria,
    cliente,
    de,
    formaPagamento,
    situacao,
    tipo,
  });

  function enviarAgora() {
    if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    formRef.current?.requestSubmit();
  }

  function enviarBusca() {
    if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    timerBuscaRef.current = window.setTimeout(() => formRef.current?.requestSubmit(), 450);
  }

  function atualizarCampo(name: CampoFiltroLancamentos, value: string) {
    setValores((atuais) => ({ ...atuais, [name]: value }));
  }

  function atualizarEEnviar(name: CampoFiltroLancamentos, value: string) {
    atualizarCampo(name, value);
    enviarAgora();
  }

  function limparFiltrosVisiveis() {
    if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    setValores({
      ate: "",
      busca: "",
      categoria: "",
      cliente: "",
      de: "",
      formaPagamento: "",
      situacao: "",
      tipo: "",
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
        Filtros de lançamentos
      </div>
      <form action="/painel/financeiro" className="grid gap-3" method="get" ref={formRef}>
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
              placeholder="Descrição ou cliente"
              value={valores.busca}
            />
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectFiltro
            label="Tipo"
            name="tipo"
            onChange={atualizarEEnviar}
            opcoes={tipos}
            value={valores.tipo}
          />
          <SelectFiltro
            label="Categoria"
            name="categoria"
            onChange={atualizarEEnviar}
            opcoes={categorias}
            value={valores.categoria}
          />
          <SelectFiltro
            label="Situação"
            name="situacao"
            onChange={atualizarEEnviar}
            opcoes={situacoes}
            value={valores.situacao}
          />
          <SelectFiltro
            label="Forma de pagamento"
            name="formaPagamento"
            onChange={atualizarEEnviar}
            opcoes={formasPagamento}
            value={valores.formaPagamento}
          />
          <SelectFiltro
            label="Cliente"
            name="cliente"
            onChange={atualizarEEnviar}
            opcoes={clientes}
            value={valores.cliente}
          />
          <CampoDataFiltro label="De" name="de" onChange={atualizarEEnviar} value={valores.de} />
          <CampoDataFiltro label="Até" name="ate" onChange={atualizarEEnviar} value={valores.ate} />
          <div className="flex items-end">
            <Link
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              href={limparHref}
              onClick={limparFiltrosVisiveis}
            >
              Limpar
            </Link>
          </div>
        </div>
      </form>
    </section>
  );
}
