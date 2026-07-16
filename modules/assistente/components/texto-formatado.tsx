"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { analisarMarkdownSimples } from "@/modules/assistente/markdown-simples";

function renderizarMarkdownInline({
  texto,
  ehUsuario,
  aoClicarLink,
}: {
  texto: string;
  ehUsuario: boolean;
  aoClicarLink: () => void;
}) {
  return analisarMarkdownSimples(texto).map((pedaco, indice) => {
    if (pedaco.tipo === "negrito") {
      return (
        <strong
          className={ehUsuario ? "font-semibold text-brand-foreground" : "font-semibold text-brand"}
          key={indice}
        >
          {pedaco.conteudo}
        </strong>
      );
    }

    if (pedaco.tipo === "link") {
      return (
        <Link
          className={
            ehUsuario
              ? "font-semibold underline decoration-brand-foreground/50 underline-offset-2 hover:decoration-brand-foreground"
              : "rounded-md bg-lilas/20 px-1 py-0.5 font-semibold text-roxo underline decoration-roxo/30 underline-offset-2 hover:bg-lilas/30 hover:text-roxo/80"
          }
          href={pedaco.url}
          key={indice}
          onClick={aoClicarLink}
        >
          {pedaco.texto}
        </Link>
      );
    }

    return <span key={indice}>{pedaco.conteudo}</span>;
  });
}

function linhaEhItemLista(linha: string) {
  return /^[-•]\s+/.test(linha.trim());
}

function textoDoItemLista(linha: string) {
  return linha.trim().replace(/^[-•]\s+/, "");
}

export function TextoFormatado({
  texto,
  ehUsuario,
  aoClicarLink,
}: {
  texto: string;
  ehUsuario: boolean;
  aoClicarLink: () => void;
}) {
  const blocos = texto
    .split(/\n{2,}/)
    .map((bloco) => bloco.trim())
    .filter(Boolean);

  return (
    <div
      className={`space-y-2.5 rounded-2xl px-4 py-3 text-sm leading-6 ${
        ehUsuario
          ? "rounded-br-md bg-brand text-brand-foreground shadow-sm"
          : "rounded-bl-md border border-lilas/25 bg-lilas/10 text-foreground shadow-sm"
      }`}
    >
      {blocos.map((bloco, indiceBloco) => {
        const linhas = bloco
          .split("\n")
          .map((linha) => linha.trim())
          .filter(Boolean);
        const todasLinhasSaoLista = linhas.length > 0 && linhas.every(linhaEhItemLista);

        if (todasLinhasSaoLista) {
          return (
            <ul className="space-y-1.5" key={indiceBloco}>
              {linhas.map((linha, indiceLinha) => (
                <li className="flex gap-2" key={`${indiceBloco}-${indiceLinha}`}>
                  <span
                    className={cn(
                      "mt-2 size-1.5 shrink-0 rounded-full",
                      ehUsuario ? "bg-brand-foreground/70" : "bg-roxo/70",
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    {renderizarMarkdownInline({
                      texto: textoDoItemLista(linha),
                      ehUsuario,
                      aoClicarLink,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <div className="space-y-1.5" key={indiceBloco}>
            {linhas.map((linha, indiceLinha) => (
              <div key={`${indiceBloco}-${indiceLinha}`}>
                {linhaEhItemLista(linha) ? (
                  <div className="flex gap-2">
                    <span
                      className={cn(
                        "mt-2 size-1.5 shrink-0 rounded-full",
                        ehUsuario ? "bg-brand-foreground/70" : "bg-roxo/70",
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      {renderizarMarkdownInline({
                        texto: textoDoItemLista(linha),
                        ehUsuario,
                        aoClicarLink,
                      })}
                    </span>
                  </div>
                ) : (
                  <p>{renderizarMarkdownInline({ texto: linha, ehUsuario, aoClicarLink })}</p>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
