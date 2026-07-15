import Link from "next/link";
import { ArrowLeft, ChevronRight, FileText } from "lucide-react";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { listarMeusDocumentos } from "@/modules/documentos/queries";
import { rotulosStatusDocumento, rotulosTipoDocumento } from "@/modules/documentos/schema";

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(data);
}

export default async function MeusDocumentosPage() {
  let documentos: Awaited<ReturnType<typeof listarMeusDocumentos>> = [];
  let erro: string | null = null;

  try {
    documentos = await listarMeusDocumentos();
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
            <FileText className="size-4" aria-hidden="true" />
            Área do cliente
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-roxo">Meus documentos</h1>
          <p className="mt-2 text-sm text-foreground">
            Contratos, termos e orientações emitidos pela clínica.
          </p>
        </header>

        {erro ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            {erro}
          </div>
        ) : documentos.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            Nenhum documento emitido ainda.
          </div>
        ) : (
          <ul className="grid gap-3">
            {documentos.map((documento) => (
              <li key={documento.id}>
                <Link
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-4 transition hover:bg-creme"
                  href={`/portal/documentos/${documento.id}`}
                >
                  <span>
                    <span className="block font-medium text-foreground">{documento.titulo}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {rotulosTipoDocumento[documento.tipo]} · {formatarData(documento.criadoEm)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className={
                        documento.status === "assinado"
                          ? "rounded-full bg-brand/15 px-2.5 py-1 text-xs font-medium text-brand"
                          : "rounded-full bg-lilas/25 px-2.5 py-1 text-xs font-medium text-roxo"
                      }
                    >
                      {rotulosStatusDocumento[documento.status]}
                    </span>
                    <ChevronRight className="size-4 text-muted" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
