import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react";

import { assinarDocumento } from "@/modules/documentos/actions";
import { podeAssinarDocumento } from "@/modules/documentos/assinatura";
import { BotaoImprimir } from "@/modules/documentos/components/botao-imprimir";
import { obterDocumento } from "@/modules/documentos/queries";
import { rotulosTipoDocumento } from "@/modules/documentos/schema";

function formatarDataHora(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(data);
}

export default async function MeuDocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const documento = await obterDocumento(id);

  if (!documento) {
    notFound();
  }

  return (
    <main className="area-interna mx-auto min-h-screen w-full max-w-[1600px] bg-creme px-6 py-8">
      <div className="mx-auto grid max-w-2xl gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand print:hidden"
          href="/portal/documentos"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar aos documentos
        </Link>

        <header className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <FileText className="size-4" aria-hidden="true" />
            {rotulosTipoDocumento[documento.tipo]}
          </p>
          <BotaoImprimir />
        </header>

        <div className="grid gap-4 rounded-lg border border-border bg-surface p-6">
          <h1 className="text-xl font-semibold text-roxo">{documento.titulo}</h1>
          <p className="text-xs text-muted">Emitido em {formatarDataHora(documento.criadoEm)}</p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{documento.conteudo}</p>
        </div>

        {documento.status === "assinado" ? (
          <p className="flex items-center gap-2 text-sm font-medium text-brand" role="status">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Assinado em {formatarDataHora(documento.assinadoEm!)}.
          </p>
        ) : podeAssinarDocumento(documento.status) ? (
          <form action={assinarDocumento} className="grid gap-3 print:hidden">
            <input name="id" type="hidden" value={documento.id} />
            <p className="text-sm text-muted">
              Ao clicar em assinar, você confirma que leu e concorda com o conteúdo acima.
            </p>
            <button
              className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              type="submit"
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Confirmar e assinar
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
