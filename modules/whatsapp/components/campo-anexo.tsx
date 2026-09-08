"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";

/**
 * Campo de anexo (imagem, vídeo, PDF ou qualquer outro arquivo) reaproveitado pelo formulário de
 * mensagem predefinida e pelo de envio de campanha. Sempre `name="arquivo"`/`name="removerArquivo"`
 * — os dois server actions (`salvarMensagemPredefinida`/`enviarCampanhaMensagem`) leem os mesmos
 * nomes de campo.
 */
export function CampoAnexoWhatsApp({
  anexoAtual,
  idBase,
  resetToken,
}: {
  anexoAtual: { url: string; nome: string } | null;
  /**
   * Este componente aparece várias vezes ao mesmo tempo na mesma página (um card por mensagem
   * predefinida, mais o formulário de campanha) — `id`/`htmlFor` fixos duplicavam no DOM e faziam
   * o input errado receber o arquivo. Cada instância precisa de um `idBase` único; `name` continua
   * fixo ("arquivo"/"removerArquivo") porque cada um vive dentro do seu próprio `<form>`.
   */
  idBase: string;
  /**
   * Qualquer valor que muda quando o `<form action>` termina (sucesso ou erro) — normalmente o
   * objeto de estado do `useActionState` do formulário pai. Depois de toda submissão o React 19
   * limpa os campos não controlados (o `<input type="file">` some de verdade), mas os rótulos em
   * React state ("arquivo.jpg selecionado") não acompanhavam isso sozinhos — ajustar durante a
   * renderização em vez de um `useEffect` evita o re-render em cascata que o lint acusa.
   */
  resetToken: unknown;
}) {
  const inputId = `arquivo-${idBase}`;
  const [arquivoNovoNome, setArquivoNovoNome] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [tokenAnterior, setTokenAnterior] = useState(resetToken);

  if (resetToken !== tokenAnterior) {
    setTokenAnterior(resetToken);
    setArquivoNovoNome(null);
    setRemovendo(false);
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={inputId}>
        Anexo (opcional)
      </label>

      {anexoAtual && !arquivoNovoNome ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-creme/40 px-3 py-2 text-sm">
          <a
            className="flex min-w-0 items-center gap-2 text-roxo hover:underline"
            href={anexoAtual.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Paperclip className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{anexoAtual.nome}</span>
          </a>
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
            <input
              checked={removendo}
              className="size-3.5 rounded border-border text-perigo focus:ring-perigo"
              name="removerArquivo"
              onChange={(event) => setRemovendo(event.target.checked)}
              type="checkbox"
              value="true"
            />
            Remover
          </label>
        </div>
      ) : null}

      <label
        className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-3 text-sm text-muted transition hover:border-roxo hover:text-roxo"
        htmlFor={inputId}
      >
        <Paperclip className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">
          {arquivoNovoNome ??
            (anexoAtual ? "Trocar por outro arquivo" : "Imagem, vídeo, PDF ou outro arquivo")}
        </span>
      </label>
      <input
        className="sr-only"
        id={inputId}
        name="arquivo"
        onChange={(event) => setArquivoNovoNome(event.target.files?.[0]?.name ?? null)}
        type="file"
      />
    </div>
  );
}
