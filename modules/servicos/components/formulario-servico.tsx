"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, Save } from "lucide-react";

import { useFecharModal } from "@/components/ui/modal-formulario";
import {
  atualizarServico,
  criarServico,
  type EstadoFormularioServico,
} from "@/modules/servicos/actions";
import { gruposServico, rotulosGrupoServico, type GrupoServico } from "@/modules/servicos/schema";

const estadoInicial: EstadoFormularioServico = { status: "inicial" };

export type ServicoFormulario = {
  id: string;
  nome: string;
  grupo: GrupoServico;
  descricao: string | null;
  indicacao: string | null;
  contraindicacoes: string | null;
  duracaoMinutos: number;
  periodicidade: string | null;
  valorCentavos: number | null;
  preparo: string | null;
  cuidadosPosteriores: string | null;
  ativo: boolean;
};

function valorInicial(valor: string | null | undefined) {
  return valor ?? undefined;
}

function formatarValor(valorCentavos?: number | null) {
  if (valorCentavos === null || valorCentavos === undefined) return undefined;

  return String(valorCentavos / 100).replace(".", ",");
}

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
  defaultValue,
  error,
  label,
  name,
  required,
  type = "text",
}: {
  defaultValue?: string | number;
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

function CampoGrupo({ defaultValue, error }: { defaultValue?: GrupoServico; error?: string[] }) {
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
        defaultValue={defaultValue ?? ""}
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

export function FormularioServico({ servico }: { servico?: ServicoFormulario }) {
  const [state, formAction, pending] = useActionState(
    servico ? atualizarServico : criarServico,
    estadoInicial,
  );
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid gap-6">
      {servico ? <input name="id" type="hidden" value={servico.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <CampoTexto
          defaultValue={servico?.nome}
          error={state?.campos?.nome}
          label="Nome do serviço"
          name="nome"
          required
        />
        <CampoGrupo defaultValue={servico?.grupo} error={state?.campos?.grupo} />
        <CampoTexto
          defaultValue={servico?.duracaoMinutos}
          error={state?.campos?.duracaoMinutos}
          label="Duração (minutos)"
          name="duracaoMinutos"
          required
          type="number"
        />
        <CampoTexto
          defaultValue={formatarValor(servico?.valorCentavos)}
          error={state?.campos?.valorCentavos}
          label="Valor (R$)"
          name="valor"
        />
        <CampoTexto
          defaultValue={valorInicial(servico?.periodicidade)}
          error={state?.campos?.periodicidade}
          label="Periodicidade"
          name="periodicidade"
        />
      </div>

      <CampoArea
        defaultValue={valorInicial(servico?.descricao)}
        error={state?.campos?.descricao}
        label="Descrição"
        name="descricao"
      />
      <CampoArea
        defaultValue={valorInicial(servico?.indicacao)}
        error={state?.campos?.indicacao}
        label="Indicação"
        name="indicacao"
      />
      <CampoArea
        defaultValue={valorInicial(servico?.contraindicacoes)}
        error={state?.campos?.contraindicacoes}
        label="Contraindicações"
        name="contraindicacoes"
      />
      <CampoArea
        defaultValue={valorInicial(servico?.preparo)}
        error={state?.campos?.preparo}
        label="Preparo prévio"
        name="preparo"
      />
      <CampoArea
        defaultValue={valorInicial(servico?.cuidadosPosteriores)}
        error={state?.campos?.cuidadosPosteriores}
        label="Cuidados posteriores"
        name="cuidadosPosteriores"
      />

      {servico ? (
        <label className="flex items-start gap-3 rounded-lg bg-creme p-3 text-sm text-foreground">
          <input
            className="mt-1 size-4 rounded border-border text-brand focus:ring-roxo"
            defaultChecked={servico.ativo}
            name="ativo"
            type="checkbox"
            value="true"
          />
          <span>Serviço ativo para novos agendamentos e pacotes.</span>
        </label>
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
          <Save className="size-4" />
        )}
        {servico ? "Atualizar serviço" : "Salvar serviço"}
      </button>
    </form>
  );
}
