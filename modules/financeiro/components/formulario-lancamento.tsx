"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, Wallet } from "lucide-react";

import { CampoDataCalendario } from "@/components/ui/calendario-tailgrids";
import { criarLancamento, type EstadoFormularioLancamento } from "@/modules/financeiro/actions";
import {
  rotulosSituacaoLancamento,
  rotulosTipoLancamento,
  situacoesLancamento,
  tiposLancamento,
} from "@/modules/financeiro/schema";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioLancamento = { status: "inicial" };

type Opcao = { id: string; nome: string };

function MensagemFormulario({ state }: { state: EstadoFormularioLancamento | undefined }) {
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
  opcaoVazia,
  opcoes,
  required = true,
}: {
  defaultValue?: string;
  error?: string[];
  label: string;
  name: string;
  opcaoVazia?: string;
  opcoes: Opcao[];
  required?: boolean;
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
        required={required}
      >
        <option disabled={required} value="">
          {opcaoVazia ?? "Selecione"}
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

export function FormularioLancamento({
  clientes,
  pacotes,
}: {
  clientes: Opcao[];
  pacotes: Opcao[];
}) {
  const [state, formAction, pending] = useActionState(criarLancamento, estadoInicial);
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid gap-6">
      <CampoSelect
        error={state?.campos?.tipo}
        label="Tipo"
        name="tipo"
        opcoes={tiposLancamento.map((tipo) => ({ id: tipo, nome: rotulosTipoLancamento[tipo] }))}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto error={state?.campos?.categoria} label="Categoria" name="categoria" required />
        <CampoTexto error={state?.campos?.valorCentavos} label="Valor (R$)" name="valor" required />
        <CampoDataCalendario error={state?.campos?.data} label="Data" name="data" required />
        <CampoTexto
          error={state?.campos?.formaPagamento}
          label="Forma de pagamento"
          name="formaPagamento"
        />
      </div>

      <CampoSelect
        defaultValue="pendente"
        error={state?.campos?.situacao}
        label="Situação"
        name="situacao"
        opcoes={situacoesLancamento.map((situacao) => ({
          id: situacao,
          nome: rotulosSituacaoLancamento[situacao],
        }))}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSelect
          error={state?.campos?.clienteId}
          label="Cliente vinculado (opcional)"
          name="clienteId"
          opcaoVazia="Sem vínculo"
          opcoes={clientes}
          required={false}
        />
        <CampoSelect
          error={state?.campos?.pacoteId}
          label="Pacote vinculado (opcional)"
          name="pacoteId"
          opcaoVazia="Sem vínculo"
          opcoes={pacotes}
          required={false}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="descricao">
          Observações (opcional)
        </label>
        <textarea
          className="min-h-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="descricao"
          name="descricao"
        />
        {state?.campos?.descricao?.length ? (
          <p className="text-sm text-perigo">{state.campos.descricao[0]}</p>
        ) : null}
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
          <Wallet className="size-4" />
        )}
        Registrar lançamento
      </button>
    </form>
  );
}
