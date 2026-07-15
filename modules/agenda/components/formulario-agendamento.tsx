"use client";

import { useActionState } from "react";
import { CalendarPlus, LoaderCircle } from "lucide-react";

import { criarAgendamento, type EstadoFormularioAgendamento } from "@/modules/agenda/actions";

const estadoInicial: EstadoFormularioAgendamento = { status: "inicial" };

type Opcao = { id: string; nome: string };

function MensagemFormulario({ state }: { state: EstadoFormularioAgendamento | undefined }) {
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
  error,
  label,
  name,
  opcoes,
}: {
  error?: string[];
  label: string;
  name: string;
  opcoes: Opcao[];
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
        defaultValue=""
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

export function FormularioAgendamento({
  clientes,
  servicos,
  profissionais,
}: {
  clientes: Opcao[];
  servicos: Opcao[];
  profissionais: Opcao[];
}) {
  const [state, formAction, pending] = useActionState(criarAgendamento, estadoInicial);

  return (
    <form
      action={formAction}
      className="grid gap-6 rounded-lg border border-border bg-surface p-5 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-brand">Novo agendamento</h2>
        <p className="mt-1 text-sm text-muted">Marque um atendimento na agenda.</p>
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
      <CampoSelect
        error={state?.campos?.profissionalId}
        label="Profissional"
        name="profissionalId"
        opcoes={profissionais}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          error={state?.campos?.inicio}
          label="Data e horário"
          name="inicio"
          required
          type="datetime-local"
        />
        <CampoTexto
          error={state?.campos?.duracaoMinutos}
          label="Duração (minutos)"
          name="duracaoMinutos"
          required
          type="number"
        />
      </div>

      <CampoTexto error={state?.campos?.observacoes} label="Observações" name="observacoes" />

      <MensagemFormulario state={state} />

      <button
        className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <CalendarPlus className="size-4" />
        )}
        Agendar
      </button>
    </form>
  );
}
