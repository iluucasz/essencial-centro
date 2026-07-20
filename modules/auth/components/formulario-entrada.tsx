"use client";

import { useActionState, type ReactNode } from "react";
import { LoaderCircle, LogIn } from "lucide-react";

import { Field, TextInput } from "@/components/marketing/ui/field";
import { criarPrimeiroAcesso, entrar, type EstadoFormularioAuth } from "@/modules/auth/actions";

const estadoInicial: EstadoFormularioAuth = { status: "inicial" };

function MensagemFormulario({ state }: { state: EstadoFormularioAuth }) {
  if (!state.mensagem) return null;

  return (
    <p
      className={
        state.status === "erro"
          ? "rounded-xl border border-perigo/20 bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          : "rounded-xl border border-forest/20 bg-sage/50 px-3 py-2 text-sm font-medium text-forest"
      }
      role={state.status === "erro" ? "alert" : "status"}
    >
      {state.mensagem}
    </p>
  );
}

function BotaoSubmit({ children, pending }: { children: ReactNode; pending: boolean }) {
  return (
    <button
      className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest px-5 text-sm font-semibold text-cream shadow-sm transition hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogIn className="size-4" aria-hidden="true" />
      )}
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
    <Field htmlFor={id} label={label}>
      <TextInput
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        autoComplete={autoComplete}
        id={id}
        name={name}
        type={type}
      />
      {error?.length ? (
        <p className="text-sm text-perigo" id={errorId}>
          {error[0]}
        </p>
      ) : null}
    </Field>
  );
}

export function FormularioEntrada({ permitirPrimeiroAcesso }: { permitirPrimeiroAcesso: boolean }) {
  const [entradaState, entradaAction, entradaPending] = useActionState(entrar, estadoInicial);
  const [primeiroAcessoState, primeiroAcessoAction, primeiroAcessoPending] = useActionState(
    criarPrimeiroAcesso,
    estadoInicial,
  );

  return (
    <div className="grid w-full max-w-sm gap-8">
      <section>
        <h2 className="font-serif text-3xl font-semibold text-ink">Entrar</h2>
        <p className="mt-2 text-sm text-ink-soft">Acesse sua área com segurança.</p>

        <form action={entradaAction} className="mt-6 flex flex-col gap-4">
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

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              className="size-4 rounded border-line text-forest focus:ring-forest"
              type="checkbox"
            />
            Manter conectado
          </label>

          <MensagemFormulario state={entradaState} />
          <BotaoSubmit pending={entradaPending}>Entrar</BotaoSubmit>
        </form>

        <p className="mt-6 text-center text-xs text-ink-soft">
          Primeiro acesso? Sua senha inicial é enviada pela clínica ao cadastrar seu tratamento.
        </p>
      </section>

      {permitirPrimeiroAcesso ? (
        <form
          action={primeiroAcessoAction}
          className="grid gap-5 rounded-3xl border border-line bg-surface p-6 shadow-sm"
        >
          <div className="grid gap-1">
            <h2 className="font-serif text-xl font-semibold text-ink">Primeiro acesso</h2>
            <p className="text-sm text-ink-soft">Crie a conta profissional inicial.</p>
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
