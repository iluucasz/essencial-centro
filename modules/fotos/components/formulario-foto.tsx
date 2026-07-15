"use client";

import { useActionState } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";

import { criarFoto, type EstadoFormularioFoto } from "@/modules/fotos/actions";

const estadoInicial: EstadoFormularioFoto = { status: "inicial" };

type Opcao = { id: string; nome: string };

function MensagemFormulario({ state }: { state: EstadoFormularioFoto | undefined }) {
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

export function FormularioFoto({ clienteId, sessoes }: { clienteId: string; sessoes: Opcao[] }) {
  const [state, formAction, pending] = useActionState(criarFoto, estadoInicial);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm"
      encType="multipart/form-data"
    >
      <input name="clienteId" type="hidden" value={clienteId} />

      <div>
        <h2 className="text-lg font-semibold text-brand">Nova foto</h2>
        <p className="mt-1 text-sm text-muted">
          Mesma posição, enquadramento, iluminação e distância a cada registro.
        </p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="regiao">
          Região
        </label>
        <input
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="regiao"
          name="regiao"
          placeholder="Ex.: Abdômen, rosto, glúteo…"
          required
        />
        {state?.campos?.regiao?.length ? (
          <p className="text-sm text-perigo">{state.campos.regiao[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="arquivo">
          Imagem (JPEG, PNG ou WebP — até 4MB)
        </label>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-foreground"
          id="arquivo"
          name="arquivo"
          required
          type="file"
        />
        {state?.campos?.arquivo?.length ? (
          <p className="text-sm text-perigo">{state.campos.arquivo[0]}</p>
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
          <ImagePlus className="size-4" />
        )}
        Enviar foto
      </button>
    </form>
  );
}
