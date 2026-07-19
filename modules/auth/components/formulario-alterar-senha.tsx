"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { alterarSenha, type EstadoFormularioAuth } from "@/modules/auth/actions";

const estadoInicial: EstadoFormularioAuth = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

export function FormularioAlterarSenha() {
  const [state, formAction, pending] = useActionState(alterarSenha, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "sucesso") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form action={formAction} className="grid min-w-0 gap-5" ref={formRef}>
      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="senhaAtual">
          Senha atual
        </label>
        <input className={classeCampo} id="senhaAtual" name="senhaAtual" required type="password" />
        {state.campos?.senhaAtual?.length ? (
          <p className="text-sm text-perigo">{state.campos.senhaAtual[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="novaSenha">
            Nova senha
          </label>
          <input
            className={classeCampo}
            id="novaSenha"
            minLength={8}
            name="novaSenha"
            required
            type="password"
          />
          {state.campos?.novaSenha?.length ? (
            <p className="text-sm text-perigo">{state.campos.novaSenha[0]}</p>
          ) : null}
        </div>
        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="confirmarNovaSenha">
            Confirmar nova senha
          </label>
          <input
            className={classeCampo}
            id="confirmarNovaSenha"
            minLength={8}
            name="confirmarNovaSenha"
            required
            type="password"
          />
          {state.campos?.confirmarNovaSenha?.length ? (
            <p className="text-sm text-perigo">{state.campos.confirmarNovaSenha[0]}</p>
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
          className="inline-flex h-11 min-w-44 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <KeyRound className="size-4" />
          )}
          Alterar senha
        </button>
      </div>
    </form>
  );
}
