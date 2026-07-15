import { Ruler, TrendingDown, TrendingUp } from "lucide-react";

import {
  rotulosLadoMedida,
  rotulosRegiaoMedida,
  type LadoMedida,
  type RegiaoMedida,
} from "@/modules/medidas/schema";
import type { EvolucaoAgrupada } from "@/modules/medidas/queries";

function formatarCm(valor: number) {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} cm`;
}

function rotulo(regiao: RegiaoMedida, lado: LadoMedida | null) {
  return lado
    ? `${rotulosRegiaoMedida[regiao]} (${rotulosLadoMedida[lado]})`
    : rotulosRegiaoMedida[regiao];
}

export function TabelaEvolucao({ evolucao }: { evolucao: EvolucaoAgrupada[] }) {
  if (evolucao.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <Ruler className="size-4" aria-hidden="true" />
        Nenhuma medida registrada ainda.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-creme text-left text-xs font-medium text-muted uppercase">
            <th className="px-4 py-3">Região</th>
            <th className="px-4 py-3">Inicial</th>
            <th className="px-4 py-3">Atual</th>
            <th className="px-4 py-3">Evolução</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {evolucao.map((item) => (
            <tr key={`${item.regiao}:${item.lado ?? ""}`}>
              <td className="px-4 py-3 font-medium text-foreground">
                {rotulo(item.regiao, item.lado)}
              </td>
              <td className="px-4 py-3 text-muted">{formatarCm(item.inicial)}</td>
              <td className="px-4 py-3 text-foreground">{formatarCm(item.atual)}</td>
              <td className="px-4 py-3">
                {item.diferencaCm === 0 ? (
                  <span className="text-muted">Sem alteração</span>
                ) : (
                  <span
                    className={`flex items-center gap-1 font-medium ${
                      item.reducao ? "text-brand" : "text-dourado"
                    }`}
                  >
                    {item.reducao ? (
                      <TrendingDown className="size-3.5" aria-hidden="true" />
                    ) : (
                      <TrendingUp className="size-3.5" aria-hidden="true" />
                    )}
                    {item.reducao ? "" : "+"}
                    {formatarCm(item.diferencaCm)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
