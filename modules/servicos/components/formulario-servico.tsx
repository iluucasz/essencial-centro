"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { LoaderCircle, Save } from "lucide-react";

import { useFecharModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import {
  atualizarServico,
  criarServico,
  type EstadoFormularioServico,
} from "@/modules/servicos/actions";
import type { TipoOpcaoServico } from "@/modules/servicos/schema";

import { AdicionarOpcaoServico, GerenciarOpcoesServico } from "./gerenciar-opcoes-servico";

const estadoInicial: EstadoFormularioServico = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";
const classeArea =
  "min-h-24 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

export type OpcaoServicoResumo = { id: string; nome: string; padrao: boolean };

export type ServicoFormulario = {
  id: string;
  nome: string;
  grupo: string;
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

function CampoTexto({
  defaultValue,
  error,
  inputMode,
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  defaultValue?: string | number;
  error?: string[];
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
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
        defaultValue={defaultValue}
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

function CampoArea({
  defaultValue,
  error,
  label,
  name,
  placeholder,
}: {
  defaultValue?: string;
  error?: string[];
  label: string;
  name: string;
  placeholder?: string;
}) {
  const errorId = `${name}-erro`;

  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <textarea
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className={classeArea}
        defaultValue={defaultValue}
        id={name}
        name={name}
        placeholder={placeholder}
      />
      {error?.length ? (
        <p className="text-sm text-perigo" id={errorId}>
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

function CampoOpcao({
  defaultValue,
  error,
  gerenciar,
  label,
  name,
  opcoes,
  required,
  tipo,
}: {
  defaultValue?: string;
  error?: string[];
  gerenciar: ReactNode;
  label: string;
  name: string;
  opcoes: OpcaoServicoResumo[];
  required?: boolean;
  tipo: TipoOpcaoServico;
}) {
  const errorId = `${name}-erro`;
  const [opcoesLocais, setOpcoesLocais] = useState(opcoes);
  const [selecionado, setSelecionado] = useState(defaultValue ?? "");

  // Se o valor salvo não estiver mais na lista (ex.: opção excluída depois), mantém ele
  // visível como uma opção extra pra não sumir silenciosamente do formulário.
  const nomesConhecidos = opcoesLocais.map((opcao) => opcao.nome);
  const opcoesParaExibir =
    defaultValue && !nomesConhecidos.includes(defaultValue)
      ? [...opcoesLocais, { id: "valor-atual", nome: defaultValue, padrao: false }]
      : opcoesLocais;

  return (
    <div className="grid min-w-0 gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <label className="text-sm font-medium text-foreground" htmlFor={name}>
          {label}
        </label>
        <div className="flex items-center gap-3">
          <AdicionarOpcaoServico
            onAdicionada={(nova) => {
              setOpcoesLocais((atual) =>
                atual.some((opcao) => opcao.nome === nova.nome)
                  ? atual
                  : [...atual, { ...nova, padrao: false }],
              );
              setSelecionado(nova.nome);
            }}
            tipo={tipo}
          />
          {gerenciar}
        </div>
      </div>
      <select
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className={classeCampo}
        id={name}
        name={name}
        onChange={(event) => setSelecionado(event.target.value)}
        required={required}
        value={selecionado}
      >
        <option disabled={required} value="">
          {required ? "Selecione" : "Nenhuma"}
        </option>
        {opcoesParaExibir.map((opcao) => (
          <option key={opcao.id} value={opcao.nome}>
            {opcao.nome}
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

export function FormularioServico({
  opcoesGrupo,
  opcoesPeriodicidade,
  servico,
}: {
  opcoesGrupo: OpcaoServicoResumo[];
  opcoesPeriodicidade: OpcaoServicoResumo[];
  servico?: ServicoFormulario;
}) {
  const [state, formAction, pending] = useActionState(
    servico ? atualizarServico : criarServico,
    estadoInicial,
  );
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid min-w-0 gap-6">
      {servico ? <input name="id" type="hidden" value={servico.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <CampoTexto
          defaultValue={servico?.nome}
          error={state?.campos?.nome}
          label="Nome do serviço"
          name="nome"
          placeholder="Ex.: Limpeza de pele"
          required
        />
        <CampoOpcao
          defaultValue={servico?.grupo}
          error={state?.campos?.grupo}
          gerenciar={<GerenciarOpcoesServico opcoes={opcoesGrupo} titulo="Gerenciar grupos" />}
          label="Grupo"
          name="grupo"
          opcoes={opcoesGrupo}
          required
          tipo="grupo"
        />
        <CampoTexto
          defaultValue={servico?.duracaoMinutos}
          error={state?.campos?.duracaoMinutos}
          inputMode="numeric"
          label="Duração (minutos)"
          name="duracaoMinutos"
          placeholder="Ex.: 60"
          required
          type="number"
        />
        <CampoTexto
          defaultValue={formatarValor(servico?.valorCentavos)}
          error={state?.campos?.valorCentavos}
          inputMode="decimal"
          label="Valor (R$)"
          name="valor"
          placeholder="Ex.: 150,00"
        />
        <CampoOpcao
          defaultValue={valorInicial(servico?.periodicidade)}
          error={state?.campos?.periodicidade}
          gerenciar={
            <GerenciarOpcoesServico
              opcoes={opcoesPeriodicidade}
              titulo="Gerenciar periodicidades"
            />
          }
          label="Periodicidade"
          name="periodicidade"
          opcoes={opcoesPeriodicidade}
          tipo="periodicidade"
        />
      </div>

      <CampoArea
        defaultValue={valorInicial(servico?.descricao)}
        error={state?.campos?.descricao}
        label="Descrição"
        name="descricao"
        placeholder="Descreva o que é realizado durante o atendimento"
      />
      <CampoArea
        defaultValue={valorInicial(servico?.indicacao)}
        error={state?.campos?.indicacao}
        label="Indicação"
        name="indicacao"
        placeholder="Ex.: indicado para pele oleosa e com cravos"
      />
      <CampoArea
        defaultValue={valorInicial(servico?.contraindicacoes)}
        error={state?.campos?.contraindicacoes}
        label="Contraindicações"
        name="contraindicacoes"
        placeholder="Ex.: evitar em pele irritada ou lesionada"
      />
      <CampoArea
        defaultValue={valorInicial(servico?.preparo)}
        error={state?.campos?.preparo}
        label="Preparo prévio"
        name="preparo"
        placeholder="Ex.: evitar ácidos 48h antes do procedimento"
      />
      <CampoArea
        defaultValue={valorInicial(servico?.cuidadosPosteriores)}
        error={state?.campos?.cuidadosPosteriores}
        label="Cuidados posteriores"
        name="cuidadosPosteriores"
        placeholder="Ex.: usar protetor solar e evitar exposição solar"
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

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-40 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
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
      </div>
    </form>
  );
}
