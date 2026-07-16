import { NextResponse } from "next/server";

import { autorizarSegredoBridge, relatarIdentificacao } from "@/modules/biometria/bridge";
import { relatarIdentificacaoSchema } from "@/modules/biometria/schema";

/**
 * A ponte reporta o resultado de uma tentativa real de leitura (não chamar isso a cada tick
 * ocioso do loop contínuo — só quando o FTRIdentify realmente rodou e produziu um candidato ou um
 * "sem candidato" definitivo). O servidor revalida tudo antes de gravar qualquer check-in.
 */
export async function POST(request: Request) {
  if (!autorizarSegredoBridge(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = relatarIdentificacaoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const resultado = await relatarIdentificacao(parsed.data);

  return NextResponse.json(resultado);
}
