import { ArrowDownCircle, ArrowUpCircle, Clock, Scale, Wallet } from "lucide-react";

import { CardKpi } from "@/components/ui/card-kpi";
import { ModalFormulario } from "@/components/ui/modal-formulario";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { listarClientes } from "@/modules/clientes/queries";
import { FiltrosLancamentos } from "@/modules/financeiro/components/filtros-lancamentos";
import { FormularioLancamento } from "@/modules/financeiro/components/formulario-lancamento";
import { ListaLancamentos } from "@/modules/financeiro/components/lista-lancamentos";
import {
  normalizarCategoriaLancamento,
  normalizarDataFimLancamento,
  normalizarDataInicioLancamento,
  normalizarFormaPagamentoLancamento,
  normalizarSituacaoLancamento,
  normalizarTipoLancamento,
  textoFiltroLancamento,
} from "@/modules/financeiro/filtros";
import { listarLancamentos } from "@/modules/financeiro/queries";
import { calcularResumoFinanceiro } from "@/modules/financeiro/resumo";
import {
  categoriasLancamento,
  formasPagamentoLancamento,
  rotulosCategoriaLancamento,
  rotulosFormaPagamentoLancamento,
  rotulosSituacaoLancamento,
  rotulosTipoLancamento,
  situacoesLancamento,
  tiposLancamento,
} from "@/modules/financeiro/schema";
import { listarPacotesParaSelecao } from "@/modules/pacotes/queries";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FinanceiroPage({ searchParams }: { searchParams: SearchParams }) {
  await exigirUsuarioAtual(["profissional"]);

  const params = await searchParams;
  const busca = textoFiltroLancamento(params.busca);
  const tipo = normalizarTipoLancamento(params.tipo);
  const categoria = normalizarCategoriaLancamento(params.categoria);
  const situacao = normalizarSituacaoLancamento(params.situacao);
  const formaPagamento = normalizarFormaPagamentoLancamento(params.formaPagamento);
  const cliente = textoFiltroLancamento(params.cliente);
  const de = normalizarDataInicioLancamento(params.de);
  const ate = normalizarDataFimLancamento(params.ate);

  const [lancamentos, clientes, pacotes] = await Promise.all([
    listarLancamentos({
      busca: busca || undefined,
      categoria,
      clienteId: cliente || undefined,
      formaPagamento,
      periodo: de && ate ? { inicio: de, fim: ate } : undefined,
      situacao,
      tipo,
    }),
    listarClientes(),
    listarPacotesParaSelecao(),
  ]);

  const clientesSelecao = clientes.map((c) => ({ id: c.id, nome: c.nome }));
  const pacotesSelecao = pacotes.map((p) => ({
    id: p.id,
    nome: `${p.clienteNome} · ${p.servicoNome}`,
  }));

  const resumo = calcularResumoFinanceiro(lancamentos);
  const chaveFiltros = [
    busca,
    tipo ?? "",
    categoria ?? "",
    situacao ?? "",
    formaPagamento ?? "",
    cliente,
    textoFiltroLancamento(params.de),
    textoFiltroLancamento(params.ate),
  ].join("|");

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand">Financeiro</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground">
          Receitas e despesas da clínica — pagamentos avulsos e vinculados a pacotes.
        </p>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <CardKpi
          icone={ArrowUpCircle}
          label="Recebido"
          valor={formatadorMoeda.format(resumo.receitasPagas / 100)}
        />
        <CardKpi
          icone={ArrowDownCircle}
          label="Pago"
          valor={formatadorMoeda.format(resumo.despesasPagas / 100)}
        />
        <CardKpi
          destaque={resumo.saldo >= 0 ? "positivo" : undefined}
          icone={Scale}
          label="Saldo"
          valor={formatadorMoeda.format(resumo.saldo / 100)}
        />
        <CardKpi
          cor="dourado"
          icone={Clock}
          label="A receber"
          valor={formatadorMoeda.format(resumo.receitasPendentes / 100)}
        />
        <CardKpi
          cor="dourado"
          icone={Clock}
          label="A pagar"
          valor={formatadorMoeda.format(resumo.despesasPendentes / 100)}
        />
      </div>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Lançamentos</h2>
          <ModalFormulario
            icone={<Wallet className="size-4" aria-hidden />}
            rotuloBotao="Novo lançamento"
            titulo="Novo lançamento"
          >
            <FormularioLancamento clientes={clientesSelecao} pacotes={pacotesSelecao} />
          </ModalFormulario>
        </div>

        <FiltrosLancamentos
          ate={textoFiltroLancamento(params.ate)}
          busca={busca}
          categoria={categoria ?? ""}
          categorias={categoriasLancamento.map((c) => ({
            id: c,
            nome: rotulosCategoriaLancamento[c],
          }))}
          cliente={cliente}
          clientes={clientesSelecao}
          de={textoFiltroLancamento(params.de)}
          formaPagamento={formaPagamento ?? ""}
          formasPagamento={formasPagamentoLancamento.map((f) => ({
            id: f,
            nome: rotulosFormaPagamentoLancamento[f],
          }))}
          key={chaveFiltros}
          limparHref="/painel/financeiro"
          situacao={situacao ?? ""}
          situacoes={situacoesLancamento.map((s) => ({
            id: s,
            nome: rotulosSituacaoLancamento[s],
          }))}
          tipo={tipo ?? ""}
          tipos={tiposLancamento.map((t) => ({ id: t, nome: rotulosTipoLancamento[t] }))}
        />

        <ListaLancamentos
          clientes={clientesSelecao}
          lancamentos={lancamentos}
          pacotes={pacotesSelecao}
        />
      </section>
    </div>
  );
}
