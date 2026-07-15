"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, MinusCircle } from "lucide-react";

import { registrarSaida, type EstadoFormularioEstoque } from "@/modules/estoque/actions";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioEstoque = { status: "inicial" };

type OpcaoLote = { id: string; nome: string };

function MensagemFormulario({ state }: { state: EstadoFormularioEstoque | undefined }) {
  if (!state?.mensagem) return null;

  return (
    <p
      className={
        state.status === "erro"
          ? "text-sm font-medium text-perigo"
          : "text-sm font-medium text-brand"
      }
      role={state.status === "erro" ? "alert" : "status"}
    >
      {state.mensagem}
    </p>
  );
}

export function FormularioSaida({ lotes }: { lotes: OpcaoLote[] }) {
  const [state, formAction, pending] = useActionState(registrarSaida, estadoInicial);
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="loteId">
          Lote
        </label>
        <select
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          defaultValue=""
          id="loteId"
          name="loteId"
          required
        >
          <option disabled value="">
            Selecione
          </option>
          {lotes.map((opcao) => (
            <option key={opcao.id} value={opcao.id}>
              {opcao.nome}
            </option>
          ))}
        </select>
        {state?.campos?.loteId?.length ? (
          <p className="text-sm text-perigo">{state.campos.loteId[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="quantidade">
          Quantidade utilizada
        </label>
        <input
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="quantidade"
          name="quantidade"
          required
          type="number"
        />
        {state?.campos?.quantidade?.length ? (
          <p className="text-sm text-perigo">{state.campos.quantidade[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="motivo">
          Motivo (opcional)
        </label>
        <input
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="motivo"
          name="motivo"
          placeholder="Ex.: usado na sessão de hoje"
        />
      </div>

      <MensagemFormulario state={state} />

      <button
        className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <MinusCircle className="size-4" />
        )}
        Registrar saída
      </button>
    </form>
  );
}
