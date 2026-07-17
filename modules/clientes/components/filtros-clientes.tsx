"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";

import type { FiltroCliente } from "@/modules/clientes/filtro";

const opcoesFiltro: Array<{ valor: FiltroCliente; rotulo: string }> = [
  { valor: "todos", rotulo: "Todas" },
  { valor: "com-contato", rotulo: "Com contato" },
  { valor: "sem-contato", rotulo: "Sem contato" },
  { valor: "com-objetivo", rotulo: "Com objetivo" },
  { valor: "sem-objetivo", rotulo: "Sem objetivo" },
];

export function FiltrosClientes({ busca, filtro }: { busca?: string; filtro: FiltroCliente }) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerBuscaRef = useRef<number | null>(null);

  function enviarBusca() {
    if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    timerBuscaRef.current = window.setTimeout(() => formRef.current?.requestSubmit(), 450);
  }

  function selecionarFiltro() {
    if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);

    formRef.current?.requestSubmit();
  }

  useEffect(() => {
    return () => {
      if (timerBuscaRef.current) window.clearTimeout(timerBuscaRef.current);
    };
  }, []);

  return (
    <form
      action="/painel/clientes"
      className="grid w-full gap-3 sm:grid-cols-[minmax(18rem,24rem)_13rem]"
      method="get"
      ref={formRef}
    >
      <div>
        <label className="sr-only" htmlFor="busca">
          Buscar cliente
        </label>
        <span className="relative block">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            className="h-11 w-full rounded-full border border-border bg-creme pr-4 pl-10 text-sm text-foreground transition outline-none placeholder:text-muted focus:border-roxo focus:bg-surface focus:ring-2 focus:ring-roxo/20"
            defaultValue={busca}
            id="busca"
            name="busca"
            onChange={enviarBusca}
            placeholder="Buscar cliente..."
          />
        </span>
      </div>

      <label className="sr-only" htmlFor="filtro">
        Filtrar clientes
      </label>
      <select
        className="h-11 w-full rounded-full border border-border bg-surface px-4 text-sm font-semibold text-brand transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
        defaultValue={filtro}
        id="filtro"
        name="filtro"
        onChange={selecionarFiltro}
      >
        {opcoesFiltro.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </form>
  );
}
