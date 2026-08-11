"use client";

import { useState } from "react";
import { ImagePlus, LoaderCircle, Trash2, TriangleAlert } from "lucide-react";

import type { OpcaoImagem } from "../campos";

/**
 * Editor das opções ilustradas de um campo `selecao_imagem`.
 *
 * A imagem sobe na hora (não no submit do formulário) porque o construtor guarda os campos como
 * JSON — não há como carregar um `File` dentro do jsonb. O upload devolve a URL e é ela que entra na
 * opção.
 *
 * ⚠️ A lista vive em estado LOCAL, e o `aoAlterar` só espelha pro react-hook-form. Ler de volta do
 * `watch()` não funciona: `opcoesImagem` nunca é registrado como input (só é escrito por `setValue`),
 * então a leitura voltava vazia e cada imagem nova substituía a anterior — dava pra cadastrar uma
 * opção só. O editor de opções em texto ao lado escapa disso porque usa `defaultValue` e nunca relê.
 */
export function EditorOpcoesImagem({
  opcoesIniciais,
  aoAlterar,
}: {
  opcoesIniciais: OpcaoImagem[];
  aoAlterar: (opcoes: OpcaoImagem[]) => void;
}) {
  const [opcoes, setOpcoes] = useState<OpcaoImagem[]>(opcoesIniciais);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  /** Fonte única: guarda no estado local e espelha no formulário. */
  function definir(novas: OpcaoImagem[]) {
    setOpcoes(novas);
    aoAlterar(novas);
  }

  function atualizar(indice: number, mudanca: Partial<OpcaoImagem>) {
    definir(opcoes.map((opcao, i) => (i === indice ? { ...opcao, ...mudanca } : opcao)));
  }

  async function adicionar(arquivo: File) {
    setErro(null);
    setEnviando(true);

    try {
      const dados = new FormData();
      dados.set("arquivo", arquivo);

      const resposta = await fetch("/api/fichas/opcoes-imagem", { method: "POST", body: dados });
      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok || !corpo?.url) {
        setErro(corpo?.erro ?? "Não foi possível enviar a imagem.");
        return;
      }

      definir([
        ...opcoes,
        {
          // Nome do arquivo como rótulo inicial: quase sempre a profissional vai reescrever, mas
          // deixar vazio faria a validação reclamar antes de ela ter chance de digitar.
          rotulo:
            arquivo.name.replace(/\.[^.]+$/, "").slice(0, 120) || `Opção ${opcoes.length + 1}`,
          imagem: corpo.url as string,
          descricao: undefined,
        },
      ]);
    } catch {
      setErro("Falha de rede ao enviar a imagem.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-creme/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">
          Opções ilustradas{opcoes.length > 0 ? ` (${opcoes.length})` : ""}
        </span>

        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-roxo/30 px-3 text-xs font-semibold text-roxo transition hover:bg-lilas/20">
          {enviando ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-3.5" aria-hidden="true" />
          )}
          Adicionar imagem
          <input
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={enviando}
            onChange={(evento) => {
              const arquivo = evento.target.files?.[0];
              evento.target.value = "";
              if (arquivo) void adicionar(arquivo);
            }}
            type="file"
          />
        </label>
      </div>

      {erro ? (
        <p className="flex items-start gap-2 text-xs font-medium text-perigo">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {erro}
        </p>
      ) : null}

      {opcoes.length === 0 ? (
        <p className="text-xs text-muted">
          Envie uma imagem por opção — ex.: cada tipo da escala de Bristol. A pessoa escolhe uma
          delas.
        </p>
      ) : (
        <ul className="grid gap-3">
          {opcoes.map((opcao, indice) => (
            <li
              className="grid gap-2 rounded-xl border border-border bg-surface p-2 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-start"
              key={`${opcao.imagem}-${indice}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- URL de blob externo, sem otimização do Next */}
              <img
                alt=""
                className="h-24 w-full rounded-lg border border-border bg-white object-contain sm:w-24"
                src={opcao.imagem}
              />

              <div className="grid gap-1.5">
                <input
                  aria-label={`Rótulo da opção ${indice + 1}`}
                  className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                  maxLength={120}
                  onChange={(evento) => atualizar(indice, { rotulo: evento.target.value })}
                  placeholder="Ex.: Tipo 1"
                  value={opcao.rotulo}
                />
                <textarea
                  aria-label={`Descrição da opção ${indice + 1}`}
                  className="min-h-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                  maxLength={400}
                  onChange={(evento) =>
                    atualizar(indice, { descricao: evento.target.value || undefined })
                  }
                  placeholder="Descrição (opcional) — ex.: bolinhas pequenas, separadas e duras."
                  value={opcao.descricao ?? ""}
                />
              </div>

              <button
                aria-label={`Remover opção ${indice + 1}`}
                className="justify-self-end rounded-lg p-2 text-muted transition hover:bg-perigo/10 hover:text-perigo"
                onClick={() => definir(opcoes.filter((_, i) => i !== indice))}
                type="button"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
