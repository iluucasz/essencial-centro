import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { analiseClinica } from "@/modules/analises/schema";
import { ErroAutorizacao, autorizarPapel } from "@/modules/auth/rbac";

/**
 * Proxy autenticado para o PDF original de uma análise: nunca expõe a URL do Vercel Blob na UI e
 * reautoriza a cada request. Restrito a `profissional` — exame e boletim são dado clínico interno.
 *
 * ⚠️ O store do Vercel Blob está em modo público (access:"public"), não privado — mesmo aviso de
 * app/api/fotos/[id]/imagem. Ver docs/context/06-lgpd-seguranca.md.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    autorizarPapel(await auth(), ["profissional"]);
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      return new NextResponse(error.message, { status: error.status });
    }

    throw error;
  }

  const [registro] = await db
    .select({
      pathname: analiseClinica.arquivoPathname,
      nome: analiseClinica.arquivoNome,
      contentType: analiseClinica.arquivoContentType,
    })
    .from(analiseClinica)
    .where(eq(analiseClinica.id, id))
    .limit(1);

  if (!registro?.pathname) {
    return new NextResponse("Arquivo não encontrado.", { status: 404 });
  }

  const resultado = await get(registro.pathname, { access: "public" });

  if (!resultado || resultado.statusCode !== 200) {
    return new NextResponse("Arquivo não encontrado.", { status: 404 });
  }

  return new NextResponse(resultado.stream, {
    headers: {
      "Content-Type": registro.contentType ?? resultado.blob.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(registro.nome ?? "analise.pdf")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
