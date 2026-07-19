"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, MinusCircle } from "lucide-react";

import { registrarSaida, type EstadoFormularioEstoque } from "@/modules/estoque/actions";
import { useFecharModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";

const estadoInicial: EstadoFormularioEstoque = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

type OpcaoLote = { id: string; nome: string };

function MensagemFormulario({ state }: { state: EstadoFormularioEstoque | undefined }) {
  if (!state?.mensagem) return null;

  return (
    <p
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-medium",
        state.status === "erro" ? "bg-perigo/10 text-perigo" : "bg-brand/10 text-brand",
      )}
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
    <form action={formAction} className="grid min-w-0 gap-5">
      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="loteId">
          Lote
        </label>
        <select className={classeCampo} defaultValue="" id="loteId" name="loteId" required>
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

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="quantidade">
          Quantidade utilizada
        </label>
        <input
          className={classeCampo}
          id="quantidade"
          inputMode="numeric"
          name="quantidade"
          placeholder="Ex.: 2"
          required
          type="number"
        />
        {state?.campos?.quantidade?.length ? (
          <p className="text-sm text-perigo">{state.campos.quantidade[0]}</p>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="motivo">
          Motivo (opcional)
        </label>
        <input
          className={classeCampo}
          id="motivo"
          name="motivo"
          placeholder="Ex.: usado na sessão de hoje"
        />
      </div>

      <MensagemFormulario state={state} />

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-40 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
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
      </div>
    </form>
  );
}
