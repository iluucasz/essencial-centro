"use client";

import { useActionState } from "react";
import { LoaderCircle, PackagePlus } from "lucide-react";

import { criarPacote, type EstadoFormularioPacote } from "@/modules/pacotes/actions";
import { rotulosSituacaoPagamento, situacoesPagamento } from "@/modules/pacotes/schema";

const estadoInicial: EstadoFormularioPacote = { status: "inicial" };

type Opcao = { id: string; nome: string };

function MensagemFormulario({ state }: { state: EstadoFormularioPacote | undefined }) {
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

function CampoSelect({
  defaultValue,
  error,
  label,
  name,
  opcoes,
}: {
  defaultValue?: string;
  error?: string[];
  label: string;
  name: string;
  opcoes: { id: string; nome: string }[];
}) {
  const errorId = `${name}-erro`;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <select
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
        defaultValue={defaultValue ?? ""}
        id={name}
        name={name}
        required
      >
        <option disabled value="">
          Selecione
        </option>
        {opcoes.map((opcao) => (
          <option key={opcao.id} value={opcao.id}>
            {opcao.nome}
          </option>
        ))}
      </select>
      {error?.length ? (
        <p className="text-sm text-perigo" id={errorId}>
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

function CampoTexto({
  error,
  label,
  name,
  required,
  type = "text",
}: {
  error?: string[];
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  const errorId = `${name}-erro`;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
        id={name}
        name={name}
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

export function FormularioPacote({ clientes, servicos }: { clientes: Opcao[]; servicos: Opcao[] }) {
  const [state, formAction, pending] = useActionState(criarPacote, estadoInicial);

  return (
    <form
      action={formAction}
      className="grid gap-6 rounded-lg border border-border bg-surface p-5 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-brand">Novo pacote</h2>
        <p className="mt-1 text-sm text-muted">Sessões contratadas por um cliente.</p>
      </div>

      <CampoSelect
        error={state?.campos?.clienteId}
        label="Cliente"
        name="clienteId"
        opcoes={clientes}
      />
      <CampoSelect
        error={state?.campos?.servicoId}
        label="Serviço"
        name="servicoId"
        opcoes={servicos}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          error={state?.campos?.quantidadeSessoes}
          label="Quantidade de sessões"
          name="quantidadeSessoes"
          required
          type="number"
        />
        <CampoTexto error={state?.campos?.validade} label="Validade" name="validade" type="date" />
        <CampoTexto error={state?.campos?.valorCentavos} label="Valor (R$)" name="valor" />
        <CampoTexto
          error={state?.campos?.formaPagamento}
          label="Forma de pagamento"
          name="formaPagamento"
        />
      </div>

      <CampoSelect
        defaultValue="pendente"
        error={state?.campos?.situacaoPagamento}
        label="Situação do pagamento"
        name="situacaoPagamento"
        opcoes={situacoesPagamento.map((s) => ({ id: s, nome: rotulosSituacaoPagamento[s] }))}
      />

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
        Salvar pacote
      </button>
    </form>
  );
}
