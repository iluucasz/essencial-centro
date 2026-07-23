"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  ArrowRight,
  Bot,
  Download,
  FileText,
  LoaderCircle,
  Minimize2,
  Paperclip,
  RefreshCcw,
  Send,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { limparHistoricoAssistente } from "@/modules/assistente/actions";
import {
  analisarMarkdownSimples,
  type PedacoMarkdown,
} from "@/modules/assistente/markdown-simples";
import { TextoFormatado } from "@/modules/assistente/components/texto-formatado";
import type { DocumentoResumoPdf } from "@/modules/assistente/documentos-resumo";
import { baixarDocumentoResumoPdf } from "@/modules/assistente/pdf-resumo";
import type { PapelMensagemAssistente } from "@/modules/assistente/schema";

type MensagemHistorico = {
  id: string;
  papel: PapelMensagemAssistente;
  conteudo: string;
  criadoEm: Date;
};

type AnexoAtivoAssistente = {
  id: string;
  nomeArquivo: string;
  totalCaracteres: number;
  totalPaginas: number | null;
};

type DocumentoResumoAssistente = DocumentoResumoPdf;

const LIMITE_BYTES_PDF_CLIENTE = 20 * 1024 * 1024;
const formatadorNumero = new Intl.NumberFormat("pt-BR");

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

function descricaoAnexo(anexo: AnexoAtivoAssistente) {
  const paginas = anexo.totalPaginas ? `${anexo.totalPaginas} pág.` : "páginas não identificadas";

  return `${paginas} · ${formatadorNumero.format(anexo.totalCaracteres)} caracteres`;
}

async function mensagemErroUpload(resposta: Response) {
  try {
    const json = (await resposta.json()) as { erro?: string };

    return json.erro || "Não foi possível anexar o PDF.";
  } catch {
    return "Não foi possível anexar o PDF.";
  }
}

function temFerramentaEmAndamento(mensagem: UIMessage) {
  return mensagem.parts.some(
    (parte) =>
      (parte.type.startsWith("tool-") || parte.type === "dynamic-tool") &&
      "state" in parte &&
      parte.state !== "output-available",
  );
}

function documentosResumoDaMensagem(mensagem: UIMessage): DocumentoResumoAssistente[] {
  const documentos: DocumentoResumoAssistente[] = [];

  for (const parte of mensagem.parts) {
    if (
      parte.type === "data-documento-resumo" &&
      "data" in parte &&
      parte.data &&
      typeof parte.data === "object" &&
      "documento" in parte.data
    ) {
      const documento = (parte.data as { documento?: Partial<DocumentoResumoAssistente> })
        .documento;

      if (
        typeof documento?.titulo === "string" &&
        typeof documento.nomeArquivo === "string" &&
        typeof documento.nomeDownload === "string" &&
        typeof documento.conteudo === "string"
      ) {
        documentos.push(documento as DocumentoResumoAssistente);
      }
    }
  }

  return documentos;
}

function mensagemTemConteudoVisivel(mensagem: UIMessage) {
  return (
    textoDaMensagem(mensagem).trim().length > 0 ||
    temFerramentaEmAndamento(mensagem) ||
    documentosResumoDaMensagem(mensagem).length > 0
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

function DocumentoResumoCard({ documento }: { documento: DocumentoResumoAssistente }) {
  const [baixando, setBaixando] = useState(false);
  const [erroDownload, setErroDownload] = useState(false);

  async function baixarPdf() {
    setErroDownload(false);
    setBaixando(true);

    try {
      await baixarDocumentoResumoPdf(documento);
    } catch {
      setErroDownload(true);
    } finally {
      setBaixando(false);
    }
  }

  return (
    <div className="grid max-w-full min-w-0 gap-3 overflow-hidden rounded-2xl rounded-bl-md border border-roxo/25 bg-surface p-3 shadow-sm">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lilas/20 text-roxo">
          <FileText className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Documento de resumo pronto</p>
          <p className="truncate text-xs text-muted">{documento.nomeArquivo}</p>
        </div>
      </div>
      <button
        className="inline-flex h-9 w-fit items-center gap-2 rounded-full bg-brand px-3.5 text-xs font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
        disabled={baixando}
        onClick={baixarPdf}
        type="button"
      >
        {baixando ? (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-3.5" aria-hidden="true" />
        )}
        {baixando ? "Gerando PDF..." : "Baixar PDF"}
      </button>
      {erroDownload ? (
        <p className="text-xs font-medium text-perigo">Não foi possível gerar o PDF agora.</p>
      ) : null}
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
  const consultandoFerramenta = temFerramentaEmAndamento(mensagem);
  const documentosResumo = documentosResumoDaMensagem(mensagem);
  const links = texto
    ? analisarMarkdownSimples(texto).filter(
        (pedaco): pedaco is Extract<PedacoMarkdown, { tipo: "link" }> => pedaco.tipo === "link",
      )
    : [];

  if (!texto && !consultandoFerramenta && documentosResumo.length === 0) return null;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-end gap-2",
        ehUsuario ? "justify-end" : "justify-start",
      )}
    >
      {!ehUsuario ? <AvatarAssistente /> : null}
      <div
        className={cn(
          "grid min-w-0 gap-2",
          ehUsuario ? "max-w-[84%]" : "max-w-[calc(100%-2.25rem)]",
        )}
      >
        {consultandoFerramenta ? (
          <span className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md border border-lilas/25 bg-lilas/10 px-3.5 py-2.5 text-xs font-medium text-muted">
            <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
            Consultando dados…
          </span>
        ) : null}
        {texto ? (
          <TextoFormatado aoClicarLink={aoClicarLink} ehUsuario={ehUsuario} texto={texto} />
        ) : null}
        {!ehUsuario
          ? documentosResumo.map((documento) => (
              <DocumentoResumoCard documento={documento} key={documento.nomeDownload} />
            ))
          : null}
        {!ehUsuario ? <LinksDeAcesso aoClicarLink={aoClicarLink} links={links} /> : null}
      </div>
    </div>
  );
}

