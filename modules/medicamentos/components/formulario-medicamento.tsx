"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, Pill, Save } from "lucide-react";

import { CampoDataCalendario } from "@/components/ui/calendario-tailgrids";
import { useFecharModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import {
  atualizarMedicamentoInformado,
  criarMedicamentoInformado,
  type EstadoFormularioMedicamento,
} from "@/modules/medicamentos/actions";

const estadoInicial: EstadoFormularioMedicamento = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";
const classeArea =
  "min-h-20 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

export type MedicamentoFormulario = {
  id: string;
  nome: string;
  dosagem: string | null;
  frequencia: string | null;
  profissionalPrescritor: string | null;
  dataInicio: Date | null;
  alergiaRelacionada: string | null;
  alertaInteracao: string | null;
  fonteAlerta: string | null;
};

function formatarDataInput(data: Date | null | undefined) {
  return data ? data.toISOString().slice(0, 10) : undefined;
}

function MensagemFormulario({ state }: { state: EstadoFormularioMedicamento | undefined }) {
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

export function FormularioMedicamento({
  clienteId,
  medicamento,
}: {
  clienteId: string;
  medicamento?: MedicamentoFormulario;
}) {
  const [state, formAction, pending] = useActionState(
    medicamento ? atualizarMedicamentoInformado : criarMedicamentoInformado,
    estadoInicial,
  );
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid min-w-0 gap-5">
      <input name="clienteId" type="hidden" value={clienteId} />
      {medicamento ? <input name="id" type="hidden" value={medicamento.id} /> : null}

      <p className="rounded-lg bg-lilas/15 p-3 text-xs text-roxo">
        Apoio à conferência, nunca decisão clínica automática. Toda informação exige verificação de
        uma profissional habilitada.
      </p>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="nome">
          Medicamento informado
        </label>
        <input
          className={classeCampo}
          defaultValue={medicamento?.nome}
          id="nome"
          name="nome"
          placeholder="Ex.: Dipirona"
          required
        />
        {state?.campos?.nome?.length ? (
          <p className="text-sm text-perigo">{state.campos.nome[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="dosagem">
            Dosagem informada
          </label>
          <input
            className={classeCampo}
            defaultValue={medicamento?.dosagem ?? undefined}
            id="dosagem"
            name="dosagem"
            placeholder="Ex.: 500 mg"
          />
        </div>
        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="frequencia">
            Frequência
          </label>
          <input
            className={classeCampo}
            defaultValue={medicamento?.frequencia ?? undefined}
            id="frequencia"
            name="frequencia"
            placeholder="Ex.: 1x ao dia"
          />
        </div>
        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="profissionalPrescritor">
            Profissional prescritor
          </label>
          <input
            className={classeCampo}
            defaultValue={medicamento?.profissionalPrescritor ?? undefined}
            id="profissionalPrescritor"
            name="profissionalPrescritor"
            placeholder="Ex.: Dra. Ana Souza"
          />
        </div>
        <CampoDataCalendario
          defaultValue={formatarDataInput(medicamento?.dataInicio)}
          error={state?.campos?.dataInicio}
          label="Data de início"
          name="dataInicio"
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="alergiaRelacionada">
          Alergia relacionada (opcional)
        </label>
        <textarea
          className={classeArea}
          defaultValue={medicamento?.alergiaRelacionada ?? undefined}
          id="alergiaRelacionada"
          name="alergiaRelacionada"
          placeholder="Ex.: alergia a dipirona relatada pela cliente"
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="alertaInteracao">
          Alerta de interação (preenchimento manual da profissional)
        </label>
        <textarea
          className={classeArea}
          defaultValue={medicamento?.alertaInteracao ?? undefined}
          id="alertaInteracao"
          name="alertaInteracao"
          placeholder="Ex.: verificar interação com anticoagulantes"
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="fonteAlerta">
          Fonte do alerta (opcional)
        </label>
        <input
          className={classeCampo}
          defaultValue={medicamento?.fonteAlerta ?? undefined}
          id="fonteAlerta"
          name="fonteAlerta"
          placeholder="Ex.: bula, relato do cliente, Anvisa"
        />
      </div>

      <MensagemFormulario state={state} />

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-44 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : medicamento ? (
            <Save className="size-4" aria-hidden="true" />
          ) : (
            <Pill className="size-4" aria-hidden="true" />
          )}
          {medicamento ? "Salvar alterações" : "Registrar medicamento"}
        </button>
      </div>
    </form>
  );
}
