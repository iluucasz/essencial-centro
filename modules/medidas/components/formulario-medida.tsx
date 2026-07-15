"use client";

import { useActionState } from "react";
import { LoaderCircle, Ruler } from "lucide-react";

import { criarMedida, type EstadoFormularioMedida } from "@/modules/medidas/actions";
import {
  ladosMedida,
  regioesMedida,
  rotulosLadoMedida,
  rotulosRegiaoMedida,
} from "@/modules/medidas/schema";

const estadoInicial: EstadoFormularioMedida = { status: "inicial" };

type Opcao = { id: string; nome: string };

function MensagemFormulario({ state }: { state: EstadoFormularioMedida | undefined }) {
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

export function FormularioMedida({ clienteId, sessoes }: { clienteId: string; sessoes: Opcao[] }) {
  const [state, formAction, pending] = useActionState(criarMedida, estadoInicial);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm"
    >
      <input name="clienteId" type="hidden" value={clienteId} />

      <div>
        <h2 className="text-lg font-semibold text-brand">Nova medida</h2>
        <p className="mt-1 text-sm text-muted">Registro corporal para acompanhar a evolução.</p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="regiao">
          Região
        </label>
        <select
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          defaultValue=""
          id="regiao"
          name="regiao"
          required
        >
          <option disabled value="">
            Selecione
          </option>
          {regioesMedida.map((regiao) => (
            <option key={regiao} value={regiao}>
              {rotulosRegiaoMedida[regiao]}
            </option>
          ))}
        </select>
        {state?.campos?.regiao?.length ? (
          <p className="text-sm text-perigo">{state.campos.regiao[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="lado">
          Lado (só coxa/braço)
        </label>
        <select
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          defaultValue=""
          id="lado"
          name="lado"
        >
          <option value="">Não se aplica</option>
          {ladosMedida.map((lado) => (
            <option key={lado} value={lado}>
              {rotulosLadoMedida[lado]}
            </option>
          ))}
        </select>
        {state?.campos?.lado?.length ? (
          <p className="text-sm text-perigo">{state.campos.lado[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="valorCm">
          Medida (cm)
        </label>
        <input
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="valorCm"
          name="valorCm"
          required
          step="0.1"
          type="number"
        />
        {state?.campos?.valorCm?.length ? (
          <p className="text-sm text-perigo">{state.campos.valorCm[0]}</p>
        ) : null}
      </div>

      {sessoes.length > 0 ? (
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="sessaoId">
            Sessão vinculada (opcional)
          </label>
          <select
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            defaultValue=""
            id="sessaoId"
            name="sessaoId"
          >
            <option value="">Sem vínculo</option>
            {sessoes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <MensagemFormulario state={state} />

      <button
        className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Ruler className="size-4" />
        )}
        Registrar medida
      </button>
    </form>
  );
}
