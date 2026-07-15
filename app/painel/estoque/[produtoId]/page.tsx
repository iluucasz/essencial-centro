import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Boxes, MinusCircle } from "lucide-react";

import { ModalFormulario } from "@/components/ui/modal-formulario";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { FormularioLote } from "@/modules/estoque/components/formulario-lote";
import { FormularioSaida } from "@/modules/estoque/components/formulario-saida";
import { ListaLotes } from "@/modules/estoque/components/lista-lotes";
import { obterProduto, listarLotesDoProduto } from "@/modules/estoque/queries";

export default async function ProdutoDetalhePage({
  params,
}: {
  params: Promise<{ produtoId: string }>;
}) {
  const { produtoId } = await params;
  await exigirUsuarioAtual(["profissional"]);

  const [produto, lotes] = await Promise.all([
    obterProduto(produtoId),
    listarLotesDoProduto(produtoId),
  ]);

  if (!produto) {
    notFound();
  }

  const lotesDisponiveis = lotes
    .filter((l) => l.disponivel > 0)
    .map((l) => ({
      id: l.id,
      nome: `${l.numeroLote ?? "Sem número"} · ${l.disponivel} disponíveis`,
    }));

  return (
    <div className="grid gap-6">
      <Link
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
        href="/painel/estoque"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para estoque
      </Link>

      <header>
        <p className="text-sm font-medium text-muted">Produto</p>
        <h1 className="mt-2 text-2xl font-semibold text-brand">{produto.nome}</h1>
        {produto.unidade || produto.estoqueMinimo !== null ? (
          <p className="mt-1 text-sm text-foreground">
            {produto.unidade ? `Unidade: ${produto.unidade}` : ""}
            {produto.unidade && produto.estoqueMinimo !== null ? " · " : ""}
            {produto.estoqueMinimo !== null ? `Estoque mínimo: ${produto.estoqueMinimo}` : ""}
          </p>
        ) : null}
      </header>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Lotes</h2>
          <div className="flex flex-wrap gap-2">
            {lotesDisponiveis.length > 0 ? (
              <ModalFormulario
                icone={<MinusCircle className="size-4" aria-hidden />}
                rotuloBotao="Registrar saída"
                titulo="Registrar saída"
              >
                <FormularioSaida lotes={lotesDisponiveis} />
              </ModalFormulario>
            ) : null}
            <ModalFormulario
              icone={<Boxes className="size-4" aria-hidden />}
              rotuloBotao="Novo lote"
              titulo="Novo lote"
            >
              <FormularioLote produtoId={produtoId} />
            </ModalFormulario>
          </div>
        </div>
        <ListaLotes lotes={lotes} />
      </section>
    </div>
  );
}
