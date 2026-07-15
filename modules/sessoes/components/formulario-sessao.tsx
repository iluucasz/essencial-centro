"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, NotebookPen } from "lucide-react";

import { criarSessao, type EstadoFormularioSessao } from "@/modules/sessoes/actions";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioSessao = { status: "inicial" };

type Opcao = { id: string; nome: string };

function MensagemFormulario({ state }: { state: EstadoFormularioSessao | undefined }) {
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
        className="min-h-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
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

function CampoSelect({
  error,
  label,
  name,
  opcaoVazia,
  opcoes,
  required,
}: {
  error?: string[];
  label: string;
  name: string;
  opcaoVazia: string;
  opcoes: Opcao[];
  required?: boolean;
}) {
  const errorId = `${name}-erro`;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={name}>
        {label}
      </label>
      <select
        aria-describedby={error?.length ? errorId : undefined}
        aria-invalid={error?.length ? true : undefined}
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
        defaultValue=""
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

export function FormularioSessao({
  clienteId,
  servicos,
  agendamentos,
  pacotes,
}: {
  clienteId: string;
  servicos: Opcao[];
  agendamentos: Opcao[];
  pacotes: Opcao[];
}) {
  const [state, formAction, pending] = useActionState(criarSessao, estadoInicial);
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid gap-6">
      <input name="clienteId" type="hidden" value={clienteId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSelect
          error={state?.campos?.servicoId}
          label="Serviço"
          name="servicoId"
          opcaoVazia="Selecione"
          opcoes={servicos}
          required
        />
        <CampoSelect
          error={state?.campos?.agendamentoId}
          label="Atendimento vinculado (opcional)"
          name="agendamentoId"
          opcaoVazia="Sem vínculo"
          opcoes={agendamentos}
        />
        <CampoSelect
          error={state?.campos?.pacoteId}
          label="Pacote (opcional)"
          name="pacoteId"
          opcaoVazia="Sessão avulsa"
          opcoes={pacotes}
        />
        <CampoTexto
          error={state?.campos?.duracaoMinutos}
          label="Duração (minutos)"
          name="duracaoMinutos"
          type="number"
        />
        <CampoTexto
          error={state?.campos?.regiaoTratada}
          label="Região tratada"
          name="regiaoTratada"
        />
        <CampoTexto
          error={state?.campos?.escalaDorAntes}
          label="Escala de dor antes (0–10)"
          name="escalaDorAntes"
          type="number"
        />
        <CampoTexto
          error={state?.campos?.escalaDorDepois}
          label="Escala de dor depois (0–10)"
          name="escalaDorDepois"
          type="number"
        />
        <CampoTexto
          error={state?.campos?.proximaSessaoRecomendada}
          label="Próxima sessão recomendada"
          name="proximaSessaoRecomendada"
          type="date"
        />
      </div>

      <section className="grid gap-4">
        <h3 className="font-semibold text-roxo">Relato do cliente</h3>
        <CampoArea
          error={state?.campos?.condicaoAntes}
          label="Condição antes da sessão"
          name="condicaoAntes"
        />
        <CampoArea
          error={state?.campos?.relatoCliente}
          label="Relato do cliente"
          name="relatoCliente"
        />
      </section>

      <section className="grid gap-4">
        <h3 className="font-semibold text-roxo">Avaliação da profissional</h3>
        <CampoArea
          error={state?.campos?.avaliacaoProfissional}
          label="Avaliação profissional"
          name="avaliacaoProfissional"
        />
        <CampoArea
          error={state?.campos?.equipamentosUtilizados}
          label="Equipamentos utilizados"
          name="equipamentosUtilizados"
        />
        <CampoArea
          error={state?.campos?.parametrosUtilizados}
          label="Parâmetros utilizados"
          name="parametrosUtilizados"
        />
        <CampoArea
          error={state?.campos?.produtosAplicados}
          label="Produtos aplicados"
          name="produtosAplicados"
        />
        <CampoArea
          error={state?.campos?.reacoesObservadas}
          label="Reações observadas"
          name="reacoesObservadas"
        />
        <CampoArea
          error={state?.campos?.observacoesInternas}
          label="Observações internas (não visível ao cliente)"
          name="observacoesInternas"
        />
      </section>

      <section className="grid gap-4">
        <h3 className="font-semibold text-roxo">Área compartilhada</h3>
        <CampoArea
          error={state?.campos?.orientacoesPosAtendimento}
          label="Orientações pós-atendimento"
          name="orientacoesPosAtendimento"
        />
      </section>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          className="size-4 rounded border-border text-brand focus:ring-roxo"
          defaultChecked
          name="presencaConfirmada"
          type="checkbox"
        />
        Presença confirmada
      </label>

      <MensagemFormulario state={state} />

      <button
        className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <NotebookPen className="size-4" />
        )}
        Registrar sessão
      </button>
    </form>
  );
}
