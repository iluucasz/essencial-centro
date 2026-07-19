"use client";

import { useActionState, useEffect } from "react";
import { CalendarPlus, LoaderCircle, Save } from "lucide-react";

import { CampoDataHoraCalendario } from "@/components/ui/calendario-tailgrids";
import { cn } from "@/lib/utils";
import {
  atualizarAgendamento,
  criarAgendamento,
  type EstadoFormularioAgendamento,
} from "@/modules/agenda/actions";
import {
  modalidadeAtendimento,
  rotulosModalidadeAtendimento,
  type ModalidadeAtendimento,
} from "@/modules/agenda/schema";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioAgendamento = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

type Opcao = { id: string; nome: string };

export type AgendamentoFormulario = {
  id: string;
  clienteId: string;
  servicoId: string;
  profissionalId: string;
  pacoteId: string | null;
  inicio: Date;
  duracaoMinutos: number;
  modalidade: ModalidadeAtendimento;
  observacoes: string | null;
};

function formatarDataIso(data: Date) {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarHorario(data: Date) {
  const hora = String(data.getUTCHours()).padStart(2, "0");
  const minuto = String(data.getUTCMinutes()).padStart(2, "0");

  return `${hora}:${minuto}`;
}

function MensagemFormulario({ state }: { state: EstadoFormularioAgendamento | undefined }) {
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

function CampoSelect({
  defaultValue,
  error,
  label,
  name,
  opcoes,
  opcaoVazia,
  required = true,
}: {
  defaultValue?: string;
  error?: string[];
  label: string;
  name: string;
  opcoes: Opcao[];
  opcaoVazia?: string;
  required?: boolean;
}) {
  const errorId = `${name}-erro`;

  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <select
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className={classeCampo}
        defaultValue={defaultValue ?? ""}
        id={name}
        name={name}
        required={required}
      >
        <option disabled={required} value="">
          {opcaoVazia ?? "Selecione"}
        </option>
        {opcoes.map((opcao) => (
          <option key={opcao.id} value={opcao.id}>
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

function CampoTexto({
  defaultValue,
  error,
  inputMode,
  label,
  min,
  name,
  placeholder,
  required,
  type = "text",
}: {
  defaultValue?: string | number;
  error?: string[];
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  label: string;
  min?: string;
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
        min={min}
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

export function FormularioAgendamento({
  agendamento,
  clienteFixoId,
  clientes,
  dataInicial,
  servicos,
  profissionais,
  pacotes,
}: {
  agendamento?: AgendamentoFormulario;
  clienteFixoId?: string;
  clientes: Opcao[];
  dataInicial?: string;
  servicos: Opcao[];
  profissionais: Opcao[];
  pacotes: Opcao[];
}) {
  const [state, formAction, pending] = useActionState(
    agendamento ? atualizarAgendamento : criarAgendamento,
    estadoInicial,
  );
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid min-w-0 gap-5">
      {agendamento ? <input name="id" type="hidden" value={agendamento.id} /> : null}

      {clienteFixoId ? (
        <input name="clienteId" type="hidden" value={clienteFixoId} />
      ) : (
        <CampoSelect
          defaultValue={agendamento?.clienteId}
          error={state?.campos?.clienteId}
          label="Cliente"
          name="clienteId"
          opcoes={clientes}
        />
      )}
      <CampoSelect
        defaultValue={agendamento?.servicoId}
        error={state?.campos?.servicoId}
        label="Serviço"
        name="servicoId"
        opcoes={servicos}
      />
      <CampoSelect
        defaultValue={agendamento?.profissionalId}
        error={state?.campos?.profissionalId}
        label="Profissional"
        name="profissionalId"
        opcoes={profissionais}
      />
      <CampoSelect
        defaultValue={agendamento?.pacoteId ?? undefined}
        error={state?.campos?.pacoteId}
        label="Pacote (opcional)"
        name="pacoteId"
        opcaoVazia="Sessão avulsa"
        opcoes={pacotes}
        required={false}
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_12rem]">
        <CampoDataHoraCalendario
          dataInicial={agendamento ? formatarDataIso(agendamento.inicio) : dataInicial}
          error={state?.campos?.inicio}
          horarioInicial={agendamento ? formatarHorario(agendamento.inicio) : undefined}
          label="Data e horário"
          name="inicio"
        />
        <CampoTexto
          defaultValue={agendamento?.duracaoMinutos}
          error={state?.campos?.duracaoMinutos}
          inputMode="numeric"
          label="Duração (minutos)"
          min="1"
          name="duracaoMinutos"
          placeholder="60"
          required
          type="number"
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="modalidade">
          Modalidade
        </label>
        <select
          className={classeCampo}
          defaultValue={agendamento?.modalidade ?? "presencial"}
          id="modalidade"
          name="modalidade"
        >
          {modalidadeAtendimento.map((valor) => (
            <option key={valor} value={valor}>
              {rotulosModalidadeAtendimento[valor]}
            </option>
          ))}
        </select>
      </div>

      <CampoTexto
        defaultValue={agendamento?.observacoes ?? undefined}
        error={state?.campos?.observacoes}
        label="Observações"
        name="observacoes"
        placeholder="Ex.: preferência de sala, preparo ou aviso para a equipe"
      />

      <MensagemFormulario state={state} />

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : agendamento ? (
            <Save className="size-4" />
          ) : (
            <CalendarPlus className="size-4" />
          )}
          {agendamento ? "Salvar alterações" : "Agendar"}
        </button>
      </div>
    </form>
  );
}
