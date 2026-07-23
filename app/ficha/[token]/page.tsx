import type { ReactNode } from "react";
import { CheckCircle2, ClipboardList, Clock, TriangleAlert } from "lucide-react";

import { camposVisiveisParaCliente } from "@/modules/fichas/campos";
import { FormularioFichaPublica } from "@/modules/fichas/components/formulario-ficha-publica";
import { obterFichaPorToken } from "@/modules/fichas/public-queries";
import { tokenFichaExpirado } from "@/modules/fichas/token";

export const metadata = {
  title: "Ficha de anamnese — Essencial Centro",
};

function Moldura({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full justify-center bg-creme px-4 py-10">
      <div className="w-full max-w-2xl">
        <header className="mb-6 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
            <ClipboardList className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted">Essencial Centro</p>
            <p className="text-lg font-semibold text-brand">Ficha de anamnese</p>
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

export default async function FichaPublicaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dados = await obterFichaPorToken(token);

  if (!dados) {
    return (
      <Moldura>
        <Aviso
          icone={<TriangleAlert className="size-7" aria-hidden="true" />}
          titulo="Link inválido"
          texto="Este link de ficha não foi encontrado. Confirme com a profissional se ele está correto."
          tom="perigo"
        />
      </Moldura>
    );
  }

  if (dados.status !== "aguardando_cliente") {
    return (
      <Moldura>
        <Aviso
          icone={<CheckCircle2 className="size-7" aria-hidden="true" />}
          titulo="Ficha já preenchida"
          texto="Esta ficha já foi enviada. Se precisar alterar algo, fale com a Essencial Centro."
          tom="brand"
        />
      </Moldura>
    );
  }

  if (tokenFichaExpirado(dados.tokenExpiraEm)) {
    return (
      <Moldura>
        <Aviso
          icone={<Clock className="size-7" aria-hidden="true" />}
          titulo="Link expirado"
          texto="Este link não está mais válido. Peça um novo à profissional para preencher sua ficha."
        />
      </Moldura>
    );
  }

  const primeiroNome = dados.clienteNome.split(" ")[0] || dados.clienteNome;

  return (
    <Moldura>
      <div className="mb-5 grid gap-1">
        <h1 className="text-xl font-semibold text-foreground">Olá, {primeiroNome}!</h1>
        <p className="text-sm text-muted">
          Preencha sua ficha de <span className="font-semibold text-roxo">{dados.modeloNome}</span>.
          Leva poucos minutos.
        </p>
      </div>
      <FormularioFichaPublica
        campos={camposVisiveisParaCliente(dados.campos)}
        clientePrimeiroNome={primeiroNome}
        modeloNome={dados.modeloNome}
        token={token}
      />
    </Moldura>
  );
}
