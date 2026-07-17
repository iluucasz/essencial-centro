import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

import {
  rotulosCategoriaLancamento,
  rotulosFormaPagamentoLancamento,
  rotulosSituacaoLancamento,
  type CategoriaLancamento,
  type FormaPagamentoLancamento,
  type SituacaoLancamento,
  type TipoLancamento,
} from "@/modules/financeiro/schema";

type LancamentoResumo = {
  id: string;
  tipo: TipoLancamento;
  categoria: string;
  descricao: string | null;
  valorCentavos: number;
  data: Date;
  formaPagamento: string | null;
  situacao: SituacaoLancamento;
  clienteNome: string | null;
};

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorData = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

const classePorSituacao: Record<SituacaoLancamento, string> = {
  pendente: "bg-dourado/20 text-dourado",
  pago: "bg-brand/15 text-brand",
  cancelado: "bg-perigo/15 text-perigo",
};

function formatarCategoria(categoria: string) {
  return rotulosCategoriaLancamento[categoria as CategoriaLancamento] ?? categoria;
}

function formatarFormaPagamento(formaPagamento: string | null) {
  if (!formaPagamento) return null;

  return (
    rotulosFormaPagamentoLancamento[formaPagamento as FormaPagamentoLancamento] ?? formaPagamento
  );
}

export function ListaLancamentos({ lancamentos }: { lancamentos: LancamentoResumo[] }) {
  if (lancamentos.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
        Nenhum lançamento registrado ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {lancamentos.map((lancamento) => {
        const formaPagamento = formatarFormaPagamento(lancamento.formaPagamento);

        return (
          <div
            key={lancamento.id}
            className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <span className="flex items-start gap-3">
                <span
                  className={`mt-0.5 rounded-lg p-2 ${
                    lancamento.tipo === "receita"
                      ? "bg-brand/15 text-brand"
                      : "bg-perigo/15 text-perigo"
                  }`}
                >
                  {lancamento.tipo === "receita" ? (
                    <ArrowUpCircle className="size-4" aria-hidden="true" />
                  ) : (
                    <ArrowDownCircle className="size-4" aria-hidden="true" />
                  )}
                </span>
                <span>
                  <span className="block font-medium text-foreground">
                    {formatarCategoria(lancamento.categoria)}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {formatadorData.format(lancamento.data)} ·{" "}
                    {formatadorMoeda.format(lancamento.valorCentavos / 100)}
                    {lancamento.clienteNome ? ` · ${lancamento.clienteNome}` : ""}
                    {formaPagamento ? ` · ${formaPagamento}` : ""}
                  </span>
                  {lancamento.descricao ? (
                    <span className="mt-1 block text-sm text-muted">{lancamento.descricao}</span>
                  ) : null}
                </span>
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${classePorSituacao[lancamento.situacao]}`}
              >
                {rotulosSituacaoLancamento[lancamento.situacao]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
