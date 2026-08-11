import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { auth } from "@/auth";
import { precisaDefinirSenha } from "@/modules/auth/acesso-portal";
import { FormularioDefinirSenha } from "@/modules/auth/components/formulario-definir-senha";
import { getDestinoAposLogin } from "@/modules/auth/rbac";

export const metadata = {
  title: "Definir sua senha — Essencial Centro",
};

/**
 * Fora dos grupos `/painel` e `/portal` de propósito: os layouts deles desviam pra cá, e a página
 * viveria dentro do próprio desvio. Tem o guarda próprio — sessão válida e `deveTrocarSenha` de pé.
 */
export default async function DefinirSenhaPage() {
  const sessao = await auth();

  if (!sessao?.user?.id || !sessao.user.role) redirect("/entrar");

  const destino = getDestinoAposLogin(sessao.user.role);

  // Quem já definiu a senha não tem o que fazer aqui — volta pra área dele.
  if (!(await precisaDefinirSenha(sessao.user.id))) redirect(destino);

  return (
    <main className="flex min-h-screen w-full justify-center bg-creme px-4 py-12">
      <div className="w-full max-w-md">
        <header className="mb-6 grid justify-items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold text-brand">Escolha sua senha</h1>
          <p className="text-sm text-muted">
            Você entrou com a senha provisória da clínica. Defina agora uma senha só sua — ela
            protege seus dados de saúde.
          </p>
        </header>

        <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <FormularioDefinirSenha destino={destino} />
        </div>
      </div>
    </main>
  );
}
