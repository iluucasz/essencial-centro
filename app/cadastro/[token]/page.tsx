import type { ReactNode } from "react";
import { CheckCircle2, Clock, TriangleAlert, UserRoundPlus } from "lucide-react";

import { FormularioCadastroPublico } from "@/modules/clientes/components/formulario-cadastro-publico";
import { conviteExpirado } from "@/modules/clientes/convite";
import { obterConvitePorToken } from "@/modules/clientes/public-queries";

export const metadata = {
  title: "Cadastro — Essencial Centro",
};

function Moldura({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full justify-center bg-creme px-4 py-10">
      <div className="w-full max-w-2xl">
        <header className="mb-6 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
            <UserRoundPlus className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted">Essencial Centro</p>
            <p className="text-lg font-semibold text-brand">Cadastro de cliente</p>
          </div>
        </header>
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7">
          {children}
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Seus dados são tratados com sigilo e usados apenas para o seu atendimento.
        </p>
      </div>
    </main>
  );
}

function Aviso({
  icone,
  titulo,
  texto,
  tom = "muted",
}: {
  icone: ReactNode;
  titulo: string;
  texto: string;
  tom?: "brand" | "muted" | "perigo";
}) {
  const cor = tom === "brand" ? "text-brand" : tom === "perigo" ? "text-perigo" : "text-foreground";

  return (
    <div className="grid justify-items-center gap-3 py-6 text-center">
      <span className={`flex size-14 items-center justify-center rounded-full bg-creme ${cor}`}>
        {icone}
      </span>
      <h1 className={`text-lg font-semibold ${cor}`}>{titulo}</h1>
      <p className="max-w-sm text-sm text-muted">{texto}</p>
    </div>
  );
}

/** Autocadastro por link de WhatsApp — rota pública (sem login); autorização só pelo token. */
export default async function CadastroPublicoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const convite = await obterConvitePorToken(token);

  if (!convite) {
    return (
      <Moldura>
        <Aviso
          icone={<TriangleAlert className="size-7" aria-hidden="true" />}
          titulo="Link inválido"
          texto="Este link de cadastro não foi encontrado. Confirme com a Essencial Centro se ele está correto."
          tom="perigo"
        />
      </Moldura>
    );
  }

  if (convite.status !== "pendente") {
    return (
      <Moldura>
        <Aviso
          icone={<CheckCircle2 className="size-7" aria-hidden="true" />}
          titulo="Cadastro já enviado"
          texto="Este cadastro já foi preenchido. Se precisar alterar algo, fale com a Essencial Centro."
          tom="brand"
        />
      </Moldura>
    );
  }

  if (conviteExpirado(convite.tokenExpiraEm)) {
    return (
      <Moldura>
        <Aviso
          icone={<Clock className="size-7" aria-hidden="true" />}
          titulo="Link expirado"
          texto="Este link não está mais válido. Peça um novo à Essencial Centro para fazer seu cadastro."
        />
      </Moldura>
    );
  }

  return (
    <Moldura>
      <div className="mb-5 grid gap-1">
        <h1 className="text-xl font-semibold text-foreground">Olá! Seja bem-vinda(o).</h1>
        <p className="text-sm text-muted">
          Preencha seus dados para agilizar seu atendimento. Leva poucos minutos.
        </p>
      </div>
      <FormularioCadastroPublico telefone={convite.telefone} token={token} />
    </Moldura>
  );
}
