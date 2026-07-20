import { Suspense } from "react"
import Link from "next/link"
import { Logo } from "@/components/site/logo"
import { AccessForm } from "@/components/access/access-form"

export const metadata = {
  title: "Área restrita — Essencial Centro",
  description: "Acesso seguro ao portal da profissional e ao portal do cliente da Essencial Centro.",
}

export default function AccessPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative hidden flex-col justify-between bg-forest p-12 text-cream lg:flex">
        <Logo inverted />
        <div>
          <h1 className="max-w-md text-balance font-serif text-4xl font-semibold leading-tight">
            O cuidado continua além da sessão.
          </h1>
          <p className="mt-4 max-w-md text-pretty leading-relaxed text-cream/75">
            Acesse fichas, evolução de medidas, próximas sessões e documentos com segurança e
            privacidade — tudo em um só lugar.
          </p>
        </div>
        <p className="text-xs text-cream/50">Dados sensíveis protegidos conforme a LGPD.</p>
      </div>

      {/* Form side */}
      <div className="flex flex-col bg-cream">
        <header className="flex items-center justify-between p-6">
          <span className="lg:hidden">
            <Logo />
          </span>
          <Link
            href="/"
            className="ml-auto text-sm font-medium text-ink-soft transition-colors hover:text-forest"
          >
            Voltar ao site
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <Suspense>
            <AccessForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
