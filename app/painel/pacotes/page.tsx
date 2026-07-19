import { ModalFormulario } from "@/components/ui/modal-formulario";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { listarClientes } from "@/modules/clientes/queries";
import { podeExcluirPacotes } from "@/modules/pacotes/acesso";
import { FiltrosPacotes } from "@/modules/pacotes/components/filtros-pacotes";
import { FormularioPacote } from "@/modules/pacotes/components/formulario-pacote";
import { ListaPacotes } from "@/modules/pacotes/components/lista-pacotes";
import {
  normalizarAtivoPacote,
  normalizarSituacaoPagamentoPacote,
  normalizarValidadePacote,
  textoFiltroPacote,
} from "@/modules/pacotes/filtros";
import { listarPacotesPainelDetalhados } from "@/modules/pacotes/queries";
import { rotulosSituacaoPagamento, situacoesPagamento } from "@/modules/pacotes/schema";
import { listarServicos } from "@/modules/servicos/queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PacotesPage({ searchParams }: { searchParams: SearchParams }) {
  const usuario = await exigirUsuarioAtual(["profissional", "recepcao"]);
  const params = await searchParams;
  const busca = textoFiltroPacote(params.busca);
  const cliente = textoFiltroPacote(params.cliente);
  const servico = textoFiltroPacote(params.servico);
  const pagamento = normalizarSituacaoPagamentoPacote(params.pagamento);
  const ativo = normalizarAtivoPacote(params.ativo);
  const validade = normalizarValidadePacote(params.validade);
  const [pacotes, clientes, servicos] = await Promise.all([
    listarPacotesPainelDetalhados({
      ativo,
      busca,
      clienteId: cliente || undefined,
      servicoId: servico || undefined,
      situacaoPagamento: pagamento,
      validade,
    }),
    listarClientes(),
    listarServicos(),
  ]);
  const clientesSelecao = clientes.map((c) => ({ id: c.id, nome: c.nome }));
  const servicosSelecao = servicos.map((s) => ({ id: s.id, nome: s.nome }));
  const chaveFiltros = [busca, cliente, servico, pagamento ?? "", ativo ?? "", validade ?? ""].join(
    "|",
  );

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand">Pacotes</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground">
          Sessões contratadas, realizadas e restantes por cliente.
        </p>
      </header>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Cadastrados</h2>
          <ModalFormulario rotuloBotao="Novo pacote" titulo="Novo pacote">
            <FormularioPacote clientes={clientesSelecao} servicos={servicosSelecao} />
          </ModalFormulario>
        </div>
        <FiltrosPacotes
          ativo={ativo ?? ""}
          busca={busca}
          cliente={cliente}
          clientes={clientesSelecao}
          key={chaveFiltros}
          limparHref="/painel/pacotes"
          pagamento={pagamento ?? ""}
          pagamentos={situacoesPagamento.map((situacao) => ({
            id: situacao,
            nome: rotulosSituacaoPagamento[situacao],
          }))}
          servico={servico}
          servicos={servicosSelecao}
          validade={validade ?? ""}
          validadeOpcoes={[
            { id: "validos", nome: "Vigentes" },
            { id: "vencidos", nome: "Vencidos" },
            { id: "sem_validade", nome: "Sem validade" },
          ]}
        />
        <ListaPacotes
          clientes={clientesSelecao}
          pacotes={pacotes}
          podeExcluir={podeExcluirPacotes(usuario)}
          servicos={servicosSelecao}
        />
      </section>
    </div>
  );
}
