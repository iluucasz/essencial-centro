"use client";

import { useActionState, useEffect, useReducer } from "react";
import { LoaderCircle } from "lucide-react";

import {
  gerarCodigoCadastroBiometria,
  type EstadoCodigoCadastro,
} from "@/modules/biometria/actions";
import { dedosBiometria, rotulosDedoBiometria } from "@/modules/biometria/schema";

const estadoInicial: EstadoCodigoCadastro = { status: "inicial" };

/**
 * Nunca chama Date.now() direto no corpo da renderização (impuro — o React Compiler reclama). O
 * "agora" fica em estado, atualizado só dentro do reducer (disparado pelo intervalo) ou no
 * inicializador preguiçoso do useReducer — os dois únicos lugares em que isso é permitido.
 */
function useContagemRegressiva(expiraEmIso: string | null) {
  const [agoraMs, atualizarAgora] = useReducer(
    () => Date.now(),
    undefined,
    () => Date.now(),
  );

  useEffect(() => {
    if (!expiraEmIso) return;

    const intervalo = setInterval(atualizarAgora, 1000);

    return () => clearInterval(intervalo);
  }, [expiraEmIso]);

  if (!expiraEmIso) return null;

  return Math.max(0, new Date(expiraEmIso).getTime() - agoraMs);
}

function formatarMmSs(ms: number) {
  const totalSegundos = Math.ceil(ms / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;

  return `${minutos}:${String(segundos).padStart(2, "0")}`;
}

export function FormularioGerarCodigo({ clienteId }: { clienteId: string }) {
  const [state, formAction, pending] = useActionState(gerarCodigoCadastroBiometria, estadoInicial);
  const expiraEmIso = state.status === "sucesso" ? state.expiraEm : null;
  const restanteMs = useContagemRegressiva(expiraEmIso);
  const expirado = restanteMs !== null && restanteMs <= 0;

  if (state.status === "sucesso" && !expirado) {
    return (
      <div className="grid gap-3 text-center">
        <p className="text-sm text-muted">
          Digite este código na ponte de biometria pra concluir o cadastro:
        </p>
        <p className="text-4xl font-semibold tracking-widest text-brand">{state.codigo}</p>
        <p className="text-sm text-muted">
          Expira em {restanteMs !== null ? formatarMmSs(restanteMs) : "—"}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-6">
      {expirado ? (
        <p className="text-sm font-medium text-perigo" role="alert">
          Código expirado — gere um novo abaixo.
        </p>
      ) : null}

      <input name="clienteId" type="hidden" value={clienteId} />

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="dedo">
          Dedo
        </label>
        <select
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          defaultValue=""
          id="dedo"
          name="dedo"
          required
        >
          <option disabled value="">
            Selecione
          </option>
          {dedosBiometria.map((dedo) => (
            <option key={dedo} value={dedo}>
              {rotulosDedoBiometria[dedo]}
            </option>
          ))}
        </select>
      </div>

      {state.status === "erro" ? (
        <p className="text-sm font-medium text-perigo" role="alert">
          {state.mensagem}
        </p>
      ) : null}

      <button
        className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        Gerar código de cadastro
      </button>
    </form>
  );
}
