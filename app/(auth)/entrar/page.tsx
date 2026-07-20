import Link from "next/link";

import { Logo } from "@/components/marketing/site/logo";
import { FormularioEntrada } from "@/modules/auth/components/formulario-entrada";
import { possuiUsuarios } from "@/modules/auth/credenciais";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login — Essencial Centro",
  description: "Acesso seguro ao painel profissional e ao portal do cliente da Essencial Centro.",
};

export default async function EntrarPage() {
  const permitirPrimeiroAcesso = !(await possuiUsuarios());

  return (
    <main className="grid min-h-screen bg-cream lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-forest p-12 text-cream lg:flex">
        <Logo inverted />
        <div>
          <h1 className="max-w-md font-serif text-4xl leading-tight font-semibold text-balance">
            O cuidado continua além da sessão.
          </h1>
          <p className="mt-4 max-w-md leading-relaxed text-pretty text-cream/75">
            Acesse fichas, evolução de medidas, próximas sessões e documentos com segurança e
            privacidade, tudo em um só lugar.
          </p>
        </div>
        <p className="text-xs text-cream/50">Dados sensíveis protegidos conforme a LGPD.</p>
      </div>

      <div className="flex flex-col bg-cream">
        <header className="flex items-center justify-between p-6">
          <span className="lg:hidden">
            <Logo />
          </span>
          <Link
            className="ml-auto text-sm font-medium text-ink-soft transition-colors hover:text-forest"
            href="/"
          >
            Voltar ao site
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <FormularioEntrada permitirPrimeiroAcesso={permitirPrimeiroAcesso} />
        </div>
      </div>
    </main>
  );
}
