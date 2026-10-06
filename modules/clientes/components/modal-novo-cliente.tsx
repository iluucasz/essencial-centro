"use client";

import { useState } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import {
  ArrowLeft,
  Check,
  Copy,
  LoaderCircle,
  MessageCircle,
  PenLine,
  Plus,
  TriangleAlert,
} from "lucide-react";

import { BotaoOpcao } from "@/components/ui/botao-opcao";
import { ConteudoModal, FecharModalProvider } from "@/components/ui/modal-formulario";
import {
  enviarCadastroPorWhatsApp,
  type ResultadoEnvioCadastro,
} from "@/modules/clientes/cadastro-publico-actions";

import { FormularioCliente } from "./formulario-cliente";

type Etapa = "escolher" | "manual" | "whatsapp";

const classeBotaoPrimario =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:opacity-60";

function EnvioCadastroWhatsApp({ aoConcluir }: { aoConcluir: () => void }) {
  const [telefone, setTelefone] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEnvioCadastro | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);
    try {
      setResultado(await enviarCadastroPorWhatsApp({ telefone }));
    } finally {
      setEnviando(false);
    }
  }

  async function copiar(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  if (resultado?.status === "sucesso") {
    return (
      <div className="grid gap-4">
        <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-4">
          <Check className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
          <p className="text-sm text-foreground">
            {resultado.enviado
              ? "Link enviado para o WhatsApp. O cliente aparece na lista assim que enviar o cadastro."
              : "Link criado, mas o envio automático não foi possível. Copie o link abaixo e envie ao cliente."}
          </p>
        </div>
        {resultado.aviso ? (
          <p className="flex items-center gap-2 text-xs text-dourado">
            <TriangleAlert className="size-3.5" aria-hidden="true" />
            {resultado.aviso}
          </p>
        ) : null}
        <div className="grid gap-2 rounded-2xl border border-border bg-creme/60 p-3">
          <p className="truncate text-xs text-muted">{resultado.url}</p>
          <button
            className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:bg-creme"
            onClick={() => copiar(resultado.url)}
            type="button"
          >
            {copiado ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
            {copiado ? "Link copiado" : "Copiar link"}
          </button>
        </div>
        <button
          className={`${classeBotaoPrimario} justify-self-end`}
          onClick={aoConcluir}
          type="button"
        >
          Concluir
        </button>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={enviar}>
      <div className="flex items-start gap-3 rounded-2xl border border-roxo/20 bg-lilas/10 p-4">
        <MessageCircle className="mt-0.5 size-5 shrink-0 text-roxo" aria-hidden="true" />
        <p className="text-sm text-foreground">
          O cliente recebe um link para preencher o próprio cadastro. Ao enviar, ele entra na lista
          de clientes — sem criar acesso ao portal.
        </p>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="whatsapp-cadastro">
          WhatsApp do cliente
        </label>
        <input
          autoFocus
          className="h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="whatsapp-cadastro"
          inputMode="tel"
          onChange={(event) => setTelefone(event.target.value)}
          placeholder="Ex.: (21) 99928-1504"
          required
          type="tel"
          value={telefone}
        />
      </div>
      {resultado?.status === "erro" ? (
        <p
          className="rounded-lg bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          {resultado.mensagem}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button className={classeBotaoPrimario} disabled={enviando} type="submit">
          {enviando ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <MessageCircle className="size-4" aria-hidden />
          )}
          Enviar para o WhatsApp
        </button>
      </div>
    </form>
  );
}

export function ModalNovoCliente() {
  const [etapa, setEtapa] = useState<Etapa>("escolher");
  // Ao fechar (X, backdrop, Esc ou fim do fluxo) volta para a escolha — reabrir começa do zero.
  const state = useOverlayState({ onOpenChange: (aberto) => !aberto && setEtapa("escolher") });

  return (
    <Modal state={state}>
      <Modal.Trigger className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:w-auto">
        <Plus className="size-4" aria-hidden />
        Novo cliente
      </Modal.Trigger>
      <Modal.Backdrop variant="opaque">
        <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
          <ConteudoModal titulo="Novo cliente">
            <FecharModalProvider value={state.close}>
              {etapa === "escolher" ? (
                <div className="grid gap-2">
                  <BotaoOpcao
                    descricao="Preencha o cadastro agora, aqui no painel."
                    icone={<PenLine className="size-5" aria-hidden />}
                    onClick={() => setEtapa("manual")}
                    titulo="Criação manual"
                  />
                  <BotaoOpcao
                    descricao="Enviar link para o cliente preencher o próprio cadastro."
                    icone={<MessageCircle className="size-5" aria-hidden />}
                    onClick={() => setEtapa("whatsapp")}
                    titulo="Enviar para WhatsApp"
                  />
                </div>
              ) : (
                <div className="grid min-w-0 gap-4">
                  <button
                    className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo transition hover:text-brand"
                    onClick={() => setEtapa("escolher")}
                    type="button"
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                    Voltar
                  </button>
                  {etapa === "manual" ? (
                    <FormularioCliente />
                  ) : (
                    <EnvioCadastroWhatsApp aoConcluir={state.close} />
                  )}
                </div>
              )}
            </FecharModalProvider>
          </ConteudoModal>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
