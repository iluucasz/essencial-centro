"use client";

import { useActionState } from "react";
import { LoaderCircle, Save } from "lucide-react";

import { cn } from "@/lib/utils";
import { atualizarMeuPerfil, type EstadoFormularioAuth } from "@/modules/auth/actions";

const estadoInicial: EstadoFormularioAuth = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

export function FormularioMeuPerfil({ email, nome }: { email: string; nome: string }) {
  const [state, formAction, pending] = useActionState(atualizarMeuPerfil, estadoInicial);

  return (
    <form action={formAction} className="grid min-w-0 gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="nome">
            Nome
          </label>
          <input className={classeCampo} defaultValue={nome} id="nome" name="nome" required />
          {state.campos?.nome?.length ? (
            <p className="text-sm text-perigo">{state.campos.nome[0]}</p>
          ) : null}
        </div>
        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            E-mail
          </label>
          <input
            className={classeCampo}
            defaultValue={email}
            id="email"
            name="email"
            required
            type="email"
          />
          {state.campos?.email?.length ? (
            <p className="text-sm text-perigo">{state.campos.email[0]}</p>
          ) : null}
        </div>
      </div>

      {state.mensagem ? (
        <p
          className={cn(
            "rounded-xl px-3 py-2 text-sm font-medium",
            state.status === "erro" ? "bg-perigo/10 text-perigo" : "bg-brand/10 text-brand",
          )}
          role={state.status === "erro" ? "alert" : "status"}
        >
          {state.mensagem}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" />
          )}
          Salvar alterações
        </button>
      </div>
    </form>
  );
}
