import { Boxes } from "lucide-react";

import { calcularStatusValidade, type StatusValidade } from "@/modules/estoque/disponibilidade";

type LoteResumo = {
  id: string;
  numeroLote: string | null;
  quantidadeInicial: number;
  disponivel: number;
  validade: Date | null;
  fornecedor: string | null;
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

const rotulosStatusValidade: Record<StatusValidade, string> = {
  vencido: "Vencido",
  proximo_vencimento: "Vence em breve",
  ok: "Validade ok",
  sem_validade: "Sem validade",
};

const classePorStatusValidade: Record<StatusValidade, string> = {
  vencido: "bg-perigo/15 text-perigo",
  proximo_vencimento: "bg-dourado/20 text-dourado",
  ok: "bg-brand/15 text-brand",
  sem_validade: "bg-lilas/25 text-roxo",
};

export function ListaLotes({ lotes }: { lotes: LoteResumo[] }) {
  if (lotes.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <Boxes className="size-4" aria-hidden="true" />
        Nenhum lote registrado ainda.
      </div>
    );
  }

  return (
    <ul className="grid gap-2">
      {lotes.map((l) => {
        const statusValidade = calcularStatusValidade(l.validade);

        return (
          <li
            key={l.id}
            className="grid gap-2 rounded-lg border border-border bg-surface p-3 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <span>
              <span className="block text-sm font-medium text-foreground">
                {l.numeroLote ?? "Sem número de lote"}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {l.disponivel} de {l.quantidadeInicial} disponíveis
                {l.fornecedor ? ` · ${l.fornecedor}` : ""}
                {l.validade ? ` · validade ${formatadorData.format(l.validade)}` : ""}
              </span>
            </span>
            <span
              className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${classePorStatusValidade[statusValidade]}`}
            >
              {rotulosStatusValidade[statusValidade]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
