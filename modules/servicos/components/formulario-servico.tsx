"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, Save } from "lucide-react";

import { criarServico, type EstadoFormularioServico } from "@/modules/servicos/actions";
import { gruposServico, rotulosGrupoServico } from "@/modules/servicos/schema";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioServico = { status: "inicial" };

function MensagemFormulario({ state }: { state: EstadoFormularioServico | undefined }) {
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

function CampoTexto({
  error,
  label,
  name,
  required,
  type = "text",
}: {
  error?: string[];
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  const errorId = `${name}-erro`;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
        id={name}
        name={name}
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

function CampoArea({ error, label, name }: { error?: string[]; label: string; name: string }) {
  const errorId = `${name}-erro`;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <textarea
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className="min-h-24 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
        id={name}
        name={name}
      />
      {error?.length ? (
        <p className="text-sm text-perigo" id={errorId}>
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

function CampoGrupo({ error }: { error?: string[] }) {
  const errorId = "grupo-erro";

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor="grupo">
        Grupo
      </label>
      <select
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
        defaultValue=""
        id="grupo"
        name="grupo"
        required
      >
        <option disabled value="">
          Selecione um grupo
        </option>
        {gruposServico.map((grupo) => (
          <option key={grupo} value={grupo}>
            {rotulosGrupoServico[grupo]}
          </option>
        ))}
      </select>
      {error?.length ? (
        <p className="text-sm text-perigo" id={errorId}>
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

export function FormularioServico() {
  const [state, formAction, pending] = useActionState(criarServico, estadoInicial);
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <CampoTexto error={state?.campos?.nome} label="Nome do serviço" name="nome" required />
        <CampoGrupo error={state?.campos?.grupo} />
        <CampoTexto
          error={state?.campos?.duracaoMinutos}
          label="Duração (minutos)"
          name="duracaoMinutos"
          required
          type="number"
        />
        <CampoTexto error={state?.campos?.valorCentavos} label="Valor (R$)" name="valor" />
        <CampoTexto
          error={state?.campos?.periodicidade}
          label="Periodicidade"
          name="periodicidade"
        />
      </div>

      <CampoArea error={state?.campos?.descricao} label="Descrição" name="descricao" />
      <CampoArea error={state?.campos?.indicacao} label="Indicação" name="indicacao" />
      <CampoArea
        error={state?.campos?.contraindicacoes}
        label="Contraindicações"
        name="contraindicacoes"
      />
      <CampoArea error={state?.campos?.preparo} label="Preparo prévio" name="preparo" />
      <CampoArea
        error={state?.campos?.cuidadosPosteriores}
        label="Cuidados posteriores"
        name="cuidadosPosteriores"
      />

      <MensagemFormulario state={state} />

      <button
        className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="size-4" />
        )}
        Salvar serviço
      </button>
    </form>
  );
}
