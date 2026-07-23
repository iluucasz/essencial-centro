"use client";

import { Fragment } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  analisarBlocos,
  type BlocoResumo,
  type SegmentoResumo,
} from "@/modules/assistente/conteudo-resumo";

type PropsBase = {
  ehUsuario: boolean;
  aoClicarLink: () => void;
};

function Segmentos({
  segmentos,
  ehUsuario,
  aoClicarLink,
}: PropsBase & { segmentos: SegmentoResumo[] }) {
  return segmentos.map((segmento, indice) => {
    if (segmento.url) {
      return (
        <Link
          className={
            ehUsuario
              ? "font-semibold underline decoration-brand-foreground/50 underline-offset-2 hover:decoration-brand-foreground"
              : "rounded-md bg-lilas/20 px-1 py-0.5 font-semibold text-roxo underline decoration-roxo/30 underline-offset-2 hover:bg-lilas/30 hover:text-roxo/80"
          }
          href={segmento.url}
          key={indice}
          onClick={aoClicarLink}
        >
          {segmento.texto}
        </Link>
      );
    }

    if (segmento.negrito) {
      return (
        <strong
          className={ehUsuario ? "font-semibold text-brand-foreground" : "font-semibold text-brand"}
          key={indice}
        >
          {segmento.texto}
        </strong>
      );
    }

    return <Fragment key={indice}>{segmento.texto}</Fragment>;
  });
}

function Titulo({
  bloco,
  ehUsuario,
}: {
  bloco: Extract<BlocoResumo, { tipo: "titulo" }>;
  ehUsuario: boolean;
}) {
  const cor = ehUsuario ? "text-brand-foreground" : bloco.nivel === 3 ? "text-roxo" : "text-brand";

  if (bloco.nivel === 1) {
    return <p className={cn("mt-0.5 text-[15px] leading-snug font-bold", cor)}>{bloco.texto}</p>;
  }

  if (bloco.nivel === 2) {
    return (
      <p
        className={cn(
          "mt-1.5 border-b pb-0.5 text-sm font-bold",
          ehUsuario ? "border-brand-foreground/30" : "border-lilas/40",
          cor,
        )}
      >
        {bloco.texto}
      </p>
    );
  }

  return <p className={cn("mt-1 text-[13px] font-semibold", cor)}>{bloco.texto}</p>;
}

function Tabela({ bloco }: { bloco: Extract<BlocoResumo, { tipo: "tabela" }> }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {bloco.colunas.map((coluna, indice) => (
              <th
                className="border border-lilas/40 bg-lilas/25 px-2 py-1 text-left font-semibold text-roxo"
                key={indice}
              >
                {coluna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bloco.linhas.map((linha, indiceLinha) => (
            <tr key={indiceLinha}>
              {bloco.colunas.map((_, indiceColuna) => (
                <td className="border border-lilas/25 px-2 py-1 align-top" key={indiceColuna}>
                  {linha[indiceColuna] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListaBullets({
  itens,
  ehUsuario,
  aoClicarLink,
}: PropsBase & { itens: Extract<BlocoResumo, { tipo: "lista" }>[] }) {
  return (
    <ul className="space-y-1.5">
      {itens.map((item, indice) => (
        <li className="flex gap-2" key={indice}>
          <span
            aria-hidden="true"
            className={cn(
              "mt-2 size-1.5 shrink-0 rounded-full",
              ehUsuario ? "bg-brand-foreground/70" : "bg-roxo/70",
            )}
          />
          <span className="min-w-0">
            <Segmentos
              aoClicarLink={aoClicarLink}
              ehUsuario={ehUsuario}
              segmentos={item.segmentos}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Agrupa itens de lista consecutivos numa <ul> só; os demais blocos ficam soltos. */
type Grupo =
  | { tipo: "lista"; itens: Extract<BlocoResumo, { tipo: "lista" }>[] }
  | { tipo: "bloco"; bloco: Exclude<BlocoResumo, { tipo: "lista" }> };

function agruparBlocos(blocos: BlocoResumo[]): Grupo[] {
  const grupos: Grupo[] = [];

  for (const bloco of blocos) {
    if (bloco.tipo === "lista") {
      const ultimo = grupos[grupos.length - 1];

      if (ultimo?.tipo === "lista") ultimo.itens.push(bloco);
      else grupos.push({ tipo: "lista", itens: [bloco] });
    } else {
      grupos.push({ tipo: "bloco", bloco });
    }
  }

  return grupos;
}

export function TextoFormatado({ texto, ehUsuario, aoClicarLink }: PropsBase & { texto: string }) {
  const grupos = agruparBlocos(analisarBlocos(texto));

  return (
    <div
      className={cn(
        "min-w-0 space-y-2 rounded-2xl px-4 py-3 text-sm leading-6 [overflow-wrap:anywhere]",
        ehUsuario
          ? "rounded-br-md bg-brand text-brand-foreground shadow-sm"
          : "rounded-bl-md border border-lilas/25 bg-lilas/10 text-foreground shadow-sm",
      )}
    >
      {grupos.map((grupo, indice) => {
        if (grupo.tipo === "lista") {
          return (
            <ListaBullets
              aoClicarLink={aoClicarLink}
              ehUsuario={ehUsuario}
              itens={grupo.itens}
              key={indice}
            />
          );
        }

        const { bloco } = grupo;

        if (bloco.tipo === "titulo")
          return <Titulo bloco={bloco} ehUsuario={ehUsuario} key={indice} />;
        if (bloco.tipo === "tabela") return <Tabela bloco={bloco} key={indice} />;

        return (
          <p key={indice}>
            <Segmentos
              aoClicarLink={aoClicarLink}
              ehUsuario={ehUsuario}
              segmentos={bloco.segmentos}
            />
          </p>
        );
      })}
    </div>
  );
}
