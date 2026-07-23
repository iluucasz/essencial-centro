"use client";

import { useActionState, useEffect } from "react";
import {
  CalendarClock,
  LoaderCircle,
  LockKeyhole,
  NotebookPen,
  PackageCheck,
  Save,
} from "lucide-react";

import { useFecharModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import {
  atualizarSessao,
  criarSessao,
  type EstadoFormularioSessao,
} from "@/modules/sessoes/actions";

const estadoInicial: EstadoFormularioSessao = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";
const classeArea =
  "min-h-20 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

type Opcao = { id: string; nome: string };

export type AgendamentoSessaoFormulario = Opcao & {
  duracaoMinutos: number;
  inicio: Date;
  pacoteId: string | null;
  pacoteNome: string | null;
  servicoId: string;
  servicoNome: string;
  status: string;
};

export type SessaoFormulario = {
  id: string;
  clienteId: string;
  servicoId: string;
  agendamentoId: string | null;
  pacoteId: string | null;
  duracaoMinutos: number | null;
  regiaoTratada: string | null;
  condicaoAntes: string | null;
  relatoCliente: string | null;
  escalaDorAntes: number | null;
  escalaDorDepois: number | null;
  avaliacaoProfissional: string | null;
  equipamentosUtilizados: string | null;
  parametrosUtilizados: string | null;
  produtosAplicados: string | null;
  reacoesObservadas: string | null;
  observacoesInternas: string | null;
  orientacoesPosAtendimento: string | null;
  proximaSessaoRecomendada: Date | null;
  presencaConfirmada: boolean;
};

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

function MensagemFormulario({ state }: { state: EstadoFormularioSessao | undefined }) {
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
  defaultValue?: string | null;
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
        defaultValue={defaultValue ?? undefined}
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

function CampoSelect({
  defaultValue,
  error,
  label,
  name,
  opcaoVazia,
  opcoes,
  required,
}: {
  defaultValue?: string | null;
  error?: string[];
  label: string;
  name: string;
  opcaoVazia: string;
  opcoes: Opcao[];
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
          {opcaoVazia}
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

function LinhaResumoAgendamento({
  icone,
  label,
  valor,
}: {
  icone: React.ReactNode;
  label: string;
  valor: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
      <span className="shrink-0 rounded-lg bg-brand/10 p-1.5 text-brand">{icone}</span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-muted">{label}</span>
        <span className="block truncate text-sm font-medium text-foreground">{valor}</span>
      </span>
    </span>
  );
}

function ResumoAgendamentoTravado({ agendamento }: { agendamento: AgendamentoSessaoFormulario }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-brand/15 bg-brand/5 p-4 sm:col-span-2">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-brand/10 p-2 text-brand">
          <LockKeyhole className="size-4" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-foreground">
            Sessão vinculada ao atendimento realizado
          </span>
          <span className="mt-1 block text-sm text-muted">
            Serviço, pacote e atendimento vêm da agenda concluída e não podem ser alterados aqui.
          </span>
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <LinhaResumoAgendamento
          icone={<CalendarClock className="size-4" aria-hidden="true" />}
          label="Atendimento"
          valor={formatadorDataHora.format(agendamento.inicio)}
        />
        <LinhaResumoAgendamento
          icone={<NotebookPen className="size-4" aria-hidden="true" />}
          label="Serviço"
          valor={agendamento.servicoNome}
        />
        <LinhaResumoAgendamento
          icone={<PackageCheck className="size-4" aria-hidden="true" />}
          label="Pacote"
          valor={agendamento.pacoteNome ?? "Sessão avulsa"}
        />
      </div>
    </div>
  );
}

export function FormularioSessao({
  agendamentoTravado,
  clienteId,
  sessao,
  servicos,
  agendamentos,
  pacotes,
}: {
  agendamentoTravado?: AgendamentoSessaoFormulario;
  clienteId: string;
  sessao?: SessaoFormulario;
  servicos: Opcao[];
  agendamentos: Opcao[];
  pacotes: Opcao[];
}) {
  const [state, formAction, pending] = useActionState(
    sessao ? atualizarSessao : criarSessao,
    estadoInicial,
  );
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  const duracaoInicial = sessao?.duracaoMinutos ?? agendamentoTravado?.duracaoMinutos ?? undefined;

  return (
    <form action={formAction} className="grid min-w-0 gap-6">
      <input name="clienteId" type="hidden" value={clienteId} />
      {sessao ? <input name="id" type="hidden" value={sessao.id} /> : null}
      {agendamentoTravado ? (
        <>
          <input name="servicoId" type="hidden" value={agendamentoTravado.servicoId} />
          <input name="agendamentoId" type="hidden" value={agendamentoTravado.id} />
          {agendamentoTravado.pacoteId ? (
            <input name="pacoteId" type="hidden" value={agendamentoTravado.pacoteId} />
          ) : null}
        </>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {agendamentoTravado ? (
          <ResumoAgendamentoTravado agendamento={agendamentoTravado} />
        ) : (
          <>
            <CampoSelect
              defaultValue={sessao?.servicoId}
              error={state?.campos?.servicoId}
              label="Serviço"
              name="servicoId"
              opcaoVazia="Selecione"
              opcoes={servicos}
              required
            />
            <CampoSelect
              defaultValue={sessao?.agendamentoId}
              error={state?.campos?.agendamentoId}
              label="Atendimento vinculado (opcional)"
              name="agendamentoId"
              opcaoVazia="Sem vínculo"
              opcoes={agendamentos}
            />
            <CampoSelect
              defaultValue={sessao?.pacoteId}
              error={state?.campos?.pacoteId}
              label="Pacote (opcional)"
              name="pacoteId"
              opcaoVazia="Sessão avulsa"
              opcoes={pacotes}
            />
          </>
        )}
        <CampoTexto
          defaultValue={duracaoInicial}
          error={state?.campos?.duracaoMinutos}
          inputMode="numeric"
          label="Duração (minutos)"
          name="duracaoMinutos"
          placeholder="Ex.: 60"
          type="number"
        />
        <CampoTexto
          defaultValue={sessao?.regiaoTratada ?? undefined}
          error={state?.campos?.regiaoTratada}
          label="Região tratada"
          name="regiaoTratada"
          placeholder="Ex.: Abdômen e flancos"
        />
        <CampoTexto
          defaultValue={sessao?.escalaDorAntes ?? undefined}
          error={state?.campos?.escalaDorAntes}
          inputMode="numeric"
          label="Escala de dor antes (0-10)"
          name="escalaDorAntes"
          placeholder="Ex.: 3"
          type="number"
        />
        <CampoTexto
          defaultValue={sessao?.escalaDorDepois ?? undefined}
          error={state?.campos?.escalaDorDepois}
          inputMode="numeric"
          label="Escala de dor depois (0-10)"
          name="escalaDorDepois"
          placeholder="Ex.: 1"
          type="number"
        />
      </div>

      <section className="grid gap-4">
        <h3 className="font-semibold text-roxo">Relato do cliente</h3>
        <CampoArea
          defaultValue={sessao?.condicaoAntes}
          error={state?.campos?.condicaoAntes}
          label="Condição antes da sessão"
          name="condicaoAntes"
          placeholder="Ex.: Cliente relatou retenção e sensibilidade leve"
        />
        <CampoArea
          defaultValue={sessao?.relatoCliente}
          error={state?.campos?.relatoCliente}
          label="Relato do cliente"
          name="relatoCliente"
          placeholder="Ex.: percebeu menor inchaço após a sessão anterior"
        />
      </section>

      <section className="grid gap-4">
        <h3 className="font-semibold text-roxo">Avaliação da profissional</h3>
        <CampoArea
          defaultValue={sessao?.avaliacaoProfissional}
          error={state?.campos?.avaliacaoProfissional}
          label="Avaliação profissional"
          name="avaliacaoProfissional"
          placeholder="Ex.: boa resposta ao protocolo, sem intercorrências"
        />
        <CampoArea
          defaultValue={sessao?.equipamentosUtilizados}
          error={state?.campos?.equipamentosUtilizados}
          label="Equipamentos utilizados"
          name="equipamentosUtilizados"
          placeholder="Ex.: ultrassom, radiofrequência"
        />
        <CampoArea
          defaultValue={sessao?.parametrosUtilizados}
          error={state?.campos?.parametrosUtilizados}
          label="Parâmetros utilizados"
          name="parametrosUtilizados"
          placeholder="Ex.: intensidade 3, 15 minutos por região"
        />
        <CampoArea
          defaultValue={sessao?.produtosAplicados}
          error={state?.campos?.produtosAplicados}
          label="Produtos aplicados"
          name="produtosAplicados"
          placeholder="Ex.: gel condutor e creme drenante"
        />
        <CampoArea
          defaultValue={sessao?.reacoesObservadas}
          error={state?.campos?.reacoesObservadas}
          label="Reações observadas"
          name="reacoesObservadas"
          placeholder="Ex.: hiperemia leve e esperada"
        />
        <CampoArea
          defaultValue={sessao?.observacoesInternas}
          error={state?.campos?.observacoesInternas}
          label="Observações internas (não visível ao cliente)"
          name="observacoesInternas"
          placeholder="Anotações para a equipe, não exibidas no portal"
        />
      </section>

      <section className="grid gap-4">
        <h3 className="font-semibold text-roxo">Área compartilhada</h3>
        <CampoArea
          defaultValue={sessao?.orientacoesPosAtendimento}
          error={state?.campos?.orientacoesPosAtendimento}
          label="Orientações pós-atendimento"
          name="orientacoesPosAtendimento"
          placeholder="Ex.: hidratar-se bem e evitar exposição solar por 24h"
        />
      </section>

      <MensagemFormulario state={state} />

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-40 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : sessao ? (
            <Save className="size-4" />
          ) : (
            <NotebookPen className="size-4" />
          )}
          {sessao ? "Salvar alterações" : "Registrar sessão"}
        </button>
      </div>
    </form>
  );
}
