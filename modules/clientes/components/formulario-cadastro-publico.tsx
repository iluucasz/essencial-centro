"use client";

import { useActionState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";

import {
  concluirCadastroPublico,
  type EstadoCadastroPublico,
} from "@/modules/clientes/cadastro-publico-actions";

import { CamposCliente, MensagemFormulario } from "./formulario-cliente";

const estadoInicial: EstadoCadastroPublico = { status: "inicial" };

export function FormularioCadastroPublico({
  telefone,
  token,
}: {
  telefone: string;
  token: string;
}) {
  const [state, formAction, pending] = useActionState(concluirCadastroPublico, estadoInicial);

  if (state.status === "sucesso") {
    return (
      <div className="grid justify-items-center gap-3 py-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold text-brand">Cadastro enviado!</h2>
        <p className="max-w-sm text-sm text-muted">
          Obrigada! Seus dados foram enviados com segurança para a Essencial Centro. Pode fechar
          esta página.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid min-w-0 gap-6">
      <input name="token" type="hidden" value={token} />

      <CamposCliente campos={state.campos} cliente={{ telefone }} publico />

      <MensagemFormulario state={state} />

      <div className="flex border-t border-border/70 pt-4 sm:justify-end">
        <button
          className="inline-flex h-11 w-full min-w-40 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          Enviar cadastro
        </button>
      </div>
    </form>
  );
}
