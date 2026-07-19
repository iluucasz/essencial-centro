"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, PackagePlus } from "lucide-react";

import { useFecharModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import {
  atualizarProduto,
  criarProduto,
  type EstadoFormularioEstoque,
} from "@/modules/estoque/actions";

const estadoInicial: EstadoFormularioEstoque = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

export type ProdutoFormulario = {
  id: string;
  nome: string;
  unidade: string | null;
  estoqueMinimo: number | null;
  ativo: boolean;
};

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

function CampoTexto({
  defaultValue,
  error,
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  defaultValue?: string | number;
  error?: string[];
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  const errorId = `${name}-erro`;

  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className={classeCampo}
        defaultValue={defaultValue}
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
      {error?.length ? (
        <p className="text-sm text-perigo" id={errorId}>
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

export function FormularioProduto({ produto }: { produto?: ProdutoFormulario }) {
  const [state, formAction, pending] = useActionState(
    produto ? atualizarProduto : criarProduto,
    estadoInicial,
  );
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid min-w-0 gap-5">
      {produto ? <input name="id" type="hidden" value={produto.id} /> : null}

      <CampoTexto
        defaultValue={produto?.nome}
        error={state?.campos?.nome}
        label="Nome do produto"
        name="nome"
        placeholder="Ex.: Óleo de massagem"
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          defaultValue={produto?.unidade ?? undefined}
          error={state?.campos?.unidade}
          label="Unidade (opcional)"
          name="unidade"
          placeholder="Ex.: ml, un, kg"
        />
        <CampoTexto
          defaultValue={produto?.estoqueMinimo ?? undefined}
          error={state?.campos?.estoqueMinimo}
          label="Estoque mínimo (opcional)"
          name="estoqueMinimo"
          placeholder="Ex.: 5"
          type="number"
        />
      </div>

      {produto ? (
        <label className="flex items-start gap-3 rounded-lg bg-creme p-3 text-sm text-foreground">
          <input
            className="mt-1 size-4 rounded border-border text-brand focus:ring-roxo"
            defaultChecked={produto.ativo}
            name="ativo"
            type="checkbox"
            value="true"
          />
          <span>Produto ativo para novos lotes e movimentações.</span>
        </label>
      ) : null}

      <MensagemFormulario state={state} />

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-44 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <PackagePlus className="size-4" />
          )}
          {produto ? "Atualizar produto" : "Cadastrar produto"}
        </button>
      </div>
    </form>
  );
}
