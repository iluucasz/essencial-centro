"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, PackagePlus } from "lucide-react";

import { useFecharModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import { criarPlano, type EstadoFormularioPlano } from "@/modules/planos/actions";

const estadoInicial: EstadoFormularioPlano = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

function Campo({
  error,
  inputMode,
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  error?: string[];
  inputMode?: "numeric" | "decimal" | "text";
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  const errorId = `${name}-erro`;

  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className={classeCampo}
        id={name}
        inputMode={inputMode}
        name={name}
        placeholder={placeholder}
        required={required}
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

export function FormularioPlano({ servicoId }: { servicoId: string }) {
  const [state, formAction, pending] = useActionState(criarPlano, estadoInicial);
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid min-w-0 gap-5">
      <input name="servicoId" type="hidden" value={servicoId} />

      <Campo
        error={state?.campos?.nome}
        label="Nome do pacote (opcional)"
        name="nome"
        placeholder="Ex.: Pacote Detox 10 sessões"
      />

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Campo
          error={state?.campos?.quantidadeSessoes}
          inputMode="numeric"
          label="Quantidade de sessões"
          name="quantidadeSessoes"
          placeholder="Ex.: 10"
          required
          type="number"
        />
        <Campo
          error={state?.campos?.valorCentavos}
          inputMode="decimal"
          label="Valor do pacote (R$)"
          name="valor"
          placeholder="Ex.: 990,00"
          required
        />
      </div>

      {state?.mensagem ? (
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
            <PackagePlus className="size-4" />
          )}
          Criar pacote
        </button>
      </div>
    </form>
  );
}
