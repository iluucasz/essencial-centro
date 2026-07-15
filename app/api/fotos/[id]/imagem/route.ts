import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { obterFotoAutorizada } from "@/modules/fotos/queries";

/**
 * Proxy autenticado para o binário da foto: nunca expõe a URL do Vercel Blob no HTML/UI —
 * reautoriza (role + posse) a cada request antes de servir o arquivo.
 *
 * ⚠️ O store do Vercel Blob está em modo público (access:"public"), não privado — ver aviso
 * completo em docs/context/06-lgpd-seguranca.md. Esta rota é defesa em profundidade (a app nunca
 * revela a URL real), mas não substitui reconfigurar o store como privado.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const registro = await obterFotoAutorizada(id);

    if (!registro) {
      return new NextResponse("Foto não encontrada.", { status: 404 });
    }

    const resultado = await get(registro.pathname, { access: "public" });

    if (!resultado || resultado.statusCode !== 200) {
      return new NextResponse("Foto não encontrada.", { status: 404 });
    }

    return new NextResponse(resultado.stream, {
      headers: {
        "Content-Type": resultado.blob.contentType,
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
