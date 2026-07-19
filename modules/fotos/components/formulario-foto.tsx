"use client";

import { useActionState, useEffect } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";

import { criarFoto, type EstadoFormularioFoto } from "@/modules/fotos/actions";
import { useFecharModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";

const estadoInicial: EstadoFormularioFoto = { status: "inicial" };
const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

type Opcao = { id: string; nome: string };

function MensagemFormulario({ state }: { state: EstadoFormularioFoto | undefined }) {
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

export function FormularioFoto({ clienteId, sessoes }: { clienteId: string; sessoes: Opcao[] }) {
  const [state, formAction, pending] = useActionState(criarFoto, estadoInicial);
  const fecharModal = useFecharModal();

  useEffect(() => {
    if (state.status === "sucesso") fecharModal();
  }, [state, fecharModal]);

  return (
    <form action={formAction} className="grid min-w-0 gap-5">
      <input name="clienteId" type="hidden" value={clienteId} />

      <p className="rounded-xl bg-lilas/15 px-3 py-2 text-sm text-roxo">
        Mesma posição, enquadramento, iluminação e distância a cada registro.
      </p>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="regiao">
          Região
        </label>
        <input
          className={classeCampo}
          id="regiao"
          name="regiao"
          placeholder="Ex.: Abdômen, rosto, glúteo…"
          required
        />
        {state?.campos?.regiao?.length ? (
          <p className="text-sm text-perigo">{state.campos.regiao[0]}</p>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="arquivo">
          Imagem (JPEG, PNG ou WebP — até 4MB)
        </label>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="w-full min-w-0 rounded-xl border border-dashed border-border bg-surface px-3 py-3 text-sm text-foreground transition outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-foreground hover:border-roxo/50 focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="arquivo"
          name="arquivo"
          required
          type="file"
        />
        {state?.campos?.arquivo?.length ? (
          <p className="text-sm text-perigo">{state.campos.arquivo[0]}</p>
        ) : null}
      </div>

      {sessoes.length > 0 ? (
        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="sessaoId">
            Sessão vinculada (opcional)
          </label>
          <select className={classeCampo} defaultValue="" id="sessaoId" name="sessaoId">
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
          className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          Enviar foto
        </button>
      </div>
    </form>
  );
}
