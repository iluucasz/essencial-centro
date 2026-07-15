import { PackageCheck } from "lucide-react";

import { rotulosSituacaoPagamento, type SituacaoPagamento } from "@/modules/pacotes/schema";
import type { ProgressoPacote } from "@/modules/pacotes/progresso";

type PacoteResumo = {
  id: string;
  clienteNome: string;
  servicoNome: string;
  validade: Date | null;
  valorCentavos: number | null;
  situacaoPagamento: SituacaoPagamento;
  ativo: boolean;
  progresso: ProgressoPacote;
};

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatarValor(valorCentavos: number | null) {
  return valorCentavos === null ? "Valor a definir" : formatadorMoeda.format(valorCentavos / 100);
}

const classePorSituacao: Record<SituacaoPagamento, string> = {
  pendente: "bg-dourado/20 text-dourado",
  parcial: "bg-lilas/25 text-roxo",
  pago: "bg-brand/15 text-brand",
};

export function ListaPacotes({ pacotes }: { pacotes: PacoteResumo[] }) {
  if (pacotes.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
        Nenhum pacote cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {pacotes.map((pacote) => (
        <div key={pacote.id} className="grid gap-3 rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <span className="flex items-start gap-3">
              <span className="mt-0.5 rounded-lg bg-lilas/35 p-2 text-roxo">
                <PackageCheck className="size-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-medium text-foreground">{pacote.clienteNome}</span>
                <span className="mt-1 block text-sm text-muted">
                  {pacote.servicoNome} · {formatarValor(pacote.valorCentavos)}
                  {pacote.ativo ? "" : " · inativo"}
                </span>
              </span>
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${classePorSituacao[pacote.situacaoPagamento]}`}
            >
              {rotulosSituacaoPagamento[pacote.situacaoPagamento]}
            </span>
          </div>

          <div>
            <div className="h-2 overflow-hidden rounded-full bg-creme">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${pacote.progresso.percentualConcluido}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">
              {pacote.progresso.sessoesRealizadas} de {pacote.progresso.quantidadeSessoes} sessões
              concluídas · {pacote.progresso.percentualConcluido}% do tratamento
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
