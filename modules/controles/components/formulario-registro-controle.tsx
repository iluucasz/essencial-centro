"use client";

import { useActionState, useEffect, useState } from "react";
import { LoaderCircle, Paperclip, Save } from "lucide-react";

import { useFecharModal } from "@/components/ui/modal-formulario";
import { registrarControle, type EstadoFormularioControle } from "@/modules/controles/actions";
import type { TipoControle } from "@/modules/controles/schema";

const estadoInicial: EstadoFormularioControle = { status: "inicial" };

export function FormularioRegistroControle({ tipo }: { tipo: TipoControle }) {
  const [estado, formAction, pendente] = useActionState(registrarControle, estadoInicial);
  const fecharModal = useFecharModal();
  const [dataRealizacao, setDataRealizacao] = useState("");
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [estadoAnterior, setEstadoAnterior] = useState(estado);

  /*
    Um <form action> do React 19 reseta os campos NÃO controlados assim que a Server Action
    termina — mesmo em erro (ele só sabe que a promise resolveu, não que o app considera aquilo
    uma falha; ver histórico de bug idêntico em modules/clientes/components/formulario-cliente.tsx).
    A data é controlada e sobrevive ao reset; o arquivo não tem como (o navegador não deixa
    reatribuir um FileList por segurança), então ao menos o rótulo para de alegar que ainda há um
    anexo selecionado quando o campo nativo já foi limpo. Ajustar durante a renderização (em vez de
    um useEffect) evita o re-render em cascata que o lint acusa em set-state-in-effect.
  */
  if (estado !== estadoAnterior) {
    setEstadoAnterior(estado);
    if (estado.status === "erro") setNomeArquivo(null);
  }

  useEffect(() => {
    if (estado.status === "sucesso") fecharModal();
  }, [estado, fecharModal]);

  return (
    <form action={formAction} className="grid gap-4">
      <input name="tipo" type="hidden" value={tipo} />

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="dataRealizacao">
          Quando foi feito
        </label>
        <input
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="dataRealizacao"
          name="dataRealizacao"
          onChange={(event) => setDataRealizacao(event.target.value)}
          required
          type="date"
          value={dataRealizacao}
        />
        {estado.campos?.dataRealizacao ? (
          <p className="text-xs text-perigo">{estado.campos.dataRealizacao[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="arquivo">
          Anexo (opcional)
        </label>
        <label
          className={`flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 text-sm transition hover:border-roxo hover:text-roxo ${
            nomeArquivo
              ? "border-brand/40 bg-brand/5 text-foreground"
              : "border-border bg-surface text-muted"
          }`}
          htmlFor="arquivo"
        >
          <Paperclip className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {nomeArquivo ?? "Foto, nota fiscal ou certificado (JPEG, PNG ou PDF)"}
          </span>
        </label>
        <input
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          id="arquivo"
          name="arquivo"
          onChange={(event) => setNomeArquivo(event.target.files?.[0]?.name ?? null)}
          type="file"
        />
        {estado.campos?.arquivo ? (
          <p className="text-xs text-perigo">{estado.campos.arquivo[0]}</p>
        ) : null}
      </div>

      {estado.status === "erro" && estado.mensagem ? (
        <p
          className="rounded-xl bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          {estado.mensagem}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pendente}
          type="submit"
        >
          {pendente ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" />
          )}
          Salvar
        </button>
      </div>
    </form>
  );
}
