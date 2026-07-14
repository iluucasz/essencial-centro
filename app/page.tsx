import Link from "next/link";
import { LogIn } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-creme px-6 py-12">
      <section className="grid max-w-xl gap-6 text-center">
        <div className="grid gap-2">
          <p className="text-sm font-medium text-muted">Gestão clínica</p>
          <h1 className="text-3xl font-semibold text-brand">Essencial Centro</h1>
          <p className="text-sm text-foreground">
            Acesse o painel profissional ou o portal do cliente para acompanhar atendimentos.
          </p>
        </div>

        <Link
          className="mx-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          href="/entrar"
        >
          <LogIn className="size-4" aria-hidden="true" />
          Entrar
        </Link>
      </section>
    </main>
  );
}
