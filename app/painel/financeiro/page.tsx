import { ArrowDownCircle, ArrowUpCircle, Scale, Wallet } from "lucide-react";

import { CardKpi } from "@/components/ui/card-kpi";
import { ModalFormulario } from "@/components/ui/modal-formulario";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { listarClientes } from "@/modules/clientes/queries";
import { FormularioLancamento } from "@/modules/financeiro/components/formulario-lancamento";
import { ListaLancamentos } from "@/modules/financeiro/components/lista-lancamentos";
import { listarLancamentos } from "@/modules/financeiro/queries";
import { calcularResumoFinanceiro } from "@/modules/financeiro/resumo";
import { listarPacotesParaSelecao } from "@/modules/pacotes/queries";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function FinanceiroPage() {
  await exigirUsuarioAtual(["profissional"]);

  const [lancamentos, clientes, pacotes] = await Promise.all([
    listarLancamentos(),
    listarClientes(),
    listarPacotesParaSelecao(),
  ]);

  const resumo = calcularResumoFinanceiro(lancamentos);

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand">Financeiro</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground">
          Receitas e despesas da clínica — pagamentos avulsos e vinculados a pacotes.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
      </div>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Lançamentos</h2>
          <ModalFormulario
            icone={<Wallet className="size-4" aria-hidden />}
            rotuloBotao="Novo lançamento"
            titulo="Novo lançamento"
          >
            <FormularioLancamento
              clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
              pacotes={pacotes.map((p) => ({
                id: p.id,
                nome: `${p.clienteNome} · ${p.servicoNome}`,
              }))}
            />
          </ModalFormulario>
        </div>
        <ListaLancamentos lancamentos={lancamentos} />
      </section>
    </div>
  );
}
