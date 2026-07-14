import { Sparkles } from "lucide-react";

import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { FormularioServico } from "@/modules/servicos/components/formulario-servico";
import { ListaServicos } from "@/modules/servicos/components/lista-servicos";
import { listarServicos } from "@/modules/servicos/queries";

export default async function ServicosPage() {
  const usuario = await exigirUsuarioAtual(["profissional", "recepcao"]);
  const servicos = await listarServicos();

  return (
    <main className="min-h-screen bg-creme px-6 py-8">
      <div className="mx-auto grid max-w-6xl gap-8">
        <header>
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <Sparkles className="size-4" aria-hidden="true" />
            Área profissional
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-brand">Serviços</h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground">
            Catálogo usado por agenda, pacotes e fichas de avaliação.
          </p>
        </header>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_440px]">
          <section className="grid gap-4">
            <h2 className="text-lg font-semibold text-foreground">Cadastrados</h2>
            <ListaServicos servicos={servicos} />
          </section>

          {usuario.role === "profissional" ? (
            <aside>
              <FormularioServico />
            </aside>
          ) : null}
        </div>
      </div>
    </main>
  );
}
