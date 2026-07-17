import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { obterFotoPerfilClienteAutorizada } from "@/modules/fotos/perfil-queries";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const registro = await obterFotoPerfilClienteAutorizada(id);

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
