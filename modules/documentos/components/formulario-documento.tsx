"use client";

import { useActionState, useEffect } from "react";
import { FileText, LoaderCircle } from "lucide-react";

import { criarDocumento, type EstadoFormularioDocumento } from "@/modules/documentos/actions";
import { rotulosTipoDocumento, tiposDocumento } from "@/modules/documentos/schema";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioDocumento = { status: "inicial" };

function MensagemFormulario({ state }: { state: EstadoFormularioDocumento | undefined }) {
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

export function FormularioDocumento({ clienteId }: { clienteId: string }) {
  const [state, formAction, pending] = useActionState(criarDocumento, estadoInicial);
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid gap-6">
      <input name="clienteId" type="hidden" value={clienteId} />

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="tipo">
          Tipo de documento
        </label>
        <select
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          defaultValue=""
          id="tipo"
          name="tipo"
          required
        >
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

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="titulo">
          Título
        </label>
        <input
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="titulo"
          name="titulo"
          placeholder="Ex.: Contrato de prestação de serviços — Estética corporal"
          required
        />
        {state?.campos?.titulo?.length ? (
          <p className="text-sm text-perigo">{state.campos.titulo[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="conteudo">
          Conteúdo
        </label>
        <textarea
          className="min-h-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="conteudo"
          name="conteudo"
          required
        />
        {state?.campos?.conteudo?.length ? (
          <p className="text-sm text-perigo">{state.campos.conteudo[0]}</p>
        ) : null}
      </div>

      <MensagemFormulario state={state} />

      <button
        className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
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
    </form>
  );
}
