"use client";

import { useActionState, useEffect } from "react";
import { Boxes, LoaderCircle } from "lucide-react";

import { CampoDataCalendario } from "@/components/ui/calendario-tailgrids";
import { criarLote, type EstadoFormularioEstoque } from "@/modules/estoque/actions";
import { useFecharModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";

const estadoInicial: EstadoFormularioEstoque = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

type Opcao = { id: string; nome: string };

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
    <form action={formAction} className="grid min-w-0 gap-5">
      {produtoId ? (
        <input name="produtoId" type="hidden" value={produtoId} />
      ) : (
        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="produtoId">
            Produto
          </label>
          <select className={classeCampo} defaultValue="" id="produtoId" name="produtoId" required>
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
        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="quantidadeInicial">
            Quantidade recebida
          </label>
          <input
            className={classeCampo}
            id="quantidadeInicial"
            inputMode="numeric"
            name="quantidadeInicial"
            placeholder="Ex.: 10"
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
        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="numeroLote">
            Nº do lote (opcional)
          </label>
          <input
            className={classeCampo}
            id="numeroLote"
            name="numeroLote"
            placeholder="Ex.: LOT-2026-07"
          />
        </div>
        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="custo">
            Custo total (R$, opcional)
          </label>
          <input
            className={classeCampo}
            id="custo"
            inputMode="decimal"
            name="custo"
            placeholder="Ex.: 250,00"
          />
        </div>
      </div>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="fornecedor">
          Fornecedor (opcional)
        </label>
        <input
          className={classeCampo}
          id="fornecedor"
          name="fornecedor"
          placeholder="Ex.: Distribuidora Essencial"
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
            <Boxes className="size-4" />
          )}
          Registrar lote
        </button>
      </div>
    </form>
  );
}
