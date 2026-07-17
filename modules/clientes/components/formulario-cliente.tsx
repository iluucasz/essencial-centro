"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, Save } from "lucide-react";

import { CampoDataCalendario } from "@/components/ui/calendario-tailgrids";
import {
  atualizarCliente,
  criarCliente,
  type EstadoFormularioCliente,
} from "@/modules/clientes/actions";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioCliente = { status: "inicial" };

export type ClienteFormulario = {
  id: string;
  nome: string;
  dataNascimento: Date;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  contatoEmergenciaNome: string | null;
  contatoEmergenciaTelefone: string | null;
  profissao: string | null;
  objetivoTratamento: string | null;
  alergias: string | null;
  medicamentos: string | null;
  condicoesSaude: string | null;
  cirurgias: string | null;
  contraindicacoes: string | null;
  consentimentoDados: boolean;
  consentimentoImagem: boolean;
  observacoesInternas: string | null;
};

function valorInicial(valor: string | null | undefined) {
  return valor ?? undefined;
}

function formatarDataInput(data?: Date | null) {
  if (!data) return undefined;

  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

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
  defaultValue,
  error,
  label,
  name,
  required,
  type = "text",
}: {
  defaultValue?: string;
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
        defaultValue={defaultValue}
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

function CampoArea({
  defaultValue,
  error,
  label,
  name,
}: {
  defaultValue?: string;
  error?: string[];
  label: string;
  name: string;
}) {
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
        defaultValue={defaultValue}
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
  defaultChecked,
  error,
  label,
  name,
  required,
}: {
  defaultChecked?: boolean;
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
          defaultChecked={defaultChecked}
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

export function FormularioCliente({ cliente }: { cliente?: ClienteFormulario }) {
  const [state, formAction, pending] = useActionState(
    cliente ? atualizarCliente : criarCliente,
    estadoInicial,
  );
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid gap-6">
      {cliente ? <input name="id" type="hidden" value={cliente.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <CampoTexto
          defaultValue={valorInicial(cliente?.nome)}
          error={state?.campos?.nome}
          label="Nome completo"
          name="nome"
          required
        />
        <CampoDataCalendario
          defaultValue={formatarDataInput(cliente?.dataNascimento)}
          error={state?.campos?.dataNascimento}
          label="Data de nascimento"
          name="dataNascimento"
          required
        />
        <CampoTexto
          defaultValue={valorInicial(cliente?.telefone)}
          error={state?.campos?.telefone}
          label="Telefone"
          name="telefone"
        />
        <CampoTexto
          defaultValue={valorInicial(cliente?.email)}
          error={state?.campos?.email}
          label="E-mail"
          name="email"
          type="email"
        />
        <CampoTexto
          defaultValue={valorInicial(cliente?.profissao)}
          error={state?.campos?.profissao}
          label="Profissão"
          name="profissao"
        />
        <CampoTexto
          defaultValue={valorInicial(cliente?.contatoEmergenciaTelefone)}
          error={state?.campos?.contatoEmergenciaTelefone}
          label="Telefone de emergência"
          name="contatoEmergenciaTelefone"
        />
      </div>

      <CampoTexto
        defaultValue={valorInicial(cliente?.contatoEmergenciaNome)}
        error={state?.campos?.contatoEmergenciaNome}
        label="Contato de emergência"
        name="contatoEmergenciaNome"
      />
      <CampoArea
        defaultValue={valorInicial(cliente?.endereco)}
        error={state?.campos?.endereco}
        label="Endereço"
        name="endereco"
      />
      <CampoArea
        defaultValue={valorInicial(cliente?.objetivoTratamento)}
        error={state?.campos?.objetivoTratamento}
        label="Objetivo do tratamento"
        name="objetivoTratamento"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <CampoArea
          defaultValue={valorInicial(cliente?.alergias)}
          error={state?.campos?.alergias}
          label="Alergias"
          name="alergias"
        />
        <CampoArea
          defaultValue={valorInicial(cliente?.medicamentos)}
          error={state?.campos?.medicamentos}
          label="Medicamentos em uso"
          name="medicamentos"
        />
        <CampoArea
          defaultValue={valorInicial(cliente?.condicoesSaude)}
          error={state?.campos?.condicoesSaude}
          label="Condições de saúde"
          name="condicoesSaude"
        />
        <CampoArea
          defaultValue={valorInicial(cliente?.cirurgias)}
          error={state?.campos?.cirurgias}
          label="Cirurgias"
          name="cirurgias"
        />
      </div>

      <CampoArea
        defaultValue={valorInicial(cliente?.contraindicacoes)}
        error={state?.campos?.contraindicacoes}
        label="Contraindicações"
        name="contraindicacoes"
      />
      <CampoArea
        defaultValue={valorInicial(cliente?.observacoesInternas)}
        error={state?.campos?.observacoesInternas}
        label="Observações internas"
        name="observacoesInternas"
      />

      <div className="grid gap-3 rounded-lg bg-creme p-4">
        <CampoCheckbox
          defaultChecked={cliente?.consentimentoDados}
          error={state?.campos?.consentimentoDados}
          label="Cliente consentiu com o uso dos dados para atendimento e acompanhamento."
          name="consentimentoDados"
          required
        />
        <CampoCheckbox
          defaultChecked={cliente?.consentimentoImagem}
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
        {cliente ? "Atualizar cliente" : "Salvar cliente"}
      </button>
    </form>
  );
}
