import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { obterDocumento } from "@/modules/documentos/queries";

/**
 * Proxy autenticado para o arquivo original anexado a um documento (ex.: o PDF do aparelho de
 * biorressonância): nunca expõe a URL do Vercel Blob no HTML/UI — reautoriza a cada request via
 * `obterDocumento`, que já aplica role + posse e barra tipo clínico interno para o cliente.
 *
 * ⚠️ O store do Vercel Blob está em modo público (access:"public"), não privado — mesmo aviso de
 * app/api/fotos/[id]/imagem. Ver docs/context/06-lgpd-seguranca.md.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const registro = await obterDocumento(id);

    if (!registro?.arquivoPathname) {
      return new NextResponse("Arquivo não encontrado.", { status: 404 });
    }

    const resultado = await get(registro.arquivoPathname, { access: "public" });

    if (!resultado || resultado.statusCode !== 200) {
      return new NextResponse("Arquivo não encontrado.", { status: 404 });
    }

    return new NextResponse(resultado.stream, {
      headers: {
        "Content-Type": registro.arquivoContentType ?? resultado.blob.contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(registro.arquivoNome ?? "documento.pdf")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      return new NextResponse("Não autorizado.", { status: error.status });
    }

    throw error;
  }
}
