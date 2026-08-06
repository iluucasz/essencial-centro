import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { relatarMinhaDor } from "@/modules/dor/actions";
import { MapaDeDor, type PontoDorNaTela } from "@/modules/dor/components/mapa-de-dor";
import { listarMeuMapaDeDor } from "@/modules/dor/queries";

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function MeuMapaDeDorPage() {
  let pontos: PontoDorNaTela[] = [];
  let erro: string | null = null;

  try {
    const registros = await listarMeuMapaDeDor();

    pontos = registros.map((ponto) => ({
      id: ponto.id,
      regiao: ponto.regiao,
      lado: ponto.lado,
      intensidade: ponto.intensidade,
      anterior: ponto.anterior,
      descricao: ponto.descricao,
      origem: ponto.origem,
      observacao: ponto.observacao,
      registradoEm: formatadorDataHora.format(ponto.registradoEm),
    }));
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      erro = error.message;
    } else {
      throw error;
    }
  }

  return (
    <main className="area-interna mx-auto min-h-screen w-full max-w-[1600px] bg-creme px-6 py-8">
      <div className="grid gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
          href="/portal"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao portal
        </Link>

        <header>
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <Activity className="size-4" aria-hidden="true" />
            Área do cliente
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-roxo">Meu mapa de dor</h1>
          <p className="mt-2 text-sm text-foreground">
            Marque no corpo onde você sente dor e o quanto dói, de 0 a 10. A profissional vê esses
            relatos antes do próximo atendimento.
          </p>
        </header>

        {erro ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            {erro}
          </div>
        ) : (
          <MapaDeDor comoCliente pontos={pontos} registrar={relatarMinhaDor} />
        )}
      </div>
    </main>
  );
}
