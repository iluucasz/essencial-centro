"use client";

import { useActionState, useEffect } from "react";
import { Boxes, LoaderCircle } from "lucide-react";

import { CampoDataCalendario } from "@/components/ui/calendario-tailgrids";
import { criarLote, type EstadoFormularioEstoque } from "@/modules/estoque/actions";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioEstoque = { status: "inicial" };

type Opcao = { id: string; nome: string };

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

export function FormularioLote({
  produtoId,
  produtos,
}: {
  produtoId?: string;
  produtos?: Opcao[];
}) {
  const [state, formAction, pending] = useActionState(criarLote, estadoInicial);
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid gap-4">
      {produtoId ? (
        <input name="produtoId" type="hidden" value={produtoId} />
      ) : (
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="produtoId">
            Produto
          </label>
          <select
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            defaultValue=""
            id="produtoId"
            name="produtoId"
            required
          >
            <option disabled value="">
              Selecione
            </option>
            {(produtos ?? []).map((opcao) => (
              <option key={opcao.id} value={opcao.id}>
                {opcao.nome}
              </option>
            ))}
          </select>
          {state?.campos?.produtoId?.length ? (
            <p className="text-sm text-perigo">{state.campos.produtoId[0]}</p>
          ) : null}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="quantidadeInicial">
            Quantidade recebida
          </label>
          <input
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            id="quantidadeInicial"
            name="quantidadeInicial"
            required
            type="number"
          />
          {state?.campos?.quantidadeInicial?.length ? (
            <p className="text-sm text-perigo">{state.campos.quantidadeInicial[0]}</p>
          ) : null}
        </div>
        <CampoDataCalendario
          error={state?.campos?.validade}
          label="Validade (opcional)"
          name="validade"
        />
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="numeroLote">
            Nº do lote (opcional)
          </label>
          <input
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            id="numeroLote"
            name="numeroLote"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="custo">
            Custo total (R$, opcional)
          </label>
          <input
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            id="custo"
            name="custo"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="fornecedor">
          Fornecedor (opcional)
        </label>
        <input
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="fornecedor"
          name="fornecedor"
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
          <Boxes className="size-4" />
        )}
        Registrar lote
      </button>
    </form>
  );
}
