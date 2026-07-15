"use client";

import { useActionState } from "react";
import { LoaderCircle, Send } from "lucide-react";

import { enviarWhatsAppDeTeste, type EstadoTesteWhatsApp } from "@/modules/notificacoes/actions";

const estadoInicial: EstadoTesteWhatsApp = { status: "inicial" };

export function FormularioTesteWhatsApp() {
  const [state, formAction, pending] = useActionState(enviarWhatsAppDeTeste, estadoInicial);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="telefone">
          Telefone (com DDD)
        </label>
        <input
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="telefone"
          name="telefone"
          placeholder="Ex.: (21) 99999-9999"
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="mensagem">
          Mensagem de teste
        </label>
        <textarea
          className="min-h-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          defaultValue="Teste de integração — Essencial Centro."
          id="mensagem"
          name="mensagem"
          required
        />
      </div>

      {state.mensagem ? (
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
      ) : null}

      <button
        className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" />
        )}
        Enviar teste
      </button>
    </form>
  );
}
