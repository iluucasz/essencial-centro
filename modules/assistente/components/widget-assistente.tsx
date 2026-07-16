"use client";

import { useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowRight, Bot, LoaderCircle, Minimize2, RefreshCcw, Send, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { limparHistoricoAssistente } from "@/modules/assistente/actions";
import {
  analisarMarkdownSimples,
  type PedacoMarkdown,
} from "@/modules/assistente/markdown-simples";
import { TextoFormatado } from "@/modules/assistente/components/texto-formatado";
import type { PapelMensagemAssistente } from "@/modules/assistente/schema";

type MensagemHistorico = {
  id: string;
  papel: PapelMensagemAssistente;
  conteudo: string;
  criadoEm: Date;
};

const perguntasIniciais = [
  "Quantos atendimentos tenho hoje?",
  "Mostre o resumo de evolução de um cliente",
  "Qual o saldo financeiro deste mês?",
  "Quais produtos estão com estoque baixo?",
];

const classesSugestao = [
  "border-lilas/40 bg-lilas/15 text-roxo hover:bg-lilas/25",
  "border-brand/20 bg-brand/10 text-brand hover:bg-brand/15",
  "border-dourado/35 bg-dourado/10 text-dourado hover:bg-dourado/15",
];

function paraUiMessage(mensagem: MensagemHistorico): UIMessage {
  return {
    id: mensagem.id,
    role: mensagem.papel === "usuario" ? "user" : "assistant",
    parts: [{ type: "text", text: mensagem.conteudo }],
  };
}

function textoDaMensagem(mensagem: UIMessage) {
  return mensagem.parts
    .filter((parte): parte is { type: "text"; text: string } => parte.type === "text")
    .map((parte) => parte.text)
    .join("\n");
}

function temFerramentaEmAndamento(mensagem: UIMessage) {
  return mensagem.parts.some(
    (parte) =>
      (parte.type.startsWith("tool-") || parte.type === "dynamic-tool") &&
      "state" in parte &&
      parte.state !== "output-available",
  );
}

/** Lê o data part "data-sugestoes" escrito pela rota depois da resposta (ver app/api/assistente/chat/route.ts). */
function sugestoesDaMensagem(mensagem: UIMessage): string[] {
  for (const parte of mensagem.parts) {
    if (
      parte.type === "data-sugestoes" &&
      "data" in parte &&
      parte.data &&
      typeof parte.data === "object" &&
      "sugestoes" in parte.data &&
      Array.isArray((parte.data as { sugestoes: unknown }).sugestoes)
    ) {
      return (parte.data as { sugestoes: string[] }).sugestoes;
    }
  }

  return [];
}

function AvatarAssistente({ grande = false }: { grande?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground ${
        grande ? "size-14" : "size-7"
      }`}
    >
      <Bot className={grande ? "size-7" : "size-3.5"} aria-hidden="true" />
    </div>
  );
}

function ChipsSugestoes({
  perguntas,
  onEscolher,
}: {
  perguntas: string[];
  onEscolher: (pergunta: string) => void;
}) {
  if (perguntas.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {perguntas.map((pergunta, indice) => (
        <button
          className={cn(
            "max-w-full rounded-full border px-3.5 py-2 text-left text-sm leading-snug font-medium transition",
            classesSugestao[indice % classesSugestao.length],
          )}
          key={pergunta}
          onClick={() => onEscolher(pergunta)}
          type="button"
        >
          {pergunta}
        </button>
      ))}
    </div>
  );
}

function LinksDeAcesso({
  links,
  aoClicarLink,
}: {
  links: Extract<PedacoMarkdown, { tipo: "link" }>[];
  aoClicarLink: () => void;
}) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          className="inline-flex items-center gap-1.5 rounded-full border border-roxo/30 bg-lilas/15 px-3 py-1.5 text-xs font-semibold text-roxo transition hover:bg-lilas/25"
          href={link.url}
          key={link.url}
          onClick={aoClicarLink}
        >
          Ver perfil de {link.texto}
          <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}

function BolhaMensagem({
  mensagem,
  aoClicarLink,
}: {
  mensagem: UIMessage;
  aoClicarLink: () => void;
}) {
  const ehUsuario = mensagem.role === "user";
  const texto = textoDaMensagem(mensagem);
  const links = texto
    ? analisarMarkdownSimples(texto).filter(
        (pedaco): pedaco is Extract<PedacoMarkdown, { tipo: "link" }> => pedaco.tipo === "link",
      )
    : [];

  return (
    <div className={`flex items-end gap-2 ${ehUsuario ? "justify-end" : "justify-start"}`}>
      {!ehUsuario ? <AvatarAssistente /> : null}
      <div className={cn("grid min-w-0 gap-2", ehUsuario ? "max-w-[84%]" : "max-w-[86%]")}>
        {temFerramentaEmAndamento(mensagem) ? (
          <span className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md border border-lilas/25 bg-lilas/10 px-3.5 py-2.5 text-xs font-medium text-muted">
            <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
            Consultando dados…
          </span>
        ) : null}
        {texto ? (
          <TextoFormatado aoClicarLink={aoClicarLink} ehUsuario={ehUsuario} texto={texto} />
        ) : null}
        {!ehUsuario ? <LinksDeAcesso aoClicarLink={aoClicarLink} links={links} /> : null}
      </div>
    </div>
  );
}

function IndicadorDigitando() {
  return (
    <div className="flex items-end gap-2">
      <AvatarAssistente />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-lilas/25 bg-lilas/10 px-4 py-3.5">
        <span className="size-1.5 animate-bounce rounded-full bg-roxo/70 [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-brand/70 [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-dourado/80" />
      </div>
    </div>
  );
}

export function WidgetAssistente({
  historicoInicial,
  nomeProfissional,
}: {
  historicoInicial: MensagemHistorico[];
  nomeProfissional: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState("");

  const { messages, sendMessage, status, error, setMessages } = useChat({
    messages: historicoInicial.map(paraUiMessage),
    transport: new DefaultChatTransport({ api: "/api/assistente/chat" }),
  });

  function enviar(texto: string) {
    if (!texto.trim() || status !== "ready") return;
    sendMessage({ text: texto });
    setRascunho("");
  }

  async function limparConversa() {
    await limparHistoricoAssistente();
    setMessages([]);
  }

  function fecharAoNavegar() {
    setAberto(false);
  }

  const primeiroNome = nomeProfissional.split(" ")[0];
  const ultimaMensagemAssistente = [...messages].reverse().find((m) => m.role === "assistant");
  const sugestoesDinamicas = ultimaMensagemAssistente
    ? sugestoesDaMensagem(ultimaMensagemAssistente)
    : [];

  return (
    <>
      <button
        aria-label={aberto ? "Fechar assistente" : "Abrir assistente"}
        className="fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition hover:scale-105 hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        onClick={() => setAberto((atual) => !atual)}
        type="button"
      >
        {aberto ? (
          <X className="size-6" aria-hidden="true" />
        ) : (
          <Bot className="size-6" aria-hidden="true" />
        )}
      </button>

      {aberto ? (
        <div
          aria-label="Assistente de IA"
          className="fixed right-6 bottom-24 z-50 flex h-150 max-h-[calc(100vh-8rem)] w-[28rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
          onKeyDown={(evento) => evento.key === "Escape" && setAberto(false)}
          role="dialog"
        >
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-lilas/10 px-4">
            <div className="flex items-center gap-3">
              <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <Bot className="size-5" aria-hidden="true" />
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-surface bg-brand"
                />
              </div>
              <div className="grid">
                <span className="text-sm font-semibold text-brand">Assistente</span>
                <span className="text-xs text-muted">Online</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                aria-label="Limpar conversa"
                className="rounded-lg p-2 text-muted transition hover:bg-creme"
                onClick={limparConversa}
                title="Limpar conversa"
                type="button"
              >
                <RefreshCcw className="size-4" aria-hidden="true" />
              </button>
              <button
                aria-label="Fechar"
                className="rounded-lg p-2 text-muted transition hover:bg-creme"
                onClick={() => setAberto(false)}
                type="button"
              >
                <Minimize2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3.5 overflow-y-auto bg-surface p-4">
            {messages.length === 0 ? (
              <div className="grid justify-items-center gap-3 py-6 text-center">
                <AvatarAssistente grande />
                <div className="grid gap-1">
                  <p className="text-sm font-semibold text-foreground">Olá, {primeiroNome}!</p>
                  <p className="max-w-65 text-sm text-muted">
                    Pergunte sobre clientes, evolução, agenda, financeiro, estoque e mais.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((mensagem) => (
                <BolhaMensagem
                  aoClicarLink={fecharAoNavegar}
                  key={mensagem.id}
                  mensagem={mensagem}
                />
              ))
            )}

            {status === "submitted" ? <IndicadorDigitando /> : null}

            {error ? (
              <p
                className="rounded-lg bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
                role="alert"
              >
                Não foi possível falar com o assistente agora. Tente de novo em instantes.
              </p>
            ) : null}

            {status === "ready" ? (
              <ChipsSugestoes
                onEscolher={enviar}
                perguntas={messages.length === 0 ? perguntasIniciais : sugestoesDinamicas}
              />
            ) : null}
          </div>

          <form
            className="flex shrink-0 items-center gap-2 border-t border-border p-3"
            onSubmit={(evento) => {
              evento.preventDefault();
              enviar(rascunho);
            }}
          >
            <input
              className="h-11 flex-1 rounded-full border border-border bg-creme px-4 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
              disabled={status !== "ready"}
              onChange={(evento) => setRascunho(evento.target.value)}
              placeholder="Pergunte sobre cliente, agenda ou financeiro..."
              value={rascunho}
            />
            <button
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={status !== "ready" || !rascunho.trim()}
              type="submit"
            >
              {status === "streaming" ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
