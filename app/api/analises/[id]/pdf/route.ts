import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { agoraBrasilia } from "@/lib/utils";
import { analiseClinica } from "@/modules/analises/schema";
import { gerarBufferPdfRecomendacao } from "@/modules/analises/pdf-recomendacao";
import { ErroAutorizacao, autorizarPapel } from "@/modules/auth/rbac";
import { usuario } from "@/modules/auth/schema";
import { cliente } from "@/modules/clientes/schema";

/**
 * PDF da recomendação terapêutica, pronto pra baixar — mesma montagem usada nos envios por
 * WhatsApp/e-mail (`modules/analises/actions.ts`), só que devolvido direto pro navegador em vez de
 * anexado. Restrito a `profissional`, igual ao proxy de `arquivo/route.ts`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  let usuarioAtual;

  try {
    usuarioAtual = autorizarPapel(await auth(), ["profissional"]);
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      return new NextResponse(error.message, { status: error.status });
    }

    throw error;
  }

  const [registro] = await db
    .select({
      tipo: analiseClinica.tipo,
      analiseIa: analiseClinica.analiseIa,
      prescricaoMedica: analiseClinica.prescricaoMedica,
      clienteNome: cliente.nome,
      clienteDataNascimento: cliente.dataNascimento,
      clientePeso: cliente.peso,
      clienteAltura: cliente.altura,
      clienteQueixas: cliente.queixas,
      clienteObjetivo: cliente.objetivoTratamento,
    })
    .from(analiseClinica)
    .innerJoin(cliente, eq(cliente.id, analiseClinica.clienteId))
    .where(eq(analiseClinica.id, id))
    .limit(1);

  if (!registro || registro.tipo !== "recomendacao") {
    return new NextResponse("Recomendação não encontrada.", { status: 404 });
  }

  const [dadosProfissional] = await db
    .select({ cargo: usuario.cargo })
    .from(usuario)
    .where(eq(usuario.id, usuarioAtual.id))
    .limit(1);

  const { buffer, nomeArquivo } = await gerarBufferPdfRecomendacao({
    clienteNome: registro.clienteNome,
    clienteDataNascimento: registro.clienteDataNascimento,
    clientePeso: registro.clientePeso,
    clienteAltura: registro.clienteAltura,
    clienteQueixas: registro.clienteQueixas,
    clienteObjetivo: registro.clienteObjetivo,
    profissionalNome: usuarioAtual.name ?? "Essencial Centro",
    profissionalCargo: dadosProfissional?.cargo ?? null,
    dataEmissao: agoraBrasilia(),
    conteudo: registro.analiseIa,
    prescricaoMedica: registro.prescricaoMedica,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(nomeArquivo)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
