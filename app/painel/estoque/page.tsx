import { Boxes, PackagePlus, PackageSearch, TriangleAlert } from "lucide-react";

import { CardKpi } from "@/components/ui/card-kpi";
import { ModalFormulario } from "@/components/ui/modal-formulario";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { FormularioLote } from "@/modules/estoque/components/formulario-lote";
import { FormularioProduto } from "@/modules/estoque/components/formulario-produto";
import { ListaProdutos } from "@/modules/estoque/components/lista-produtos";
import { listarProdutos, listarProdutosParaSelecao } from "@/modules/estoque/queries";

export default async function EstoquePage() {
  await exigirUsuarioAtual(["profissional"]);

  const produtos = await listarProdutos();
  const produtosParaSelecao = await listarProdutosParaSelecao();
  const produtosComEstoqueBaixo = produtos.filter((p) => p.avisoEstoqueBaixo);

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand">Estoque</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground">
          Produtos, lotes e validade — área interna, não visível ao cliente.
        </p>
      </header>

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

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Produtos</h2>
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
        </div>
        <ListaProdutos produtos={produtos} />
      </section>
    </div>
  );
}
