"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { criarPrimeiroAcesso, entrar, type EstadoFormularioAuth } from "@/modules/auth/actions";

const estadoInicial: EstadoFormularioAuth = { status: "inicial" };

function MensagemFormulario({ state }: { state: EstadoFormularioAuth }) {
  if (!state.mensagem) return null;

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

function BotaoSubmit({ children, pending }: { children: string; pending: boolean }) {
  return (
    <button
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

function CampoTexto({
  autoComplete,
  error,
  id,
  label,
  name,
  type = "text",
}: {
  autoComplete: string;
  error?: string[];
  id: string;
  label: string;
  name: string;
  type?: string;
}) {
  const errorId = `${id}-erro`;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        autoComplete={autoComplete}
        className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted focus:border-roxo focus:ring-2 focus:ring-roxo/20"
        id={id}
        name={name}
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

export function FormularioEntrada({ permitirPrimeiroAcesso }: { permitirPrimeiroAcesso: boolean }) {
  const [entradaState, entradaAction, entradaPending] = useActionState(entrar, estadoInicial);
  const [primeiroAcessoState, primeiroAcessoAction, primeiroAcessoPending] = useActionState(
    criarPrimeiroAcesso,
    estadoInicial,
  );

  return (
    <div className="grid w-full max-w-md gap-8">
      <form
        action={entradaAction}
        className="grid gap-5 rounded-lg border border-border bg-surface p-6 shadow-sm"
      >
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold text-brand">Entrar</h1>
          <p className="text-sm text-muted">Acesse sua área da Essencial Centro.</p>
        </div>

        <CampoTexto
          autoComplete="email"
          error={entradaState.campos?.email}
          id="entrada-email"
          label="E-mail"
          name="email"
          type="email"
        />
        <CampoTexto
          autoComplete="current-password"
          error={entradaState.campos?.senha}
          id="entrada-senha"
          label="Senha"
          name="senha"
          type="password"
        />

        <MensagemFormulario state={entradaState} />
        <BotaoSubmit pending={entradaPending}>Entrar</BotaoSubmit>
      </form>

      {permitirPrimeiroAcesso ? (
        <form
          action={primeiroAcessoAction}
          className="grid gap-5 rounded-lg border border-border bg-surface p-6 shadow-sm"
        >
          <div className="grid gap-1">
            <h2 className="text-lg font-semibold text-roxo">Primeiro acesso</h2>
            <p className="text-sm text-muted">Crie a conta profissional inicial.</p>
          </div>

          <CampoTexto
            autoComplete="name"
            error={primeiroAcessoState.campos?.nome}
            id="primeiro-acesso-nome"
            label="Nome"
            name="nome"
          />
          <CampoTexto
            autoComplete="email"
            error={primeiroAcessoState.campos?.email}
            id="primeiro-acesso-email"
            label="E-mail"
            name="email"
            type="email"
          />
          <CampoTexto
            autoComplete="new-password"
            error={primeiroAcessoState.campos?.senha}
            id="primeiro-acesso-senha"
            label="Senha"
            name="senha"
            type="password"
          />

          <MensagemFormulario state={primeiroAcessoState} />
          <BotaoSubmit pending={primeiroAcessoPending}>Criar acesso</BotaoSubmit>
        </form>
      ) : null}
    </div>
  );
}
