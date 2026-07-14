import { Sparkles } from "lucide-react";

import { rotulosGrupoServico, type GrupoServico } from "@/modules/servicos/schema";

type ServicoResumo = {
  id: string;
  nome: string;
  grupo: GrupoServico;
  duracaoMinutos: number;
  valorCentavos: number | null;
  ativo: boolean;
};

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatarValor(valorCentavos: number | null) {
  if (valorCentavos === null) return "Valor a definir";

  return formatadorMoeda.format(valorCentavos / 100);
}

export function ListaServicos({ servicos }: { servicos: ServicoResumo[] }) {
  if (servicos.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
        Nenhum serviço cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <ul className="divide-y divide-border">
        {servicos.map((servico) => (
          <li key={servico.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto]">
            <span className="flex items-start gap-3">
              <span className="mt-0.5 rounded-lg bg-lilas/35 p-2 text-roxo">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-medium text-foreground">{servico.nome}</span>
                <span className="mt-1 block text-sm text-muted">
                  {rotulosGrupoServico[servico.grupo]} · {servico.duracaoMinutos} min
                  {servico.ativo ? "" : " · inativo"}
                </span>
              </span>
            </span>
            <span className="text-sm font-medium text-foreground">
              {formatarValor(servico.valorCentavos)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
