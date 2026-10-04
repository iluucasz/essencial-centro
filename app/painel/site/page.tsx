import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { GerenciadorSite } from "@/modules/site-publico/components/gerenciador-site";
import { listarConteudosSite, obterBlocosSite } from "@/modules/site-publico/queries";

export default async function ConteudoSitePage() {
  const usuario = await exigirUsuarioAtual(["profissional"]);
  const [itens, { blocos, personalizados }] = await Promise.all([
    listarConteudosSite(),
    obterBlocosSite(),
  ]);
  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Conteúdo do site</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            O que você publicar aqui aparece na página inicial do site na hora. Rascunhos ficam
            guardados só para você.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-brand transition hover:bg-creme"
        >
          Ver site
          <ExternalLink className="size-4" aria-hidden="true" />
        </Link>
      </header>
      <GerenciadorSite
        itens={itens}
        blocos={blocos}
        personalizados={personalizados}
        somenteLeitura={usuario.funcao === "reader"}
      />
    </div>
  );
}
