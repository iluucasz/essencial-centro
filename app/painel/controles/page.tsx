import { Boxes, PackagePlus, PackageSearch, TriangleAlert } from "lucide-react";

import { CardKpi } from "@/components/ui/card-kpi";
import { ModalFormulario } from "@/components/ui/modal-formulario";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { ultimaDataPorTipo } from "@/modules/controles/resumo";
import { SecaoManutencao } from "@/modules/controles/components/secao-manutencao";
import { listarRegistrosControle } from "@/modules/controles/queries";
import { podeGerenciarEstoque } from "@/modules/estoque/acesso";
import { FormularioLote } from "@/modules/estoque/components/formulario-lote";
import { FormularioProduto } from "@/modules/estoque/components/formulario-produto";
import { ListaProdutos } from "@/modules/estoque/components/lista-produtos";
import { listarProdutos, listarProdutosParaSelecao } from "@/modules/estoque/queries";

export default async function ControlesPage() {
  const usuario = await exigirUsuarioAtual(["profissional"]);
  const podeGerenciar = podeGerenciarEstoque(usuario);

  const [produtos, produtosParaSelecao, registrosControle] = await Promise.all([
    listarProdutos(),
    listarProdutosParaSelecao(),
    listarRegistrosControle(),
  ]);
  const produtosComEstoqueBaixo = produtos.filter((p) => p.avisoEstoqueBaixo);

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand">Controles</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground">
          Produtos, manutenções e checagens periódicas do estabelecimento — área interna, não
          visível ao cliente.
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold text-foreground">Manutenção do estabelecimento</h2>
        <SecaoManutencao
          registros={registrosControle}
          ultimaDataPorTipo={ultimaDataPorTipo(registrosControle)}
        />
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold text-foreground">Produtos</h2>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <CardKpi
            icone={PackageSearch}
            label="Produtos cadastrados"
            valor={String(produtos.length)}
          />
          <CardKpi
            cor={produtosComEstoqueBaixo.length > 0 ? "perigo" : "muted"}
            icone={TriangleAlert}
            label="Estoque baixo"
            valor={String(produtosComEstoqueBaixo.length)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Lotes e validade dos produtos em uso na clínica.</p>
          {podeGerenciar ? (
            <div className="flex flex-wrap gap-2">
              <ModalFormulario
                icone={<Boxes className="size-4" aria-hidden />}
                rotuloBotao="Novo lote"
                titulo="Novo lote"
              >
                <FormularioLote produtos={produtosParaSelecao} />
              </ModalFormulario>
              <ModalFormulario
                icone={<PackagePlus className="size-4" aria-hidden />}
                rotuloBotao="Novo produto"
                titulo="Novo produto"
              >
                <FormularioProduto />
              </ModalFormulario>
            </div>
          ) : null}
        </div>
        <ListaProdutos produtos={produtos} />
      </section>
    </div>
  );
}
