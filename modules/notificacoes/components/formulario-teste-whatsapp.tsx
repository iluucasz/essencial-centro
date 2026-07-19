"use client";

import { useActionState } from "react";
import { LoaderCircle, Send } from "lucide-react";

import { enviarWhatsAppDeTeste, type EstadoTesteWhatsApp } from "@/modules/notificacoes/actions";
import { cn } from "@/lib/utils";

const estadoInicial: EstadoTesteWhatsApp = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";
const classeArea =
  "min-h-24 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

export function FormularioTesteWhatsApp() {
  const [state, formAction, pending] = useActionState(enviarWhatsAppDeTeste, estadoInicial);

  return (
    <form action={formAction} className="grid min-w-0 gap-5">
      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="telefone">
          Telefone (com DDD)
        </label>
        <input
          className={classeCampo}
          id="telefone"
          inputMode="tel"
          name="telefone"
          placeholder="Ex.: (21) 99999-9999"
          required
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="mensagem">
          Mensagem de teste
        </label>
        <textarea
          className={classeArea}
          defaultValue="Teste de integração — Essencial Centro."
          id="mensagem"
          name="mensagem"
          required
        />
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

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
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
      </div>
    </form>
  );
}
