import Link from "next/link";
import { ArrowLeft, ImageIcon } from "lucide-react";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { GaleriaFotos } from "@/modules/fotos/components/galeria-fotos";
import { listarMinhasFotos } from "@/modules/fotos/queries";

export default async function MinhasFotosPage() {
  let fotos: Awaited<ReturnType<typeof listarMinhasFotos>> = [];
  let erro: string | null = null;

  try {
    fotos = await listarMinhasFotos();
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      erro = error.message;
    } else {
      throw error;
    }
  }

  return (
    <main className="min-h-screen bg-creme px-6 py-8">
      <div className="mx-auto grid max-w-3xl gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
          href="/portal"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao portal
        </Link>

        <header>
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <ImageIcon className="size-4" aria-hidden="true" />
            Área do cliente
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-roxo">Minhas fotos</h1>
          <p className="mt-2 text-sm text-foreground">Antes e depois do seu tratamento.</p>
        </header>

        {erro ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            {erro}
          </div>
        ) : (
          <GaleriaFotos fotos={fotos} />
        )}
      </div>
    </main>
  );
}
