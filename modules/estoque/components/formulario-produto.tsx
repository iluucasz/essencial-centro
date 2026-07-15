"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, PackagePlus } from "lucide-react";

import { criarProduto, type EstadoFormularioEstoque } from "@/modules/estoque/actions";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioEstoque = { status: "inicial" };

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

export function FormularioProduto() {
  const [state, formAction, pending] = useActionState(criarProduto, estadoInicial);
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="nome">
          Nome do produto
        </label>
        <input
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="nome"
          name="nome"
          placeholder="Ex.: Óleo de massagem"
          required
        />
        {state?.campos?.nome?.length ? (
          <p className="text-sm text-perigo">{state.campos.nome[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="unidade">
            Unidade (opcional)
          </label>
          <input
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            id="unidade"
            name="unidade"
            placeholder="Ex.: ml, un, kg"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="estoqueMinimo">
            Estoque mínimo (opcional)
          </label>
          <input
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            id="estoqueMinimo"
            name="estoqueMinimo"
            type="number"
          />
        </div>
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
          <PackagePlus className="size-4" />
        )}
        Cadastrar produto
      </button>
    </form>
  );
}
