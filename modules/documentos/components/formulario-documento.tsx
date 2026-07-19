"use client";

import { useActionState, useEffect } from "react";
import { FileText, LoaderCircle } from "lucide-react";

import { criarDocumento, type EstadoFormularioDocumento } from "@/modules/documentos/actions";
import { rotulosTipoDocumento, tiposDocumento } from "@/modules/documentos/schema";
import { useFecharModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";

const estadoInicial: EstadoFormularioDocumento = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";
const classeArea =
  "min-h-40 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

function MensagemFormulario({ state }: { state: EstadoFormularioDocumento | undefined }) {
  if (!state?.mensagem) return null;

  return (
    <p
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-medium",
        state.status === "erro" ? "bg-perigo/10 text-perigo" : "bg-brand/10 text-brand",
      )}
      role={state.status === "erro" ? "alert" : "status"}
    >
      {state.mensagem}
    </p>
  );
}

export function FormularioDocumento({ clienteId }: { clienteId: string }) {
  const [state, formAction, pending] = useActionState(criarDocumento, estadoInicial);
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid min-w-0 gap-6">
      <input name="clienteId" type="hidden" value={clienteId} />

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="tipo">
          Tipo de documento
        </label>
        <select className={classeCampo} defaultValue="" id="tipo" name="tipo" required>
          <option disabled value="">
            Selecione
          </option>
          {tiposDocumento.map((tipo) => (
            <option key={tipo} value={tipo}>
              {rotulosTipoDocumento[tipo]}
            </option>
          ))}
        </select>
        {state?.campos?.tipo?.length ? (
          <p className="text-sm text-perigo">{state.campos.tipo[0]}</p>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="titulo">
          Título
        </label>
        <input
          className={classeCampo}
          id="titulo"
          name="titulo"
          placeholder="Ex.: Contrato de prestação de serviços — Estética corporal"
          required
        />
        {state?.campos?.titulo?.length ? (
          <p className="text-sm text-perigo">{state.campos.titulo[0]}</p>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="conteudo">
          Conteúdo
        </label>
        <textarea
          className={classeArea}
          id="conteudo"
          name="conteudo"
          placeholder="Escreva o texto que será emitido para assinatura ou registro."
          required
        />
        {state?.campos?.conteudo?.length ? (
          <p className="text-sm text-perigo">{state.campos.conteudo[0]}</p>
        ) : null}
      </div>

      <MensagemFormulario state={state} />

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-44 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <FileText className="size-4" />
          )}
          Emitir documento
        </button>
      </div>
    </form>
  );
}
