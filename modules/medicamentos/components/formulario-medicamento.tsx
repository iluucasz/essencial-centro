"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, Pill } from "lucide-react";

import { CampoDataCalendario } from "@/components/ui/calendario-tailgrids";
import {
  criarMedicamentoInformado,
  type EstadoFormularioMedicamento,
} from "@/modules/medicamentos/actions";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioMedicamento = { status: "inicial" };

function MensagemFormulario({ state }: { state: EstadoFormularioMedicamento | undefined }) {
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

export function FormularioMedicamento({ clienteId }: { clienteId: string }) {
  const [state, formAction, pending] = useActionState(criarMedicamentoInformado, estadoInicial);
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid gap-4">
      <input name="clienteId" type="hidden" value={clienteId} />

      <p className="rounded-lg bg-lilas/15 p-3 text-xs text-roxo">
        Apoio à conferência — nunca decisão clínica automática. Toda informação exige verificação de
        uma profissional habilitada.
      </p>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="nome">
          Medicamento informado
        </label>
        <input
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="nome"
          name="nome"
          required
        />
        {state?.campos?.nome?.length ? (
          <p className="text-sm text-perigo">{state.campos.nome[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="dosagem">
            Dosagem informada
          </label>
          <input
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            id="dosagem"
            name="dosagem"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="frequencia">
            Frequência
          </label>
          <input
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            id="frequencia"
            name="frequencia"
            placeholder="Ex.: 1x ao dia"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="profissionalPrescritor">
            Profissional prescritor
          </label>
          <input
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            id="profissionalPrescritor"
            name="profissionalPrescritor"
          />
        </div>
        <CampoDataCalendario
          error={state?.campos?.dataInicio}
          label="Data de início"
          name="dataInicio"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="alergiaRelacionada">
          Alergia relacionada (opcional)
        </label>
        <textarea
          className="min-h-16 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="alergiaRelacionada"
          name="alergiaRelacionada"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="alertaInteracao">
          Alerta de interação (preenchimento manual da profissional)
        </label>
        <textarea
          className="min-h-16 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="alertaInteracao"
          name="alertaInteracao"
          placeholder="Ex.: verificar interação com anticoagulantes"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="fonteAlerta">
          Fonte do alerta (opcional)
        </label>
        <input
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="fonteAlerta"
          name="fonteAlerta"
          placeholder="Ex.: bula, relato do cliente, Anvisa"
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
          <Pill className="size-4" />
        )}
        Registrar medicamento
      </button>
    </form>
  );
}
