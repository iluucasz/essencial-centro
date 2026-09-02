import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { obterRegistroControle } from "@/modules/controles/queries";

/**
 * Proxy autenticado para o anexo de um registro de controle — nunca expõe a URL do Vercel Blob
 * direto no HTML. Reautoriza a cada request via `obterRegistroControle`. Mesmo padrão de
 * app/api/documentos/[id]/arquivo.
 *
 * ⚠️ O store do Vercel Blob está em modo público (access:"public"), não privado — mesmo aviso
 * documentado em docs/context/06-lgpd-seguranca.md.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const registro = await obterRegistroControle(id);

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
        "Content-Disposition": `inline; filename="${encodeURIComponent(registro.arquivoNome ?? "anexo")}"`,
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