function IndicadorPensando({ analisandoPdf }: { analisandoPdf: boolean }) {
  return (
    <div className="flex w-full min-w-0 items-end gap-2" role="status">
      <AvatarAssistente />
      <div className="grid max-w-[calc(100%-2.25rem)] gap-1 rounded-2xl rounded-bl-md border border-lilas/25 bg-lilas/10 px-4 py-3 text-sm text-muted shadow-sm">
        <span className="font-medium text-foreground">
          {analisandoPdf ? "Analisando o PDF..." : "Pensando..."}
        </span>
        <span className="flex items-center gap-1 text-xs">
          {analisandoPdf
            ? "Pode levar alguns segundos em documentos grandes"
            : "Preparando resposta"}
          <span className="ml-1 flex items-center gap-1" aria-hidden="true">
            <span className="size-1.5 animate-bounce rounded-full bg-roxo/70 [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-brand/70 [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-dourado/80" />
          </span>
        </span>
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
  const [ocultoAteReload, setOcultoAteReload] = useState(false);
  const [rascunho, setRascunho] = useState("");
  const [anexoAtivo, setAnexoAtivo] = useState<AnexoAtivoAssistente | null>(null);
  const [enviandoAnexo, setEnviandoAnexo] = useState(false);
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const fimMensagensRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    messages: historicoInicial.map(paraUiMessage),
    transport: new DefaultChatTransport({ api: "/api/assistente/chat" }),
  });

  function enviar(texto: string) {
    const textoNormalizado = texto.trim();

    if (!textoNormalizado || status !== "ready" || enviandoAnexo) return;

    sendMessage(
      { text: textoNormalizado },
      anexoAtivo ? { body: { anexoId: anexoAtivo.id } } : undefined,
    );
    setRascunho("");
  }

  async function anexarPdf(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";

    if (!arquivo || status !== "ready") return;

    setErroAnexo(null);

    if (arquivo.type !== "application/pdf" && !arquivo.name.toLowerCase().endsWith(".pdf")) {
      setErroAnexo("Envie um arquivo PDF.");
      return;
    }

    if (arquivo.size > LIMITE_BYTES_PDF_CLIENTE) {
      setErroAnexo("O PDF precisa ter até 20 MB.");
      return;
    }

    setAberto(true);
    setEnviandoAnexo(true);

    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);

      const resposta = await fetch("/api/assistente/anexos", {
        body: formData,
        method: "POST",
      });

      if (!resposta.ok) {
        throw new Error(await mensagemErroUpload(resposta));
      }

      const json = (await resposta.json()) as { anexo?: AnexoAtivoAssistente };

      if (!json.anexo?.id) {
        throw new Error("Não foi possível anexar o PDF.");
      }

      setAnexoAtivo(json.anexo);
      sendMessage(
        {
          text:
            `Anexei o PDF "${json.anexo.nomeArquivo}". ` +
            "Faça um resumo completo e organizado do documento.",
        },
        { body: { anexoId: json.anexo.id } },
      );
    } catch (error) {
      setErroAnexo(error instanceof Error ? error.message : "Não foi possível anexar o PDF.");
    } finally {
      setEnviandoAnexo(false);
    }
  }

  async function limparConversa() {
    await limparHistoricoAssistente();
    setMessages([]);
    setAnexoAtivo(null);
    setErroAnexo(null);
  }

  function fecharAoNavegar() {
    setAberto(false);
  }

  function ocultarAteReload() {
    setAberto(false);
    setOcultoAteReload(true);
  }

  const primeiroNome = nomeProfissional.split(" ")[0];
  const ultimaMensagemAssistente = [...messages].reverse().find((m) => m.role === "assistant");
  const sugestoesDinamicas = ultimaMensagemAssistente
    ? sugestoesDaMensagem(ultimaMensagemAssistente)
    : [];
  const ultimaMensagem = messages[messages.length - 1];
  const deveMostrarPensando =
    status !== "ready" &&
    !error &&
    (!ultimaMensagem ||
      ultimaMensagem.role === "user" ||
      (ultimaMensagem.role === "assistant" && !mensagemTemConteudoVisivel(ultimaMensagem)));

  useEffect(() => {
    if (!aberto) return;

    fimMensagensRef.current?.scrollIntoView({
      behavior: status === "ready" ? "smooth" : "auto",
      block: "end",
    });
  }, [aberto, anexoAtivo?.id, enviandoAnexo, messages, status]);

  if (ocultoAteReload) return null;

  return (
    <>
      <button
        aria-label={aberto ? "Fechar assistente até recarregar" : "Abrir assistente"}
        className="fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition hover:scale-105 hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        onClick={() => (aberto ? ocultarAteReload() : setAberto(true))}
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
                aria-label="Minimizar assistente"
                className="rounded-lg p-2 text-muted transition hover:bg-creme"
                onClick={() => setAberto(false)}
                title="Minimizar"
                type="button"
              >
                <Minimize2 className="size-4" aria-hidden="true" />
              </button>
              <button
                aria-label="Fechar assistente até recarregar"
                className="rounded-lg p-2 text-muted transition hover:bg-creme"
                onClick={ocultarAteReload}
                title="Fechar até recarregar"
                type="button"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-3.5 overflow-x-hidden overflow-y-auto bg-surface p-4">
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

            {deveMostrarPensando ? <IndicadorPensando analisandoPdf={Boolean(anexoAtivo)} /> : null}

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
            <div ref={fimMensagensRef} />
          </div>

          <div className="shrink-0 border-t border-border p-3">
            <input
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={anexarPdf}
              ref={inputArquivoRef}
              type="file"
            />

            {anexoAtivo || enviandoAnexo || erroAnexo ? (
              <div className="mb-2 grid gap-2">
                {anexoAtivo ? (
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-hidden rounded-2xl border border-roxo/20 bg-lilas/15 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-roxo">
                        <FileText className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="block max-w-full truncate text-[11px] font-semibold text-roxo">
                          PDF ativo
                        </p>
                        <p className="block max-w-full truncate text-xs font-semibold text-foreground">
                          {anexoAtivo.nomeArquivo}
                        </p>
                        <p className="block max-w-full truncate text-[11px] text-muted">
                          {descricaoAnexo(anexoAtivo)}
                        </p>
                      </div>
                    </div>
                    <button
                      aria-label="Remover PDF da conversa"
                      className="rounded-full p-1.5 text-muted transition hover:bg-surface hover:text-foreground"
                      onClick={() => setAnexoAtivo(null)}
                      title="Remover PDF da conversa"
                      type="button"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ) : null}

                {enviandoAnexo ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-brand/15 bg-brand/10 px-3 py-2 text-xs font-medium text-brand">
                    <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                    Lendo PDF para análise...
                  </div>
                ) : null}

                {erroAnexo ? (
                  <p
                    className="rounded-2xl bg-perigo/10 px-3 py-2 text-xs font-medium text-perigo"
                    role="alert"
                  >
                    {erroAnexo}
                  </p>
                ) : null}
              </div>
            ) : null}

            <form
              className="flex items-center gap-2"
              onSubmit={(evento) => {
                evento.preventDefault();
                enviar(rascunho);
              }}
            >
              <button
                aria-label="Anexar PDF"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted transition hover:border-roxo/30 hover:bg-lilas/15 hover:text-roxo disabled:cursor-not-allowed disabled:opacity-60"
                disabled={status !== "ready" || enviandoAnexo}
                onClick={() => inputArquivoRef.current?.click()}
                title="Anexar PDF"
                type="button"
              >
                <Paperclip className="size-4" aria-hidden="true" />
              </button>
              <input
                className="h-11 min-w-0 flex-1 rounded-full border border-border bg-creme px-4 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
                disabled={status !== "ready" || enviandoAnexo}
                onChange={(evento) => setRascunho(evento.target.value)}
                placeholder={
                  anexoAtivo
                    ? "Pergunte sobre o PDF ou peça um resumo..."
                    : "Pergunte sobre cliente, agenda ou financeiro..."
                }
                value={rascunho}
              />
              <button
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={status !== "ready" || enviandoAnexo || !rascunho.trim()}
                type="submit"
              >
                {status === "streaming" || enviandoAnexo ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
