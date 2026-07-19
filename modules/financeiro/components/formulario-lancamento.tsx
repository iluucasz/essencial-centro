"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, Save, Wallet } from "lucide-react";

import { CampoDataCalendario } from "@/components/ui/calendario-tailgrids";
import { cn } from "@/lib/utils";
import {
  atualizarLancamento,
  criarLancamento,
  type EstadoFormularioLancamento,
} from "@/modules/financeiro/actions";
import {
  categoriasLancamento,
  formasPagamentoLancamento,
  rotulosCategoriaLancamento,
  rotulosFormaPagamentoLancamento,
  rotulosSituacaoLancamento,
  rotulosTipoLancamento,
  situacoesLancamento,
  tiposLancamento,
  type SituacaoLancamento,
  type TipoLancamento,
} from "@/modules/financeiro/schema";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioLancamento = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";
const classeArea =
  "min-h-20 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

type Opcao = { id: string; nome: string };

export type LancamentoFormulario = {
  id: string;
  tipo: TipoLancamento;
  categoria: string;
  descricao: string | null;
  valorCentavos: number;
  data: Date;
  formaPagamento: string | null;
  situacao: SituacaoLancamento;
  clienteId: string | null;
  pacoteId: string | null;
};

function formatarValor(valorCentavos: number) {
  return String(valorCentavos / 100).replace(".", ",");
}

function formatarDataInput(data: Date) {
  return data.toISOString().slice(0, 10);
}

function MensagemFormulario({ state }: { state: EstadoFormularioLancamento | undefined }) {
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
    <div className="grid min-w-0 gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <select
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className={classeCampo}
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
  defaultValue,
  error,
  inputMode,
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  defaultValue?: string;
  error?: string[];
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
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
        inputMode={inputMode}
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

export function FormularioLancamento({
  clientes,
  lancamento,
  pacotes,
}: {
  clientes: Opcao[];
  lancamento?: LancamentoFormulario;
  pacotes: Opcao[];
}) {
  const [state, formAction, pending] = useActionState(
    lancamento ? atualizarLancamento : criarLancamento,
    estadoInicial,
  );
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid min-w-0 gap-6">
      {lancamento ? <input name="id" type="hidden" value={lancamento.id} /> : null}

      <CampoSelect
        defaultValue={lancamento?.tipo}
        error={state?.campos?.tipo}
        label="Tipo"
        name="tipo"
        opcoes={tiposLancamento.map((tipo) => ({ id: tipo, nome: rotulosTipoLancamento[tipo] }))}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSelect
          defaultValue={lancamento?.categoria}
          error={state?.campos?.categoria}
          label="Categoria"
          name="categoria"
          opcoes={categoriasLancamento.map((categoria) => ({
            id: categoria,
            nome: rotulosCategoriaLancamento[categoria],
          }))}
        />
        <CampoTexto
          defaultValue={lancamento ? formatarValor(lancamento.valorCentavos) : undefined}
          error={state?.campos?.valorCentavos}
          inputMode="decimal"
          label="Valor (R$)"
          name="valor"
          placeholder="Ex.: 150,00"
          required
        />
        <CampoDataCalendario
          defaultValue={lancamento ? formatarDataInput(lancamento.data) : undefined}
          error={state?.campos?.data}
          label="Data"
          name="data"
          required
        />
        <CampoSelect
          defaultValue={lancamento?.formaPagamento ?? undefined}
          error={state?.campos?.formaPagamento}
          label="Forma de pagamento"
          name="formaPagamento"
          opcoes={formasPagamentoLancamento.map((forma) => ({
            id: forma,
            nome: rotulosFormaPagamentoLancamento[forma],
          }))}
        />
      </div>

      <CampoSelect
        defaultValue={lancamento?.situacao ?? "pendente"}
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
          defaultValue={lancamento?.clienteId ?? undefined}
          error={state?.campos?.clienteId}
          label="Cliente vinculado (opcional)"
          name="clienteId"
          opcaoVazia="Sem vínculo"
          opcoes={clientes}
          required={false}
        />
        <CampoSelect
          defaultValue={lancamento?.pacoteId ?? undefined}
          error={state?.campos?.pacoteId}
          label="Pacote vinculado (opcional)"
          name="pacoteId"
          opcaoVazia="Sem vínculo"
          opcoes={pacotes}
          required={false}
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="descricao">
          Observações (opcional)
        </label>
        <textarea
          className={classeArea}
          defaultValue={lancamento?.descricao ?? undefined}
          id="descricao"
          name="descricao"
          placeholder="Ex.: pagamento referente ao pacote de limpeza de pele"
        />
        {state?.campos?.descricao?.length ? (
          <p className="text-sm text-perigo">{state.campos.descricao[0]}</p>
        ) : null}
      </div>

      <MensagemFormulario state={state} />

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-44 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : lancamento ? (
            <Save className="size-4" />
          ) : (
            <Wallet className="size-4" />
          )}
          {lancamento ? "Salvar alterações" : "Registrar lançamento"}
        </button>
      </div>
    </form>
  );
}
