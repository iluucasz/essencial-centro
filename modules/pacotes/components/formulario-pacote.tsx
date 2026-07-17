"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, PackagePlus } from "lucide-react";

import { CampoDataCalendario } from "@/components/ui/calendario-tailgrids";
import { useFecharModal } from "@/components/ui/modal-formulario";
import {
  atualizarPacote,
  criarPacote,
  type EstadoFormularioPacote,
} from "@/modules/pacotes/actions";
import {
  rotulosSituacaoPagamento,
  situacoesPagamento,
  type SituacaoPagamento,
} from "@/modules/pacotes/schema";

const estadoInicial: EstadoFormularioPacote = { status: "inicial" };

type Opcao = { id: string; nome: string };

export type PacoteFormulario = {
  id: string;
  clienteId: string;
  servicoId: string;
  quantidadeSessoes: number;
  validade: Date | null;
  valorCentavos: number | null;
  formaPagamento: string | null;
  situacaoPagamento: SituacaoPagamento;
  ativo: boolean;
};

function formatarDataInput(data?: Date | null) {
  if (!data) return undefined;

  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarValor(valorCentavos?: number | null) {
  if (valorCentavos === null || valorCentavos === undefined) return undefined;

  return String(valorCentavos / 100).replace(".", ",");
}

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
  defaultValue,
  error,
  label,
  name,
  required,
  type = "text",
}: {
  defaultValue?: string | number;
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
        defaultValue={defaultValue}
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

export function FormularioPacote({
  clientes,
  pacote,
  servicos,
}: {
  clientes: Opcao[];
  pacote?: PacoteFormulario;
  servicos: Opcao[];
}) {
  const [state, formAction, pending] = useActionState(
    pacote ? atualizarPacote : criarPacote,
    estadoInicial,
  );
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid gap-6">
      {pacote ? <input name="id" type="hidden" value={pacote.id} /> : null}

      <CampoSelect
        defaultValue={pacote?.clienteId}
        error={state?.campos?.clienteId}
        label="Cliente"
        name="clienteId"
        opcoes={clientes}
      />
      <CampoSelect
        defaultValue={pacote?.servicoId}
        error={state?.campos?.servicoId}
        label="Serviço"
        name="servicoId"
        opcoes={servicos}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          defaultValue={pacote?.quantidadeSessoes}
          error={state?.campos?.quantidadeSessoes}
          label="Quantidade de sessões"
          name="quantidadeSessoes"
          required
          type="number"
        />
        <CampoDataCalendario
          defaultValue={formatarDataInput(pacote?.validade)}
          error={state?.campos?.validade}
          label="Validade"
          name="validade"
        />
        <CampoTexto
          defaultValue={formatarValor(pacote?.valorCentavos)}
          error={state?.campos?.valorCentavos}
          label="Valor (R$)"
          name="valor"
        />
        <CampoTexto
          defaultValue={pacote?.formaPagamento ?? undefined}
          error={state?.campos?.formaPagamento}
          label="Forma de pagamento"
          name="formaPagamento"
        />
      </div>

      <CampoSelect
        defaultValue={pacote?.situacaoPagamento ?? "pendente"}
        error={state?.campos?.situacaoPagamento}
        label="Situação do pagamento"
        name="situacaoPagamento"
        opcoes={situacoesPagamento.map((s) => ({ id: s, nome: rotulosSituacaoPagamento[s] }))}
      />

      {pacote ? (
        <label className="flex items-start gap-3 rounded-lg bg-creme p-3 text-sm text-foreground">
          <input
            className="mt-1 size-4 rounded border-border text-brand focus:ring-roxo"
            defaultChecked={pacote.ativo}
            name="ativo"
            type="checkbox"
            value="true"
          />
          <span>Pacote ativo para novos agendamentos.</span>
        </label>
      ) : null}

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
        {pacote ? "Atualizar pacote" : "Salvar pacote"}
      </button>
    </form>
  );
}
