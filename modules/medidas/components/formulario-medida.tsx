"use client";

import { useActionState, useEffect } from "react";
import { LoaderCircle, Ruler, Save } from "lucide-react";

import { useFecharModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import {
  atualizarMedida,
  criarMedida,
  type EstadoFormularioMedida,
} from "@/modules/medidas/actions";
import {
  ladosMedida,
  regioesMedida,
  rotulosLadoMedida,
  rotulosRegiaoMedida,
  type LadoMedida,
  type RegiaoMedida,
} from "@/modules/medidas/schema";

const estadoInicial: EstadoFormularioMedida = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

type Opcao = { id: string; nome: string };

export type MedidaFormulario = {
  id: string;
  clienteId: string;
  sessaoId: string | null;
  regiao: RegiaoMedida;
  lado: LadoMedida | null;
  valorCm: number;
  dataMedicao: Date;
};

function MensagemFormulario({ state }: { state: EstadoFormularioMedida | undefined }) {
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

export function FormularioMedida({
  clienteId,
  medida,
  sessoes,
}: {
  clienteId: string;
  medida?: MedidaFormulario;
  sessoes: Opcao[];
}) {
  const [state, formAction, pending] = useActionState(
    medida ? atualizarMedida : criarMedida,
    estadoInicial,
  );
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid min-w-0 gap-5">
      <input name="clienteId" type="hidden" value={clienteId} />
      {medida ? <input name="id" type="hidden" value={medida.id} /> : null}

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="regiao">
          Região
        </label>
        <select
          className={classeCampo}
          defaultValue={medida?.regiao ?? ""}
          id="regiao"
          name="regiao"
          required
        >
          <option disabled value="">
            Selecione
          </option>
          {regioesMedida.map((regiao) => (
            <option key={regiao} value={regiao}>
              {rotulosRegiaoMedida[regiao]}
            </option>
          ))}
        </select>
        {state?.campos?.regiao?.length ? (
          <p className="text-sm text-perigo">{state.campos.regiao[0]}</p>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="lado">
          Lado (só coxa/braço)
        </label>
        <select className={classeCampo} defaultValue={medida?.lado ?? ""} id="lado" name="lado">
          <option value="">Não se aplica</option>
          {ladosMedida.map((lado) => (
            <option key={lado} value={lado}>
              {rotulosLadoMedida[lado]}
            </option>
          ))}
        </select>
        {state?.campos?.lado?.length ? (
          <p className="text-sm text-perigo">{state.campos.lado[0]}</p>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="valorCm">
          Medida (cm)
        </label>
        <input
          className={classeCampo}
          defaultValue={medida?.valorCm}
          id="valorCm"
          inputMode="decimal"
          name="valorCm"
          placeholder="Ex.: 82,5"
          required
          step="0.1"
          type="number"
        />
        {state?.campos?.valorCm?.length ? (
          <p className="text-sm text-perigo">{state.campos.valorCm[0]}</p>
        ) : null}
      </div>

      {sessoes.length > 0 ? (
        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="sessaoId">
            Sessão vinculada (opcional)
          </label>
          <select
            className={classeCampo}
            defaultValue={medida?.sessaoId ?? ""}
            id="sessaoId"
            name="sessaoId"
          >
            <option value="">Sem vínculo</option>
            {sessoes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
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
          ) : medida ? (
            <Save className="size-4" aria-hidden="true" />
          ) : (
            <Ruler className="size-4" aria-hidden="true" />
          )}
          {medida ? "Salvar alterações" : "Registrar medida"}
        </button>
      </div>
    </form>
  );
}
