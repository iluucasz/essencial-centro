"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, MessageCircle, Save, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  atualizarConfiguracaoAniversario,
  dispararAniversariosAgora,
  type EstadoConfiguracaoAniversario,
} from "@/modules/whatsapp/actions";
import { mensagemAniversario } from "@/modules/whatsapp/aniversario";

const estadoInicial: EstadoConfiguracaoAniversario = { status: "inicial" };
const NOME_EXEMPLO = "Maria";

function BotaoDisparoManual() {
  const [pendente, setPendente] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; erro: boolean } | null>(null);

  async function disparar() {
    setPendente(true);
    setMensagem(null);

    const resultado = await dispararAniversariosAgora();

    setMensagem({ texto: resultado.mensagem ?? "", erro: resultado.status === "erro" });
    setPendente(false);
  }

  return (
    <div className="grid gap-2">
      <button
        className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pendente}
        onClick={disparar}
        type="button"
      >
        {pendente ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4 text-roxo" aria-hidden="true" />
        )}
        Disparar agora
      </button>
      {mensagem ? (
        <p
          className={cn("text-sm font-medium", mensagem.erro ? "text-perigo" : "text-brand")}
          role={mensagem.erro ? "alert" : "status"}
        >
          {mensagem.texto}
        </p>
      ) : (
        <p className="text-xs text-muted">
          Roda a automação agora mesmo, pros aniversariantes de hoje. Útil pra conferir sem esperar
          o horário do disparo automático.
        </p>
      )}
    </div>
  );
}

export function FormularioAniversario({
  ativoInicial,
  brindeInicial,
}: {
  ativoInicial: boolean;
  brindeInicial: string | null;
}) {
  const [estado, formAction, pendente] = useActionState(
    atualizarConfiguracaoAniversario,
    estadoInicial,
  );
  const [brinde, setBrinde] = useState(brindeInicial ?? "");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
      <form action={formAction} className="grid min-w-0 gap-5">
        <label className="flex w-fit cursor-pointer items-center gap-3">
          <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
            <input
              className="peer sr-only"
              defaultChecked={ativoInicial}
              name="ativo"
              type="checkbox"
            />
            <span className="absolute inset-0 rounded-full bg-border transition peer-checked:bg-brand" />
            <span className="absolute left-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </span>
          <span className="text-sm font-medium text-foreground">
            Enviar mensagem de aniversário automaticamente
          </span>
        </label>

        <div className="grid min-w-0 gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="brinde">
            Brinde (opcional)
          </label>
          <textarea
            className="min-h-24 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            id="brinde"
            maxLength={500}
            name="brinde"
            onChange={(event) => setBrinde(event.target.value)}
            placeholder="Ex.: 10% de desconto numa sessão à sua escolha"
            value={brinde}
          />
          <p className="text-xs text-muted">
            Some da mensagem quando fica em branco — sem prometer um presente que a clínica não quer
            oferecer no momento.
          </p>
        </div>

        {estado.status === "erro" && estado.mensagem ? (
          <p
            className="rounded-xl bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
            role="alert"
          >
            {estado.mensagem}
          </p>
        ) : null}
        {estado.status === "sucesso" && estado.mensagem ? (
          <p
            className="rounded-xl bg-brand/10 px-3 py-2 text-sm font-medium text-brand"
            role="status"
          >
            {estado.mensagem}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
          <BotaoDisparoManual />
          <button
            className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
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

      <div className="grid w-full min-w-0 gap-2 lg:w-80">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <MessageCircle className="size-3.5" aria-hidden="true" />
          Pré-visualização (com um nome de exemplo)
        </p>
        <div className="rounded-2xl bg-brand/5 p-4">
          <p className="rounded-2xl rounded-tl-sm bg-surface p-3 text-sm whitespace-pre-line text-foreground shadow-sm">
            {mensagemAniversario({ primeiroNome: NOME_EXEMPLO, brinde })}
          </p>
        </div>
      </div>
    </div>
  );
}
