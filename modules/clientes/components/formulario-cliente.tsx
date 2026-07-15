"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, Save } from "lucide-react";

import { criarCliente, type EstadoFormularioCliente } from "@/modules/clientes/actions";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioCliente = { status: "inicial" };

function MensagemFormulario({ state }: { state: EstadoFormularioCliente | undefined }) {
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

function CampoCheckbox({
  error,
  label,
  name,
  required,
}: {
  error?: string[];
  label: string;
  name: string;
  required?: boolean;
}) {
  const errorId = `${name}-erro`;

  return (
    <div className="grid gap-2">
      <label className="flex items-start gap-3 text-sm text-foreground" htmlFor={name}>
        <input
          aria-describedby={error?.length ? errorId : undefined}
          aria-invalid={error?.length ? true : undefined}
          className="mt-1 size-4 rounded border-border text-brand focus:ring-roxo"
          id={name}
          name={name}
          required={required}
          type="checkbox"
        />
        <span>{label}</span>
      </label>
      {error?.length ? (
        <p className="text-sm text-perigo" id={errorId}>
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

export function FormularioCliente() {
  const [state, formAction, pending] = useActionState(criarCliente, estadoInicial);
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <CampoTexto error={state?.campos?.nome} label="Nome completo" name="nome" required />
        <CampoTexto
          error={state?.campos?.dataNascimento}
          label="Data de nascimento"
          name="dataNascimento"
          required
          type="date"
        />
        <CampoTexto error={state?.campos?.telefone} label="Telefone" name="telefone" />
        <CampoTexto error={state?.campos?.email} label="E-mail" name="email" type="email" />
        <CampoTexto error={state?.campos?.profissao} label="Profissão" name="profissao" />
        <CampoTexto
          error={state?.campos?.contatoEmergenciaTelefone}
          label="Telefone de emergência"
          name="contatoEmergenciaTelefone"
        />
      </div>

      <CampoTexto
        error={state?.campos?.contatoEmergenciaNome}
        label="Contato de emergência"
        name="contatoEmergenciaNome"
      />
      <CampoArea error={state?.campos?.endereco} label="Endereço" name="endereco" />
      <CampoArea
        error={state?.campos?.objetivoTratamento}
        label="Objetivo do tratamento"
        name="objetivoTratamento"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <CampoArea error={state?.campos?.alergias} label="Alergias" name="alergias" />
        <CampoArea
          error={state?.campos?.medicamentos}
          label="Medicamentos em uso"
          name="medicamentos"
        />
        <CampoArea
          error={state?.campos?.condicoesSaude}
          label="Condições de saúde"
          name="condicoesSaude"
        />
        <CampoArea error={state?.campos?.cirurgias} label="Cirurgias" name="cirurgias" />
      </div>

      <CampoArea
        error={state?.campos?.contraindicacoes}
        label="Contraindicações"
        name="contraindicacoes"
      />
      <CampoArea
        error={state?.campos?.observacoesInternas}
        label="Observações internas"
        name="observacoesInternas"
      />

      <div className="grid gap-3 rounded-lg bg-creme p-4">
        <CampoCheckbox
          error={state?.campos?.consentimentoDados}
          label="Cliente consentiu com o uso dos dados para atendimento e acompanhamento."
          name="consentimentoDados"
          required
        />
        <CampoCheckbox
          error={state?.campos?.consentimentoImagem}
          label="Cliente consentiu com uso de imagem quando aplicável."
          name="consentimentoImagem"
        />
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
          <Save className="size-4" />
        )}
        Salvar cliente
      </button>
    </form>
  );
}
