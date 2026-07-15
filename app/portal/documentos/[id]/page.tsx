import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react";

import { podeAssinarDocumento } from "@/modules/documentos/assinatura";
import { BotaoImprimir } from "@/modules/documentos/components/botao-imprimir";
import { PainelAssinatura } from "@/modules/documentos/components/painel-assinatura";
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
          <div className="grid gap-3 rounded-lg border border-border bg-surface p-6">
            <p className="flex items-center gap-2 text-sm font-medium text-brand" role="status">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Assinado eletronicamente em {formatarDataHora(documento.assinadoEm!)}.
            </p>
            {documento.assinaturaImagemDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URI capturado do canvas, sem otimização de imagem aplicável
              <img
                alt="Assinatura"
                className="h-24 w-fit rounded border border-border bg-white"
                src={documento.assinaturaImagemDataUrl}
              />
            ) : null}
            <dl className="grid gap-1 text-xs text-muted">
              {documento.assinaturaIp ? (
                <div>
                  <dt className="inline font-medium">IP: </dt>
                  <dd className="inline">{documento.assinaturaIp}</dd>
                </div>
              ) : null}
              {documento.conteudoHash ? (
                <div>
                  <dt className="inline font-medium">Verificação (SHA-256): </dt>
                  <dd className="inline font-mono break-all">{documento.conteudoHash}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : podeAssinarDocumento(documento.status) ? (
          <PainelAssinatura documentoId={documento.id} />
        ) : null}
      </div>
    </main>
  );
}
